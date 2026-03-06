import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { Check, X, Clock, ClipboardList, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userNames, setUserNames] = useState({});
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // Fetch user names
            const { data: profiles } = await supabaseAdmin
                .from('profiles')
                .select('id, name, username');

            const nameMap = {};
            (profiles || []).forEach(p => {
                nameMap[p.id] = p.name || p.username || 'Unknown';
            });
            setUserNames(nameMap);

            let query = supabaseAdmin
                .from('permission_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (filterStatus !== 'all') {
                query = query.eq('status', filterStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            toast.error('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filterStatus]);

    const handleUpdateStatus = async (id, status) => {
        const remark = window.prompt(`Enter remark for ${status} (Optional):`);
        if (remark === null) return;

        try {
            const { error } = await supabaseAdmin
                .from('permission_requests')
                .update({ status, admin_remark: remark })
                .eq('id', id);

            if (error) throw error;
            toast.success(`Request ${status} successfully`);
            setRequests(requests.map(r => r.id === id ? { ...r, status, admin_remark: remark } : r));
        } catch (error) {
            toast.error(`Failed to update request`);
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;
    const rejectedCount = requests.filter(r => r.status === 'rejected').length;

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3" />Approved</span>;
            case 'rejected': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="w-3 h-3" />Rejected</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="w-3 h-3" />Pending</span>;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-fade-in-up">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2.5 rounded-xl">
                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Permission Requests</h2>
                            <p className="text-sm text-slate-500">{requests.length} total requests</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
                <div className="bg-white rounded-2xl p-3 sm:p-5 border border-amber-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-600 uppercase">Pending</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-amber-700">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-5 border border-emerald-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-600 uppercase">Approved</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-700">{approvedCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-5 border border-red-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-600 uppercase">Rejected</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-700">{rejectedCount}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-white rounded-xl border border-slate-100 shadow-sm p-1 overflow-x-auto animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
                {['all', 'pending', 'approved', 'rejected'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterStatus(type)}
                        className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors ${filterStatus === type
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Request Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500">
                        No {filterStatus !== 'all' ? filterStatus : ''} requests found.
                    </div>
                ) : (
                    requests.map((request) => (
                        <div key={request.id} className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col card-hover-lift">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-slate-800 text-sm sm:text-base">
                                        {userNames[request.user_id] || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {new Date(request.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                {getStatusBadge(request.status)}
                            </div>

                            <div className="mb-4 flex-1 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Reason</p>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{request.reason}</p>

                                {request.admin_remark && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <span className="text-xs font-bold text-indigo-600">Admin Remark:</span>
                                        <p className="text-sm text-slate-700 mt-1">{request.admin_remark}</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-slate-400 mb-3">
                                Submitted: {new Date(request.created_at).toLocaleString()}
                            </div>

                            {request.status === 'pending' && (
                                <div className="flex gap-2 sm:gap-3 mt-auto">
                                    <button
                                        onClick={() => handleUpdateStatus(request.id, 'approved')}
                                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium py-2.5 rounded-xl flex items-center justify-center transition-colors text-sm"
                                    >
                                        <Check className="w-4 h-4 mr-1.5" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(request.id, 'rejected')}
                                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2.5 rounded-xl flex items-center justify-center transition-colors text-sm"
                                    >
                                        <X className="w-4 h-4 mr-1.5" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
