import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarCheck, CalendarDays, CalendarIcon, Award, Activity, ClipboardList, TrendingUp, CheckCircle2, XCircle, Flame, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const UserDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalPresent: 0,
        totalAbsent: 0,
        totalDays: 0,
        percentage: 0,
        monthlyPresent: 0,
        monthlyAbsent: 0,
        monthlyPercentage: 0,
        currentStreak: 0,
        todayStatus: null,
    });
    const [recentRecords, setRecentRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data: allAttendance, error: attnError } = await supabaseAdmin
                .from('attendance')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (attnError) throw attnError;
            const records = allAttendance || [];

            // Helper: check if date is Sunday
            const isSunday = (dateStr) => new Date(dateStr + 'T00:00:00').getDay() === 0;
            const isTodaySunday = new Date().getDay() === 0;

            // Exclude Sundays from stats
            const workingRecords = records.filter(r => !isSunday(r.date));

            // Overall (excluding Sundays)
            const totalDays = workingRecords.length;
            const totalPresent = workingRecords.filter(r => r.status === 'present').length;
            const totalAbsent = workingRecords.filter(r => r.status === 'absent').length;
            const percentage = totalDays > 0 ? ((totalPresent / totalDays) * 100).toFixed(1) : 0;

            // Monthly (excluding Sundays)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyRecords = workingRecords.filter(r => {
                const d = new Date(r.date + 'T00:00:00');
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const monthlyPresent = monthlyRecords.filter(r => r.status === 'present').length;
            const monthlyAbsent = monthlyRecords.filter(r => r.status === 'absent').length;
            const monthlyDays = monthlyRecords.length;
            const monthlyPercentage = monthlyDays > 0 ? ((monthlyPresent / monthlyDays) * 100).toFixed(1) : 0;

            // Streak (skip Sunday records)
            let streak = 0;
            const sortedWorking = [...workingRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
            for (const r of sortedWorking) {
                if (r.status === 'present') streak++;
                else break;
            }

            // Today's status
            const todayRecord = records.find(r => r.date === today);

            setStats({
                totalPresent, totalAbsent, totalDays, percentage,
                monthlyPresent, monthlyAbsent, monthlyPercentage,
                currentStreak: streak,
                todayStatus: isTodaySunday ? 'holiday' : (todayRecord ? todayRecord.status : null),
            });

            // Recent 7 records
            setRecentRecords(records.slice(0, 7));

        } catch (error) {
            console.error(error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    if (loading) return (
        <div className="space-y-6">
            <div className="skeleton h-32 rounded-2xl"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl"></div>)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="skeleton h-56 rounded-2xl"></div>
                <div className="skeleton h-56 rounded-2xl"></div>
            </div>
        </div>
    );

    const attendanceColor = stats.percentage >= 75 ? 'emerald' : stats.percentage >= 50 ? 'amber' : 'red';

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 80, damping: 15, mass: 0.8 }
        }
    };

    return (
        <motion.div
            className="space-y-4 sm:space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome + Today Status */}
            <motion.div variants={itemVariants} className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-5 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 animate-[shine_8s_infinite_linear]"></div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1 relative z-10">Welcome Back, {user?.name || user?.username}!</h2>
                <p className="text-cyan-100 text-sm sm:text-base relative z-10">Here's your attendance overview</p>
                {stats.todayStatus && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm relative z-10 hover:bg-white/25 transition-colors"
                    >
                        {stats.todayStatus === 'holiday'
                            ? <><span className="text-lg">☀️</span><span className="font-semibold">Today is Sunday — Holiday!</span></>
                            : stats.todayStatus === 'present'
                                ? <><CheckCircle2 className="w-5 h-5 text-emerald-300" /><span className="font-semibold">You are marked Present today</span></>
                                : <><XCircle className="w-5 h-5 text-red-300" /><span className="font-semibold">You are marked Absent today</span></>
                        }
                    </motion.div>
                )}
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                <StatCard icon={Activity} label="Overall Rate" value={`${stats.percentage}%`} color={attendanceColor} />
                <StatCard icon={CalendarIcon} label="This Month" value={`${stats.monthlyPercentage}%`} color="indigo" />
                <StatCard icon={Award} label="Days Present" value={stats.totalPresent} color="emerald" />
                <StatCard icon={UserX} label="Days Absent" value={stats.totalAbsent} color="red" />
                <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`} color="orange" />
            </motion.div>

            {/* Monthly Breakdown + Progress */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Summary */}
                <motion.div
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm transition-all duration-300"
                >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                        This Month's Summary
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600">Attendance Rate</span>
                                <span className="font-bold text-slate-800">{stats.monthlyPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(stats.monthlyPercentage, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                    className={`h-3 rounded-full ${stats.monthlyPercentage >= 75 ? 'bg-emerald-500' :
                                        stats.monthlyPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                ></motion.div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/50">
                                <p className="text-lg sm:text-xl font-bold text-emerald-700">{stats.monthlyPresent}</p>
                                <p className="text-xs text-emerald-600">Present</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100/50">
                                <p className="text-lg sm:text-xl font-bold text-red-700">{stats.monthlyAbsent}</p>
                                <p className="text-xs text-red-600">Absent</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Records */}
                <motion.div
                    whileHover={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                    className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm transition-all duration-300"
                >
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Recent Attendance
                    </h3>
                    {recentRecords.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No records yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentRecords.map((record, index) => {
                                const d = new Date(record.date + 'T00:00:00');
                                return (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + (index * 0.1) }}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/50' : 'bg-red-100/80 text-red-700 ring-1 ring-red-200/50'
                                            }`}>
                                            {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {record.status}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link to="/dashboard/history" className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/80 transition-all group hover:shadow-md hover:-translate-y-1 block">
                        <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                            <h4 className="font-semibold text-slate-800 text-sm">Attendance History</h4>
                            <p className="text-xs text-slate-500">View your full attendance records</p>
                        </div>
                    </Link>
                    <Link to="/dashboard/requests" className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/80 transition-all group hover:shadow-md hover:-translate-y-1 block">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                            <h4 className="font-semibold text-slate-800 text-sm">Permission Requests</h4>
                            <p className="text-xs text-slate-500">Apply for leave or view past requests</p>
                        </div>
                    </Link>
                </div>
            </motion.div>

            <style jsx="true">{`
                @keyframes shine {
                    100% { right: 200%; }
                }
            `}</style>
        </motion.div>
    );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
    };
    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] text-center animate-fade-in-up hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 relative overflow-hidden`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-${color}-100 to-transparent rounded-bl-full opacity-50 pointer-events-none`}></div>
            <div className={`inline-flex p-2.5 sm:p-3 rounded-xl ${colorMap[color]} mb-2 relative z-10 ring-4 ring-${color}-50`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 relative z-10 tracking-tight">{value}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 relative z-10">{label}</p>
        </motion.div>
    );
};
