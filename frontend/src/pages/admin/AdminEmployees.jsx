import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import toast from 'react-hot-toast';
import {
    Users, Search, ArrowLeft, Mail, MapPin, Shield, Calendar,
    CheckCircle2, XCircle, TrendingUp, Clock, ChevronLeft, ChevronRight,
    User, Phone
} from 'lucide-react';

export const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .in('role', ['user', 'staff', 'trainee'])
                .order('name', { ascending: true });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            toast.error('Failed to load employees');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(e => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (e.name && e.name.toLowerCase().includes(q)) ||
            (e.username && e.username.toLowerCase().includes(q)) ||
            (e.phone && e.phone.toLowerCase().includes(q))
        );
    });

    if (selectedEmployee) {
        return <EmployeeDetail employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-fade-in-up">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Employee Directory</h2>
                            <p className="text-sm text-slate-500">{employees.length} employees registered</p>
                        </div>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Employee Cards Grid */}
            {loading ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center text-slate-500">
                    Loading employees...
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center text-slate-500">
                    No employees found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map(emp => (
                        <button
                            key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left card-hover-lift group animate-fade-in-up"
                            style={{ animationDelay: `${0.05 * filteredEmployees.indexOf(emp)}s` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                                    <User className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 truncate">{emp.name || 'Unnamed'}</h3>
                                    <p className="text-sm text-slate-500 truncate">@{emp.username || 'N/A'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
                                            ${emp.role === 'staff' ? 'bg-blue-100 text-blue-700'
                                                : emp.role === 'trainee' ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-emerald-100 text-emerald-700'}`}>
                                            {emp.role}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-1" />
                            </div>
                            {emp.phone && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span className="truncate">{emp.phone}</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================
// Employee Detail View
// =============================================
const EmployeeDetail = ({ employee, onBack }) => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        fetchAttendance();
    }, [selectedMonth]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            // Calculate date range for the selected month
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            const { data, error } = await supabaseAdmin
                .from('attendance')
                .select('*')
                .eq('user_id', employee.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) throw error;
            setAttendance(data || []);
        } catch (error) {
            toast.error('Failed to load attendance');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Exclude Sundays from stats
    const isSunday = (dateStr) => new Date(dateStr + 'T00:00:00').getDay() === 0;
    const workingRecords = attendance.filter(a => !isSunday(a.date));
    const presentCount = workingRecords.filter(a => a.status === 'present').length;
    const absentCount = workingRecords.filter(a => a.status === 'absent').length;
    const totalDays = workingRecords.length;
    const attendancePercent = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

    const navigateMonth = (direction) => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const d = new Date(year, month - 1 + direction, 1);
        setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    };

    const monthLabel = (() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    })();

    const joinedDate = employee.created_at
        ? new Date(employee.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Employee Details</h2>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-8">
                        <div className="w-16 h-16 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                            <User className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold text-slate-800">{employee.name || 'Unnamed'}</h3>
                            <p className="text-slate-500">@{employee.username || 'N/A'}</p>
                        </div>
                        <span className={`self-start md:self-auto px-3 py-1 rounded-full text-sm font-semibold capitalize
                            ${employee.role === 'staff' ? 'bg-blue-100 text-blue-700'
                                : employee.role === 'trainee' ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'}`}>
                            {employee.role}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Phone className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-xs text-slate-500">Phone</p>
                                <p className="text-sm font-medium text-slate-800">{employee.phone || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <MapPin className="w-5 h-5 text-pink-500" />
                            <div>
                                <p className="text-xs text-slate-500">Address</p>
                                <p className="text-sm font-medium text-slate-800">{employee.address || 'No address'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                            <div>
                                <p className="text-xs text-slate-500">Joined</p>
                                <p className="text-sm font-medium text-slate-800">{joinedDate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500 uppercase">Total Days</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{totalDays}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 uppercase">Present</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-red-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-medium text-red-600 uppercase">Absent</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-medium text-indigo-600 uppercase">Attendance %</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">{attendancePercent}%</p>
                </div>
            </div>

            {/* Attendance Records Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Attendance Records</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center">
                            {monthLabel}
                        </span>
                        <button
                            onClick={() => navigateMonth(1)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Day</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Recorded At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading records...</td>
                                </tr>
                            ) : attendance.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                        No attendance records for {monthLabel}.
                                    </td>
                                </tr>
                            ) : (
                                attendance.map((record, index) => {
                                    const recordDate = new Date(record.date + 'T00:00:00');
                                    const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
                                    const formattedDate = recordDate.toLocaleDateString('en-US', {
                                        year: 'numeric', month: 'short', day: 'numeric'
                                    });
                                    const isSun = recordDate.getDay() === 0;
                                    return (
                                        <tr key={record.id} className={`hover:bg-slate-50/50 transition-colors ${isSun ? 'bg-amber-50/30' : ''}`}>
                                            <td className="px-6 py-3 text-slate-400">{index + 1}</td>
                                            <td className="px-6 py-3 font-medium">{formattedDate}</td>
                                            <td className={`px-6 py-3 ${isSun ? 'text-amber-600 font-semibold' : 'text-slate-600'}`}>
                                                {isSun ? '☀️ Sunday' : dayName}
                                            </td>
                                            <td className="px-6 py-3">
                                                {isSun ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                                        Holiday
                                                    </span>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                                        ${record.status === 'present'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-red-100 text-red-700'}`}>
                                                        {record.status === 'present'
                                                            ? <CheckCircle2 className="w-3 h-3" />
                                                            : <XCircle className="w-3 h-3" />}
                                                        {record.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-slate-500 text-xs">
                                                {isSun ? '—' : new Date(record.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
