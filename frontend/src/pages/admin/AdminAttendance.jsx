import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Calendar as CalendarIcon, Search, CheckCircle2, XCircle, Save, ClipboardList, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminAttendance = () => {
    const [activeTab, setActiveTab] = useState('take');

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Tab Switcher */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm flex gap-1.5 animate-fade-in-up">
                <button
                    onClick={() => setActiveTab('take')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'take'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <ListChecks className="w-5 h-5" />
                    <span className="hidden sm:inline">Take</span> Attendance
                </button>
                <button
                    onClick={() => setActiveTab('records')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'records'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <ClipboardList className="w-5 h-5" />
                    Records
                </button>
            </div>

            {activeTab === 'take' ? <TakeAttendance /> : <AttendanceRecords />}
        </div>
    );
};

// =============================================
// Take Attendance Tab
// =============================================
const TakeAttendance = () => {
    const [users, setUsers] = useState([]);
    const [attendanceMap, setAttendanceMap] = useState({});
    const [existingRecords, setExistingRecords] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Check if selected date is Sunday
    const isSundayDate = new Date(selectedDate + 'T00:00:00').getDay() === 0;

    useEffect(() => {
        fetchUsersAndAttendance();
    }, [selectedDate]);

    const fetchUsersAndAttendance = async () => {
        setLoading(true);
        try {
            const { data: profilesData, error: profilesError } = await supabaseAdmin
                .from('profiles')
                .select('id, name, username, email, role, phone')
                .in('role', ['user', 'staff', 'trainee'])
                .order('name', { ascending: true });

            if (profilesError) throw profilesError;
            setUsers(profilesData || []);

            const { data: attendanceData, error: attendanceError } = await supabaseAdmin
                .from('attendance')
                .select('id, user_id, status')
                .eq('date', selectedDate);

            if (attendanceError) throw attendanceError;

            const aMap = {};
            const eMap = {};
            (attendanceData || []).forEach(record => {
                aMap[record.user_id] = record.status;
                eMap[record.user_id] = record.id;
            });
            setAttendanceMap(aMap);
            setExistingRecords(eMap);
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const markAllPresent = () => {
        const all = {};
        users.forEach(u => { all[u.id] = 'present'; });
        setAttendanceMap(all);
    };

    const markAllAbsent = () => {
        const all = {};
        users.forEach(u => { all[u.id] = 'absent'; });
        setAttendanceMap(all);
    };

    const ADMIN_WHATSAPP = '919342497791';
    const [whatsappList, setWhatsappList] = useState([]); // absent users to notify
    const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);

    const buildWhatsappUrl = (user, formattedDate) => {
        const msg = `Dear ${user.name || user.username},\n\nThis is to inform you that you have been marked *ABSENT* on *${formattedDate}*.\n\nIf this is an error, please contact the admin.\n\n— Admin (ITP Attendance System)`;
        const phone = user.phone.replace(/[^0-9]/g, '');
        const whatsappPhone = phone.startsWith('91') ? phone : '91' + phone;
        return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
    };

    const sendAllWhatsApp = () => {
        whatsappList.forEach(item => {
            window.open(item.url, '_blank');
        });
        toast.success(`Opened WhatsApp for ${whatsappList.length} absent employee(s)`);
    };

    const saveAttendance = async () => {
        const unmarked = users.filter(u => !attendanceMap[u.id]);
        if (unmarked.length > 0) {
            toast.error(`Please mark attendance for all users. ${unmarked.length} unmarked.`);
            return;
        }

        setSaving(true);
        try {
            const toInsert = [];
            const toUpdate = [];

            users.forEach(u => {
                const status = attendanceMap[u.id];
                if (existingRecords[u.id]) {
                    toUpdate.push({ id: existingRecords[u.id], status });
                } else {
                    toInsert.push({ user_id: u.id, date: selectedDate, status });
                }
            });

            if (toInsert.length > 0) {
                const { error: insertError } = await supabaseAdmin.from('attendance').insert(toInsert);
                if (insertError) throw insertError;
            }

            for (const record of toUpdate) {
                const { error: updateError } = await supabaseAdmin
                    .from('attendance')
                    .update({ status: record.status })
                    .eq('id', record.id);
                if (updateError) throw updateError;
            }

            toast.success(`Attendance saved for ${selectedDate}!`);

            // Build WhatsApp list for absent employees with phone
            const absentUsers = users.filter(u => attendanceMap[u.id] === 'absent' && u.phone);
            if (absentUsers.length > 0) {
                const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                const list = absentUsers.map(u => ({
                    ...u,
                    url: buildWhatsappUrl(u, formattedDate),
                    formattedDate
                }));
                setWhatsappList(list);
                setShowWhatsappPanel(true);
            }

            fetchUsersAndAttendance();
        } catch (error) {
            toast.error('Failed to save attendance: ' + (error.message || 'Unknown error'));
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
    const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length;
    const hasExistingRecords = Object.keys(existingRecords).length > 0;

    if (loading) {
        return <div className="space-y-4"><div className="skeleton h-48 rounded-2xl"></div><div className="skeleton h-64 rounded-2xl"></div></div>;
    }

    return (
        <div className="space-y-4">
            {/* Date selector and actions */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Take Attendance</h2>
                        </div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-auto"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={markAllPresent}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                            All Present
                        </button>
                        <button
                            onClick={markAllAbsent}
                            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                        >
                            All Absent
                        </button>
                    </div>
                </div>

                {hasExistingRecords && !isSundayDate && (
                    <div className="mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs sm:text-sm text-amber-800">
                        ⚠️ Attendance already taken for this date. You are editing existing records.
                    </div>
                )}

                {/* Sunday Holiday Banner */}
                {isSundayDate && (
                    <div className="mt-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-3">
                        <span className="text-2xl">☀️</span>
                        <div>
                            <p className="font-bold text-amber-800">Sunday — Holiday!</p>
                            <p className="text-sm text-amber-600">No attendance is taken on Sundays. Please select a different date.</p>
                        </div>
                    </div>
                )}

                {/* Stats bar */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs sm:text-sm">
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="font-bold text-slate-800">{users.length}</p>
                        <p className="text-slate-500">Total</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="font-bold text-emerald-700">{presentCount}</p>
                        <p className="text-emerald-600">Present</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-2">
                        <p className="font-bold text-red-700">{absentCount}</p>
                        <p className="text-red-600">Absent</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                        <p className="font-bold text-slate-600">{users.length - presentCount - absentCount}</p>
                        <p className="text-slate-400">Unmarked</p>
                    </div>
                </div>
            </div>

            {/* Users attendance list */}
            {!isSundayDate && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {users.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No users found. Create users first from the Users page.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {users.map((u, index) => {
                                const status = attendanceMap[u.id];
                                return (
                                    <div
                                        key={u.id}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2 sm:gap-4 transition-colors ${status === 'present' ? 'bg-emerald-50/50' :
                                            status === 'absent' ? 'bg-red-50/50' : 'bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm rounded-full flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm sm:text-base truncate">{u.name || 'Unnamed User'}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {u.username && <span className="mr-2">@{u.username}</span>}
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${u.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                        }`}>{u.role}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => setAttendanceMap(prev => ({ ...prev, [u.id]: 'present' }))}
                                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${status === 'present'
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                                                    }`}
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Present
                                            </button>
                                            <button
                                                onClick={() => setAttendanceMap(prev => ({ ...prev, [u.id]: 'absent' }))}
                                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${status === 'absent'
                                                    ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700'
                                                    }`}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Absent
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Save button */}
            {users.length > 0 && !isSundayDate && (
                <button
                    onClick={saveAttendance}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-indigo-600/20 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {saving ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Save className="w-5 h-5 sm:w-6 sm:h-6" />
                            {hasExistingRecords ? 'Update Attendance' : 'Save Attendance'}
                        </>
                    )}
                </button>
            )}

            {/* WhatsApp Notification Panel */}
            {showWhatsappPanel && whatsappList.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 sm:px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">💬</span>
                            <div>
                                <h3 className="text-white font-bold text-base sm:text-lg">WhatsApp Absent Notifications</h3>
                                <p className="text-green-100 text-xs sm:text-sm">{whatsappList.length} absent employee(s) to notify</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWhatsappPanel(false)}
                            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Employee list */}
                    <div className="p-4 sm:p-6 space-y-3">
                        {whatsappList.map((u, i) => (
                            <div key={u.id} className="bg-white rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 border border-green-100 shadow-sm">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm truncate">{u.name || u.username}</p>
                                        <p className="text-xs text-slate-500">📱 {u.phone}</p>
                                    </div>
                                </div>
                                <a
                                    href={u.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm"
                                >
                                    💬 Send
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* Send All Button */}
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <button
                            onClick={sendAllWhatsApp}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-base sm:text-lg rounded-xl shadow-lg shadow-green-600/30 transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                            💬 Send All {whatsappList.length} Messages via WhatsApp
                        </button>
                        <p className="text-center text-xs text-green-600 mt-2">
                            All WhatsApp chats will open simultaneously with pre-filled messages
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// =============================================
// Attendance Records Tab
// =============================================
const AttendanceRecords = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [filterType, setFilterType] = useState('all');
    const [searchUser, setSearchUser] = useState('');

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, name, username');

            const nameMap = {};
            (profiles || []).forEach(p => {
                nameMap[p.id] = p.name || p.username || p.id;
            });
            setUserNames(nameMap);

            let query = supabaseAdmin
                .from('attendance')
                .select('*')
                .order('date', { ascending: false });

            if (filterType === 'today') {
                const today = new Date().toISOString().split('T')[0];
                query = query.eq('date', today);
            } else if (filterType === 'week') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                query = query.gte('date', d.toISOString().split('T')[0]);
            } else if (filterType === 'month') {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                query = query.gte('date', d.toISOString().split('T')[0]);
            }

            if (searchUser) {
                const matchingIds = Object.entries(nameMap)
                    .filter(([id, name]) => name.toLowerCase().includes(searchUser.toLowerCase()))
                    .map(([id]) => id);

                if (matchingIds.length > 0) {
                    query = query.in('user_id', matchingIds);
                } else {
                    setAttendance([]);
                    setLoading(false);
                    return;
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setAttendance(data || []);
        } catch (error) {
            toast.error('Failed to fetch attendance records');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [filterType]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchAttendance();
    };

    // Stats
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const total = attendance.length;
    const rate = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Header & Filters */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-fade-in-up">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Attendance Records</h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 overflow-x-auto">
                            {['all', 'today', 'week', 'month'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`flex-shrink-0 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${filterType === type
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <form onSubmit={handleSearch} className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                            />
                        </form>
                    </div>
                </div>
            </div>

            {/* Record Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Records</p>
                    <p className="text-lg font-bold text-slate-800">{total}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Present</p>
                    <p className="text-lg font-bold text-emerald-700">{presentCount}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-red-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-red-600 uppercase">Absent</p>
                    <p className="text-lg font-bold text-red-700">{absentCount}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-sm text-center">
                    <p className="text-xs font-semibold text-indigo-600 uppercase">Rate</p>
                    <p className="text-lg font-bold text-indigo-700">{rate}%</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Recorded At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading records...</td></tr>
                            ) : attendance.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No attendance records found.</td></tr>
                            ) : (
                                attendance.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{record.date}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-slate-800">{userNames[record.user_id] || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(record.created_at).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading records...</div>
                    ) : attendance.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No attendance records found.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {attendance.map(record => (
                                <div key={record.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-800 text-sm">{userNames[record.user_id] || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">{record.date}</p>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {record.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
