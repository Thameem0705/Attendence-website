import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarCheck, CalendarDays, CalendarIcon, Award, Activity, ClipboardList, TrendingUp, CheckCircle2, XCircle, Flame } from 'lucide-react';
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

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Welcome + Today Status */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-5 sm:p-8 text-white shadow-lg animate-fade-in-up" style={{ backgroundSize: '200% 200%', animation: 'gradientShift 6s ease infinite, fadeInUp 0.5s ease-out both' }}>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Welcome Back, {user?.name || user?.username}!</h2>
                <p className="text-cyan-100 text-sm sm:text-base">Here's your attendance overview</p>
                {stats.todayStatus && (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
                        {stats.todayStatus === 'holiday'
                            ? <><span className="text-lg">☀️</span><span className="font-semibold">Today is Sunday — Holiday!</span></>
                            : stats.todayStatus === 'present'
                                ? <><CheckCircle2 className="w-5 h-5 text-emerald-300" /><span className="font-semibold">You are marked Present today</span></>
                                : <><XCircle className="w-5 h-5 text-red-300" /><span className="font-semibold">You are marked Absent today</span></>
                        }
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={Activity} label="Overall Rate" value={`${stats.percentage}%`} color={attendanceColor} delay={0} />
                <StatCard icon={CalendarIcon} label="This Month" value={`${stats.monthlyPercentage}%`} color="indigo" delay={1} />
                <StatCard icon={Award} label="Days Present" value={stats.totalPresent} color="emerald" delay={2} />
                <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} day${stats.currentStreak !== 1 ? 's' : ''}`} color="orange" delay={3} />
            </div>

            {/* Monthly Breakdown + Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Monthly Summary */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
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
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ${stats.monthlyPercentage >= 75 ? 'bg-emerald-500' :
                                        stats.monthlyPercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(stats.monthlyPercentage, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 rounded-xl p-3 text-center">
                                <p className="text-lg sm:text-xl font-bold text-emerald-700">{stats.monthlyPresent}</p>
                                <p className="text-xs text-emerald-600">Present</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-3 text-center">
                                <p className="text-lg sm:text-xl font-bold text-red-700">{stats.monthlyAbsent}</p>
                                <p className="text-xs text-red-600">Absent</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Records */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-600" />
                        Recent Attendance
                    </h3>
                    {recentRecords.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">No records yet</p>
                    ) : (
                        <div className="space-y-2">
                            {recentRecords.map(record => {
                                const d = new Date(record.date + 'T00:00:00');
                                return (
                                    <div key={record.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {record.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Link to="/dashboard/history" className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/50 transition-all group card-hover-lift">
                        <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg group-hover:scale-110 transition-transform">
                            <CalendarCheck className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                            <h4 className="font-semibold text-slate-800 text-sm">Attendance History</h4>
                            <p className="text-xs text-slate-500">View your full attendance records</p>
                        </div>
                    </Link>
                    <Link to="/dashboard/requests" className="flex items-center p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all group card-hover-lift">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                            <h4 className="font-semibold text-slate-800 text-sm">Permission Requests</h4>
                            <p className="text-xs text-slate-500">Apply for leave or view past requests</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => {
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
        <div
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm card-hover-lift text-center animate-fade-in-up"
            style={{ animationDelay: `${delay * 0.08}s` }}
        >
            <div className={`inline-flex p-2.5 sm:p-3 rounded-xl ${colorMap[color]} mb-2`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">{label}</p>
        </div>
    );
};
