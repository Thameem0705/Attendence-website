import React, { useState, useEffect } from 'react';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import toast from 'react-hot-toast';
import { Trash2, UserPlus, Search, RefreshCw, Pencil, X, Save, Phone } from 'lucide-react';

export const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // User creation state
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('staff');
    const [newAddress, setNewAddress] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPhone, setNewPhone] = useState('');

    // Edit user state
    const [editingUser, setEditingUser] = useState(null); // user object being edited
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            toast.error('Failed to load users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            // 1. Check if username already exists
            const { data: existingUser } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('username', newUsername)
                .single();

            if (existingUser) {
                throw new Error('Username already taken');
            }

            // 2. Create the user in Supabase Auth
            const generatedEmail = `${newUsername}@attendancesystem.local`;
            const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: generatedEmail,
                password: newPassword,
                email_confirm: true
            });

            if (createError) {
                throw new Error(createError.message);
            }

            const newUserId = authData.user.id;

            // 3. Insert profile row
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([{
                    id: newUserId,
                    role: newRole,
                    name: newName,
                    email: generatedEmail,
                    address: newAddress,
                    username: newUsername,
                    phone: newPhone,
                    assigned_password: newPassword
                }]);

            if (profileError) {
                // Rollback: delete auth user if profile insert fails
                await supabaseAdmin.auth.admin.deleteUser(newUserId);
                throw new Error(`Failed to create profile: ${profileError.message}`);
            }

            toast.success('User created successfully');
            setNewName('');
            setNewRole('staff');
            setNewAddress('');
            setNewUsername('');
            setNewPassword('');
            setNewPhone('');
            fetchUsers();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditName(user.name || '');
        setEditRole(user.role || 'staff');
        setEditAddress(user.address || '');
        setEditPhone(user.phone || '');
    };

    const closeEditModal = () => {
        setEditingUser(null);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Build update object with only provided fields
            const updateFields = {};
            if (editName !== undefined) updateFields.name = editName;
            if (editRole !== undefined) updateFields.role = editRole;
            if (editAddress !== undefined) updateFields.address = editAddress;
            if (editPhone !== undefined) updateFields.phone = editPhone;

            // 1. Update profile in Supabase
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update(updateFields)
                .eq('id', editingUser.id);

            if (profileError) {
                throw new Error(`Failed to update profile: ${profileError.message}`);
            }

            toast.success('User updated successfully');
            closeEditModal();
            fetchUsers();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This will remove their profile, attendance data, and auth account.')) {
            return;
        }

        try {
            // 1. Delete profile (cascades to attendance & permission_requests)
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('id', id);

            if (profileError) throw profileError;

            // 2. Also delete the auth user
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.warn('Profile deleted but failed to delete auth user:', authError.message);
            }

            toast.success('User deleted successfully');
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            toast.error('Failed to delete user');
            console.error(error);
        }
    };

    // Filter users by search (name, username, email)
    const filteredUsers = users.filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (u.name && u.name.toLowerCase().includes(q)) ||
            (u.username && u.username.toLowerCase().includes(q)) ||
            (u.phone && u.phone.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="animate-fade-in-up">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">User Management</h1>
                <p className="text-slate-500 mt-1">{users.length} users registered</p>
            </div>
            {/* Create User Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                    Create New User
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Name"
                        required
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                    >
                        <option value="staff">Staff</option>
                        <option value="trainee">Trainee</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Address"
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        required
                        minLength={6}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="tel"
                        placeholder="Mobile Number"
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <div className="md:col-span-2 lg:col-span-3">
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                        >
                            {isCreating ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">User Management</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search by name, username..."
                            className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Employee Details</th>
                                <th className="px-6 py-3">Contact Info</th>
                                <th className="px-6 py-3">Credentials</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{user.name || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">{user.address || 'No address'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm flex items-center gap-1.5">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                {user.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-mono text-slate-600">Username: {user.username || 'N/A'}</div>
                                            <div className="text-xs text-slate-400">PW: {user.assigned_password || '***'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize
                                                ${user.role === 'admin' ? 'bg-amber-100 text-amber-700'
                                                    : user.role === 'staff' ? 'bg-blue-100 text-blue-700'
                                                        : user.role === 'trainee' ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-emerald-100 text-emerald-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={closeEditModal}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'fadeInUp 0.2s ease-out' }}
                    >
                        <button
                            onClick={closeEditModal}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-indigo-600" />
                            Edit User
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Editing <span className="font-medium text-slate-700">@{editingUser.username}</span>
                        </p>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="trainee">Trainee</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow"
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal animation style */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
