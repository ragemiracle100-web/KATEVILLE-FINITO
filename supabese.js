// Supabase Configuration - Replace with your credentials
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Auth helpers
const auth = {
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email, password
        });
        if (error) throw error;
        return data;
    },
    
    async signUp(email, password, metadata) {
        const { data, error } = await supabase.auth.signUp({
            email, password, options: { data: metadata }
        });
        if (error) throw error;
        return data;
    },
    
    async signOut() {
        await supabase.auth.signOut();
    },
    
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },
    
    getUser() {
        return supabase.auth.getUser();
    }
};

// Database helpers
const db = {
    async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },
    
    async createUserProfile(profile) {
        const { data, error } = await supabase
            .from('users')
            .insert(profile);
        if (error) throw error;
        return data;
    },
    
    async getStudents(filters = {}) {
        let query = supabase.from('students').select('*');
        if (filters.class) query = query.eq('class', filters.class);
        if (filters.parentId) query = query.eq('parent_id', filters.parentId);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    
    async createStudent(student) {
        const { data, error } = await supabase
            .from('students')
            .insert(student)
            .select();
        if (error) throw error;
        return data[0];
    },
    
    async getResults(filters) {
        let query = supabase.from('results').select('*');
        if (filters.studentId) query = query.eq('student_id', filters.studentId);
        if (filters.class) query = query.eq('class', filters.class);
        if (filters.term) query = query.eq('term', filters.term);
        if (filters.year) query = query.eq('academic_year', filters.year);
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },
    
    async saveResult(result) {
        // Check if exists
        const { data: existing } = await supabase
            .from('results')
            .select('id')
            .eq('student_id', result.student_id)
            .eq('term', result.term)
            .eq('academic_year', result.academic_year)
            .single();
            
        if (existing) {
            const { data, error } = await supabase
                .from('results')
                .update(result)
                .eq('id', existing.id);
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('results')
                .insert(result)
                .select();
            if (error) throw error;
            return data[0];
        }
    },
    
    async getPayments(filters) {
        let query = supabase.from('payments').select('*');
        if (filters.studentId) query = query.eq('student_id', filters.studentId);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.parentId) query = query.eq('parent_id', filters.parentId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    
    async createPayment(payment) {
        const { data, error } = await supabase
            .from('payments')
            .insert(payment)
            .select();
        if (error) throw error;
        return data[0];
    },
    
    async updatePayment(paymentId, updates) {
        const { data, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', paymentId);
        if (error) throw error;
        return data;
    },
    
    async getTeacherReports(filters) {
        let query = supabase.from('teacher_reports').select('*');
        if (filters.studentId) query = query.eq('student_id', filters.studentId);
        if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    
    async createReport(report) {
        const { data, error } = await supabase
            .from('teacher_reports')
            .insert(report)
            .select();
        if (error) throw error;
        return data[0];
    },
    
    async markReportRead(reportId) {
        const { data, error } = await supabase
            .from('teacher_reports')
            .update({ read_by_parent: true })
            .eq('id', reportId);
        if (error) throw error;
        return data;
    }
};

// Real-time subscriptions
const realtime = {
    subscribeToPayments(callback) {
        return supabase
            .channel('payments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback)
            .subscribe();
    },
    
    subscribeToResults(callback) {
        return supabase
            .channel('results')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, callback)
            .subscribe();
    }
};
