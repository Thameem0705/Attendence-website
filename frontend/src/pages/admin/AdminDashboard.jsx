import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Users, FileX, CalendarCheck, TrendingUp, UserCheck, Briefcase, GraduationCap, Clock, BarChart3, Percent, UserX } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Helper: check if a date string (YYYY-MM-DD) falls on Sunday
const isSunday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0;
};

// Helper: count working days (non-Sunday) in a month
const getWorkingDaysInMonth = (year, month) => {
    const lastDay = new Date(year, month, 0).getDate();
    let count = 0;
    for (let d = 1; d <= lastDay; d++) {
        const date = new Date(year, month - 1, d);
        if (date.getDay() !== 0) count++;
    }
    return count;
};

const getCurrentWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    return DAY_LABELS.map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() + mondayOffset + i);
        return d.toISOString().split('T')[0];
    });
};

export const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        presentToday: 0,
        absentToday: 0,
        pendingRequests: 0,
        totalStaff: 0,
        totalTrainees: 0,
        attendanceRate: 0,
        isSundayToday: false,
    });
    const [loading, setLoading] = useState(true);
    const [weeklyPresent, setWeeklyPresent] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [weeklyAbsent, setWeeklyAbsent] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const isTodaySunday = today.getDay() === 0;

            // 1. Total users
            const { data: allProfiles, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('role, name, username, created_at')
                .in('role', ['user', 'staff', 'trainee']);

            if (!profilesError && allProfiles) {
                const staffCount = allProfiles.filter(p => p.role === 'staff').length;
                const traineeCount = allProfiles.filter(p => p.role === 'trainee').length;
                setStats(s => ({
                    ...s,
                    totalUsers: allProfiles.length,
                    totalStaff: staffCount,
                    totalTrainees: traineeCount,
                    isSundayToday: isTodaySunday,
                }));
            }

            // 2. Today's attendance (skip if Sunday)
            if (!isTodaySunday) {
                const { data: todayAttendance, error: todayError } = await supabaseAdmin
                    .from('attendance')
                    .select('status')
                    .eq('date', todayStr);

                if (!todayError && todayAttendance) {
                    const present = todayAttendance.filter(a => a.status === 'present').length;
                    const absent = todayAttendance.filter(a => a.status === 'absent').length;
                    const total = present + absent;
                    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                    setStats(s => ({ ...s, presentToday: present, absentToday: absent, attendanceRate: rate }));
                }
            }

            // 3. Pending requests
            const { count: requestCount, error: requestError } = await supabaseAdmin
                .from('permission_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (!requestError) setStats(s => ({ ...s, pendingRequests: requestCount || 0 }));

            // 4. Weekly attendance (exclude Sunday from data, but still show the column)
            const weekDates = getCurrentWeekDates();
            const { data: attendanceData, error: attendanceError } = await supabaseAdmin
                .from('attendance')
                .select('date, status')
                .in('date', weekDates);

            if (!attendanceError && attendanceData) {
                setWeeklyPresent(weekDates.map(date =>
                    isSunday(date) ? 0 : attendanceData.filter(a => a.date === date && a.status === 'present').length
                ));
                setWeeklyAbsent(weekDates.map(date =>
                    isSunday(date) ? 0 : attendanceData.filter(a => a.date === date && a.status === 'absent').length
                ));
            }

            // 5. Monthly trend (last 6 months) — exclude Sundays from calculations
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const year = d.getFullYear();
                const month = d.getMonth();
                const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                const label = d.toLocaleDateString('en-US', { month: 'short' });
                monthlyData.push({ startDate, endDate, label });
            }

            const { data: sixMonthData, error: sixMonthError } = await supabaseAdmin
                .from('attendance')
                .select('date, status')
                .gte('date', monthlyData[0].startDate)
                .lte('date', monthlyData[5].endDate);

            if (!sixMonthError && sixMonthData) {
                const trend = monthlyData.map(m => {
                    // Filter out Sunday records
                    const records = sixMonthData.filter(a => a.date >= m.startDate && a.date <= m.endDate && !isSunday(a.date));
                    const present = records.filter(a => a.status === 'present').length;
                    const total = records.length;
                    return { label: m.label, rate: total > 0 ? Math.round((present / total) * 100) : 0, present, total };
                });
                setMonthlyTrend(trend);
            }

            // 6. Recent activity
            const { data: recentAttendance } = await supabaseAdmin
                .from('attendance')
                .select('date, status, user_id, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: recentRequests } = await supabaseAdmin
                .from('permission_requests')
                .select('date, status, user_id, created_at, reason')
                .order('created_at', { ascending: false })
                .limit(3);

            const activities = [];
            if (recentAttendance) {
                recentAttendance.forEach(a => activities.push({
                    type: 'attendance', ...a,
                    description: `Marked ${a.status} for ${new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                }));
            }
            if (recentRequests) {
                recentRequests.forEach(r => activities.push({
                    type: 'request', ...r,
                    description: `Permission request (${r.status}) for ${new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                }));
            }
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setRecentActivity(activities.slice(0, 6));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Chart configs
    const lineChartData = {
        labels: DAY_LABELS,
        datasets: [
            {
                label: 'Present',
                data: weeklyPresent,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: DAY_LABELS.map((_, i) => i === 6 ? 0 : 5), // hide Sunday point
                pointHoverRadius: DAY_LABELS.map((_, i) => i === 6 ? 0 : 8),
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 3,
            },
            {
                label: 'Absent',
                data: weeklyAbsent,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: DAY_LABELS.map((_, i) => i === 6 ? 0 : 5),
                pointHoverRadius: DAY_LABELS.map((_, i) => i === 6 ? 0 : 8),
                pointBackgroundColor: 'rgb(239, 68, 68)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 3,
            },
        ],
    };

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                display: true, position: 'top', align: 'end',
                labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12, weight: '600' } },
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { size: 13, weight: '700' },
                bodyFont: { size: 12 },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    title: (items) => {
                        const idx = items[0]?.dataIndex;
                        return idx === 6 ? 'Sunday (Holiday)' : DAY_LABELS[idx];
                    }
                }
            },
        },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { precision: 0, font: { size: 11 }, color: '#64748b' }, border: { display: false } },
            x: {
                grid: { display: false },
                ticks: {
                    font: { size: 12, weight: '600' },
                    color: DAY_LABELS.map((_, i) => i === 6 ? '#ef4444' : '#334155'),
                    callback: function (value, index) {
                        return index === 6 ? 'Sun ☀️' : DAY_LABELS[index];
                    }
                },
                border: { display: false }
            },
        },
    };

    const doughnutData = {
        labels: ['Staff', 'Trainees'],
        datasets: [{
            data: [stats.totalStaff, stats.totalTrainees],
            backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(168, 85, 247, 0.8)'],
            borderColor: ['rgb(59, 130, 246)', 'rgb(168, 85, 247)'],
            borderWidth: 2,
            hoverOffset: 6,
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16, font: { size: 12, weight: '600' } } },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', cornerRadius: 8, padding: 10 }
        }
    };

    const barChartData = {
        labels: monthlyTrend.map(m => m.label),
        datasets: [{
            label: 'Attendance Rate %',
            data: monthlyTrend.map(m => m.rate),
            backgroundColor: monthlyTrend.map((_, i) => i === monthlyTrend.length - 1 ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.3)'),
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            borderRadius: 8,
            borderSkipped: false,
        }]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', cornerRadius: 8, padding: 10 }
        },
        scales: {
            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148,163,184,0.12)' }, ticks: { font: { size: 11 }, color: '#64748b', callback: v => v + '%' }, border: { display: false } },
            x: { grid: { display: false }, ticks: { font: { size: 12, weight: '600' }, color: '#334155' }, border: { display: false } },
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-20 w-full rounded-2xl"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 skeleton h-72 rounded-2xl"></div>
                    <div className="skeleton h-72 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{greeting} 👋</h1>
                <p className="text-slate-500 mt-1">{today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            {/* Sunday Banner */}
            {stats.isSundayToday && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <span className="text-2xl">☀️</span>
                    <div>
                        <p className="font-bold text-amber-800">Today is Sunday — Holiday!</p>
                        <p className="text-sm text-amber-600">No attendance is taken on Sundays.</p>
                    </div>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="indigo" delay={0} />
                <StatCard icon={CalendarCheck} label="Present Today" value={stats.isSundayToday ? '—' : stats.presentToday} color="emerald" delay={1} />
                <StatCard icon={UserX} label="Absent Today" value={stats.isSundayToday ? '—' : stats.absentToday} color="red" delay={2} />
                <StatCard icon={Percent} label="Today's Rate" value={stats.isSundayToday ? 'Holiday' : `${stats.attendanceRate}%`} color="cyan" delay={3} />
                <StatCard icon={Briefcase} label="Total Staff" value={stats.totalStaff} color="blue" delay={4} />
                <StatCard icon={GraduationCap} label="Total Trainees" value={stats.totalTrainees} color="purple" delay={5} />
            </div>

            {/* Pending Requests Alert */}
            {stats.pendingRequests > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                        <FileX className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-800">{stats.pendingRequests} Pending Request{stats.pendingRequests > 1 ? 's' : ''}</p>
                        <p className="text-sm text-amber-600">Awaiting your review</p>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Weekly Attendance</h3>
                            <p className="text-xs sm:text-sm text-slate-500">Mon–Sat (Sunday = Holiday)</p>
                        </div>
                    </div>
                    <div className="h-56 sm:h-72">
                        <Line data={lineChartData} options={lineChartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Role Distribution</h3>
                    </div>
                    <div className="h-48 sm:h-56">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-blue-50 rounded-xl p-2">
                            <p className="text-lg font-bold text-blue-700">{stats.totalStaff}</p>
                            <p className="text-xs text-blue-600">Staff</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-2">
                            <p className="text-lg font-bold text-purple-700">{stats.totalTrainees}</p>
                            <p className="text-xs text-purple-600">Trainees</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-50 p-2 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-800">Monthly Trend</h3>
                            <p className="text-xs sm:text-sm text-slate-500">Attendance rate (excl. Sundays)</p>
                        </div>
                    </div>
                    <div className="h-48 sm:h-56">
                        <Bar data={barChartData} options={barChartOptions} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-cyan-50 p-2 rounded-lg">
                            <Clock className="w-5 h-5 text-cyan-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Recent Activity</h3>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
                        ) : (
                            recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${activity.type === 'attendance'
                                        ? activity.status === 'present' ? 'bg-emerald-500' : 'bg-red-500'
                                        : activity.status === 'pending' ? 'bg-amber-500' : activity.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                                        }`}></div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-slate-700 truncate">{activity.description}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(activity.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Daily Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">Daily Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                {DAY_LABELS.map((day, i) => (
                                    <th key={day} className={`px-3 sm:px-6 py-3 text-center ${i === 6 ? 'text-amber-600 bg-amber-50' : ''}`}>
                                        {i === 6 ? '☀️ Sun' : day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                {weeklyPresent.map((count, i) => (
                                    <td key={i} className={`px-3 sm:px-6 py-3 text-center ${i === 6 ? 'bg-amber-50/50' : ''}`}>
                                        {i === 6 ? (
                                            <span className="text-xs text-amber-500 font-semibold">Holiday</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <UserCheck className="w-3 h-3 hidden sm:inline" />{count}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                            <tr>
                                {weeklyAbsent.map((count, i) => (
                                    <td key={i} className={`px-3 sm:px-6 py-3 text-center ${i === 6 ? 'bg-amber-50/50' : ''}`}>
                                        {i === 6 ? (
                                            <span className="text-xs text-amber-500">—</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                                <FileX className="w-3 h-3 hidden sm:inline" />{count}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        cyan: 'bg-cyan-50 text-cyan-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
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
