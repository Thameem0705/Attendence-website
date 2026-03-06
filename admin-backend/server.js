require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

// Create a Supabase client with the Service Role key to bypass RLS and allow admin actions
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Simple admin verification using a hardcoded secret
const ADMIN_SECRET = 'Sullthanitp-admin-secret';

const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authentication token' });
    }

    const token = authHeader.split(' ')[1];
    if (token !== ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    next();
};

// Route: Get Email by Username (Public)
app.post('/api/get-email-by-username', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', username)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ email: data.email });
    } catch (error) {
        console.error("Get email error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Create User (Admin Only)
app.post('/api/create-user', verifyAdmin, async (req, res) => {
    const { email, password, role = 'user', name, address, username, phone } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const allowedRoles = ['user', 'admin', 'staff', 'trainee'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be one of: ' + allowedRoles.join(', ') });
    }

    try {
        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // 1. Create the user in Supabase Auth
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm for admin created users
        });

        if (createError) {
            return res.status(400).json({ error: createError.message });
        }

        const newUserId = authData.user.id;

        // 2. Insert the user into the profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: newUserId,
                role,
                name,
                email,
                address,
                username,
                phone,
                assigned_password: password
            }]);

        if (profileError) {
            // Rollback auth user creation if profile insert fails
            await supabase.auth.admin.deleteUser(newUserId);
            return res.status(500).json({ error: `Failed to create profile: ${profileError.message}` });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: { id: newUserId, email: authData.user.email, username, role }
        });

    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route: Update User (Admin Only)
app.put('/api/update-user', verifyAdmin, async (req, res) => {
    const { id, name, role, address, email, phone } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const allowedRoles = ['user', 'admin', 'staff', 'trainee'];
    if (role && !allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be one of: ' + allowedRoles.join(', ') });
    }

    try {
        // Build update object with only provided fields
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (role !== undefined) updateFields.role = role;
        if (address !== undefined) updateFields.address = address;
        if (email !== undefined) updateFields.email = email;
        if (phone !== undefined) updateFields.phone = phone;

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(updateFields)
            .eq('id', id);

        if (profileError) {
            return res.status(500).json({ error: `Failed to update profile: ${profileError.message}` });
        }

        // If email was updated, also update in Supabase Auth
        if (email) {
            await supabase.auth.admin.updateUserById(id, { email });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Admin Backend running on port ${PORT}`);
});
