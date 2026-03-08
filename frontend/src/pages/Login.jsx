import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, user, role } = useAuth();
    const navigate = useNavigate();

    // If already logged in, redirect
    useEffect(() => {
        if (user && role) {
            if (role === 'admin') {
                navigate('/admin');
            } else if (['user', 'staff', 'trainee'].includes(role)) {
                navigate('/dashboard');
            }
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(username, password);
            toast.success('Welcome back!');
            if (result.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%)' }}>
            {/* Animated background orbs */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', filter: 'blur(80px)', animation: 'orbFloat1 12s ease-in-out infinite' }}></div>
            <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', filter: 'blur(80px)', animation: 'orbFloat2 15s ease-in-out infinite' }}></div>
            <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', filter: 'blur(60px)', animation: 'orbFloat3 10s ease-in-out infinite' }}></div>

            <div className="max-w-md w-full animate-fade-in-up relative z-10">
                {/* Brand header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className="w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)' }}>
                            <CalendarCheck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">AttendSync</h1>
                    <p className="text-slate-400 mt-1 text-sm">Smart Attendance Management</p>
                </div>

                {/* Login card */}
                <div className="backdrop-blur-xl bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] rounded-2xl p-8 border border-white/20 transform hover:-translate-y-1 transition-all duration-300">
                    <div className="flex flex-col items-center mb-6">
                        <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
                        <p className="text-slate-400 mt-1 text-sm">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                            <input
                                id="login-username"
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/5 backdrop-blur-sm text-white placeholder-slate-500"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/5 backdrop-blur-sm text-white placeholder-slate-500 pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={loading}
                            fullWidth
                        >
                            <LogIn className="w-5 h-5" />
                            Sign In
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-sm mt-8 font-medium tracking-wide">© {new Date().getFullYear()} Ansari. All rights reserved.</p>
            </div>
        </div>
    );
};
