import { supabaseAdmin } from '../lib/supabaseAdmin';
import { supabase } from '../lib/supabase';

// Helper: check if date is Sunday
export const isSunday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDay() === 0;
};

/**
 * Attendance Service
 * Encapsulates all Database calls related to Attendance to keep components clean.
 * Functions suffixed with 'Admin' use the service role key and bypass RLS.
 * Standard functions use the anon key and respect RLS.
 */
export const attendanceService = {
    // ==========================================
    // ADMIN FUNCTIONS (Bypass RLS)
    // ==========================================

    async fetchAttendanceForDateAdmin(date) {
        const { data, error } = await supabaseAdmin
            .from('attendance')
            .select('id, user_id, status')
            .eq('date', date);
        if (error) throw error;
        return data || [];
    },

    async saveAttendanceBatchAdmin(toInsert, toUpdate) {
        if (toInsert.length > 0) {
            const { error } = await supabaseAdmin.from('attendance').insert(toInsert);
            if (error) throw error;
        }

        for (const record of toUpdate) {
            const { error } = await supabaseAdmin
                .from('attendance')
                .update({ status: record.status })
                .eq('id', record.id);
            if (error) throw error;
        }
    },

    async getDashboardStatsAdmin() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        let stats = {
            presentToday: 0,
            absentToday: 0,
            attendanceRate: 0
        };

        if (today.getDay() !== 0) { // Not Sunday
            const { data, error } = await supabaseAdmin
                .from('attendance')
                .select('status')
                .eq('date', todayStr);

            if (!error && data) {
                const present = data.filter(a => a.status === 'present').length;
                const absent = data.filter(a => a.status === 'absent').length;
                const total = present + absent;
                stats.presentToday = present;
                stats.absentToday = absent;
                stats.attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
            }
        }
        return stats;
    },

    async fetchRecentActivityAdmin() {
        // ... handled in component for now due to complex join/formatting, but ideally moves here
    },

    // ==========================================
    // USER FUNCTIONS (Respects RLS)
    // ==========================================

    async fetchUserAttendanceMetrics(userId) {
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;
        return data || [];
    }
};
