import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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

    // Framer Motion Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
    };

    const orbVariants = {
        animate: {
            y: [0, -30, 0],
            x: [0, 20, 0],
            scale: [1, 1.05, 1],
            transition: {
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            {/* Animated background orbs */}
            <motion.div
                className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30 mix-blend-screen"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0) 70%)', filter: 'blur(60px)' }}
                variants={orbVariants}
                animate="animate"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.3, transition: { duration: 1 } }}
            />
            <motion.div
                className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-30 mix-blend-screen"
                style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.8) 0%, rgba(6,182,212,0) 70%)', filter: 'blur(60px)' }}
                animate={{
                    y: [0, 40, 0],
                    x: [0, -30, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.3, transition: { duration: 1 } }}
            />
            <motion.div
                className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full opacity-20 mix-blend-screen pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, rgba(139,92,246,0) 70%)', filter: 'blur(50px)' }}
                animate={{
                    y: [-20, 20, -20],
                    rotate: [0, 90, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            <motion.div
                className="max-w-md w-full relative z-10 perspective-1000"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Brand header */}
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-6 sm:mb-8">
                    <motion.div
                        className="relative mb-3 sm:mb-4"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-white rounded-2xl shadow-xl overflow-hidden" style={{ boxShadow: '0 0 40px rgba(99, 102, 241, 0.5)' }}>
                            <img src="/logo.png" alt="Sulthan & Co Logo" className="w-full h-full object-contain p-2" />
                        </div>
                        {/* Glow effect behind logo */}
                        <div className="absolute inset-0 rounded-2xl bg-indigo-500 blur-xl opacity-50 -z-10 animate-pulse"></div>
                    </motion.div>
                    <motion.h1
                        className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-white tracking-tight text-center drop-shadow-lg uppercase leading-tight"
                        style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
                    >
                        Sulthan & Co
                    </motion.h1>
                    <p className="text-indigo-200 mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium tracking-wide text-center">ITP Auditor Attendance</p>
                </motion.div>

                {/* Login card */}
                <motion.div
                    variants={itemVariants}
                    className="backdrop-blur-2xl bg-[#0f172a]/40 shadow-[0_15px_50px_-12px_rgba(0,0,0,0.4)] rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden"
                    whileHover={{
                        boxShadow: '0 20px 60px -10px rgba(99, 102, 241, 0.3)',
                        borderColor: 'rgba(255,255,255,0.2)'
                    }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Glassmorphism shine effect */}
                    <div className="absolute top-0 left-[-100%] w-[50%] h-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[30deg] animate-[shine_5s_infinite_linear]"></div>

                    <div className="flex flex-col items-center mb-6 sm:mb-8 relative z-10">
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">Welcome Back</h2>
                        <p className="text-slate-300 mt-1.5 sm:mt-2 text-xs sm:text-sm text-center">Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-200 mb-2 drop-shadow-sm">Username</label>
                            <div className="relative group">
                                <input
                                    id="login-username"
                                    type="text"
                                    required
                                    className="w-full px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 bg-white/5 backdrop-blur-md text-white placeholder-slate-400 shadow-inner group-hover:bg-white/10"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300"></div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-slate-200 mb-2 drop-shadow-sm">Password</label>
                            <div className="relative group">
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="w-full px-4 py-3.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 bg-white/5 backdrop-blur-md text-white placeholder-slate-400 pr-12 shadow-inner group-hover:bg-white/10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 active:scale-95 duration-200"
                                    tabIndex={-1}
                                >
                                    <AnimatePresence mode="wait" initial={false}>
                                        <motion.div
                                            key={showPassword ? 'hide' : 'show'}
                                            initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                            exit={{ opacity: 0, scale: 0.8, rotate: 30 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </motion.div>
                                    </AnimatePresence>
                                </button>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity duration-300"></div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="pt-2"
                        >
                            <Button
                                type="submit"
                                isLoading={loading}
                                fullWidth
                                className="!py-3.5 text-base font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-shadow duration-300 relative overflow-hidden group"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 opacity-0 group-hover:opacity-100 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] transition-opacity duration-300"></span>
                                <span className="relative flex items-center justify-center gap-2">
                                    <LogIn className="w-5 h-5" />
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </span>
                            </Button>
                        </motion.div>
                    </form>
                </motion.div>

                {/* Footer */}
                <motion.p
                    variants={itemVariants}
                    className="text-center text-slate-400 text-sm mt-8 font-medium tracking-wide drop-shadow-sm"
                >
                    © {new Date().getFullYear()} Ansari. All rights reserved.
                </motion.p>
            </motion.div>

            {/* Global style overrides specifically for this page if needed, normally tailwind handles this via adding arbitrary values in tailwind config or directly using plugin */}
            <style jsx="true">{`
                @keyframes shine {
                    100% { left: 200%; }
                }
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                .perspective-1000 {
                    perspective: 1000px;
                }
            `}</style>
        </div>
    );
};

