import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Clock, CheckCircle2, XCircle, AlertCircle, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';

export const UserRequests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) fetchRequests();
    }, [user]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('permission_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            toast.error('Failed to load permission requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabaseAdmin
                .from('permission_requests')
                .insert([{ user_id: user.id, date, reason, status: 'pending' }]);

            if (error) throw error;
            toast.success('Permission request submitted!');
            setDate('');
            setReason('');
            fetchRequests();
        } catch (error) {
            toast.error('Failed to submit request');
            console.error(error);
        } finally {
            setSubmitting(false);
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
            {/* Submit Request Form */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-fade-in-up">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                    <Send className="w-5 h-5 text-cyan-600" />
                    Submit Permission Request
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date of Leave</label>
                            <input
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="sm:row-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                            <textarea
                                required
                                rows="4"
                                placeholder="Please provide a valid reason..."
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none transition-shadow h-full min-h-[100px]"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" />Submit</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 animate-fade-in-up" style={{ animationDelay: '0.08s' }}>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-amber-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase">Pending</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-amber-700">{pendingCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-emerald-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase">Approved</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-emerald-700">{approvedCount}</p>
                </div>
                <div className="bg-white rounded-2xl p-3 sm:p-4 border border-red-100 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-[10px] sm:text-xs font-semibold text-red-600 uppercase">Rejected</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-700">{rejectedCount}</p>
                </div>
            </div>

            {/* Requests List */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-600" />
                    My Recent Requests
                </h3>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading your requests...</div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                            You haven't submitted any permission requests yet.
                        </div>
                    ) : (
                        requests.map(request => (
                            <div key={request.id} className="p-3 sm:p-5 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow bg-slate-50/50">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                                    <div className="font-semibold text-slate-800 text-sm sm:text-base">
                                        {new Date(request.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>

                                <div className="text-sm text-slate-700 mb-3 bg-white p-3 rounded-lg border border-slate-100">
                                    <span className="font-medium text-slate-900 mb-1 block text-xs uppercase">Reason</span>
                                    {request.reason}
                                </div>

                                {request.admin_remark && (
                                    <div className="text-sm bg-indigo-50 text-indigo-900 p-3 rounded-lg border border-indigo-100">
                                        <span className="font-bold flex items-center gap-1 mb-1 text-xs">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Admin Reply
                                        </span>
                                        {request.admin_remark}
                                    </div>
                                )}

                                <div className="text-xs text-slate-400 mt-2 text-right">
                                    {new Date(request.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
