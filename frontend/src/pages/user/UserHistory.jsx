import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Calendar, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserHistory = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        if (user) fetchHistory();
    }, [user, selectedMonth]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const { data, error } = await supabaseAdmin
                .from('attendance')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            toast.error('Failed to load history');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (dir) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const d = new Date(year, month - 1 + dir, 1);
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = (() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    })();

    // Exclude Sundays from stats
    const isSunday = (dateStr) => new Date(dateStr + 'T00:00:00').getDay() === 0;
    const workingRecords = history.filter(r => !isSunday(r.date));
    const presentCount = workingRecords.filter(r => r.status === 'present').length;
    const absentCount = workingRecords.filter(r => r.status === 'absent').length;
    const total = workingRecords.length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-50 p-2.5 rounded-xl">
                            <FileText className="w-5 h-5 text-cyan-600" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">My Attendance History</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigateMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-700 min-w-[130px] text-center">{monthLabel}</span>
                        <button onClick={() => navigateMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Month Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{total}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Present</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700">{presentCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-red-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-red-600 uppercase">Absent</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">{absentCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-indigo-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Rate</p>
                    <p className="text-xl sm:text-2xl font-bold text-indigo-700">{rate}%</p>
                </div>
            </div>

            {/* Progress Bar */}
            {total > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Monthly Attendance</span>
                        <span className="font-bold text-slate-800">{rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                        <div className="h-3 bg-emerald-500 transition-all duration-500" style={{ width: `${(presentCount / total) * 100}%` }}></div>
                        <div className="h-3 bg-red-400 transition-all duration-500" style={{ width: `${(absentCount / total) * 100}%` }}></div>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Present</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Absent</span>
                    </div>
                </div>
            )}

            {/* Records Table / Cards */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading your history...</div>
                ) : history.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">No attendance records for {monthLabel}.</div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3">#</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Day</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Recorded</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {history.map((record, i) => {
                                        const d = new Date(record.date + 'T00:00:00');
                                        const isSun = d.getDay() === 0;
                                        return (
                                            <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors ${isSun ? 'bg-amber-50/30' : ''}`}>
                                                <td className="px-6 py-3 text-slate-400">{i + 1}</td>
                                                <td className="px-6 py-3 font-medium">
                                                    {d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className={`px-6 py-3 ${isSun ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>
                                                    {isSun ? '☀️ Sunday' : d.toLocaleDateString('en-US', { weekday: 'long' })}
                                                </td>
                                                <td className="px-6 py-3">
                                                    {isSun ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                            Holiday
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                            {record.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-slate-500 text-right text-xs">
                                                    {isSun ? '—' : new Date(record.created_at).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden divide-y divide-slate-100">
                            {history.map((record, i) => {
                                const d = new Date(record.date + 'T00:00:00');
                                const isSun = d.getDay() === 0;
                                return (
                                    <div key={record.id} className={`p-4 flex items-center justify-between ${isSun ? 'bg-amber-50/30' : ''}`}>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">
                                                {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className={`text-xs ${isSun ? 'text-amber-600 font-semibold' : 'text-slate-500'}`}>
                                                {isSun ? '☀️ Sunday' : d.toLocaleDateString('en-US', { weekday: 'long' })}
                                            </p>
                                        </div>
                                        {isSun ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                Holiday
                                            </span>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {record.status}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
