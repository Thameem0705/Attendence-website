import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoutModal } from '../components/LogoutModal';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    ClipboardList,
    LogOut,
    Menu,
    X,
    Contact,
    Shield
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Users', path: '/admin/users', icon: Users },
        { name: 'Employees', path: '/admin/employees', icon: Contact },
        { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { name: 'Requests', path: '/admin/requests', icon: ClipboardList },
    ];

    const userInitial = (user?.username || 'A').charAt(0).toUpperCase();

    return (
        <>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Mobile sidebar overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 sidebar-dark transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                    <div className="h-full flex flex-col">
                        {/* Brand */}
                        <div className="px-4 py-5 flex flex-col items-center justify-center border-b border-white/10 relative">
                            <button className="lg:hidden text-slate-400 hover:text-white transition-colors absolute top-3 right-3" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-14 h-14 mb-2.5 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                                <img src="/logo.png" alt="Sulthan & Co" className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="text-center w-full">
                                <h1 className="text-base font-bold text-white tracking-tight uppercase leading-snug">Sulthan & Co</h1>
                                <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-widest mt-0.5">Admin Panel</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1 mt-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/admin'}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={({ isActive }) => `
                                        nav-item flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                        ${isActive ? 'nav-item-active' : ''}
                                    `}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium text-sm">{item.name}</span>
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* User info + Logout */}
                        <div className="p-4 border-t border-white/5">
                            <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/5">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    {userInitial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Shield className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[11px] text-indigo-400 font-medium">Administrator</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="flex items-center space-x-3 px-4 py-2.5 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Mobile Header */}
                    <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-center shadow-sm relative">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-slate-500 hover:text-slate-700 focus:outline-none absolute left-4 z-10 p-1"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src="/logo.png" alt="Sulthan & Co" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-base font-bold text-slate-800 tracking-tight uppercase leading-tight">Sulthan & Co</h1>
                        </div>
                    </header>

                    <div className="flex-1 overflow-auto p-4 lg:p-8 flex flex-col relative z-0">
                        <div className="page-enter flex-1 mb-6">
                            {children || <Outlet />}
                        </div>
                        <footer className="mt-auto py-4 text-center text-slate-500 text-sm font-medium tracking-wide">
                            &copy; {new Date().getFullYear()} Ansari. All rights reserved.
                        </footer>
                    </div>
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
        </>
    );
};
