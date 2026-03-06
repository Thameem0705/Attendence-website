import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoutModal } from '../components/LogoutModal';
import {
    LayoutDashboard,
    CalendarCheck,
    ClipboardList,
    LogOut,
    Menu,
    X,
    User
} from 'lucide-react';

export const UserLayout = ({ children }) => {
    const { logout, user, role } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        setShowLogoutModal(false);
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'History', path: '/dashboard/history', icon: CalendarCheck },
        { name: 'Requests', path: '/dashboard/requests', icon: ClipboardList },
    ];

    const userInitial = (user?.name || user?.username || 'U').charAt(0).toUpperCase();
    const displayRole = role === 'staff' ? 'Staff' : role === 'trainee' ? 'Trainee' : 'User';

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
                        <div className="px-6 py-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                                    <CalendarCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white tracking-tight">AttendSync</h1>
                                    <p className="text-[10px] font-medium text-cyan-400 uppercase tracking-wider">My Portal</p>
                                </div>
                            </div>
                            <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 px-3 space-y-1 mt-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        end={item.path === '/dashboard'}
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
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                                    {userInitial}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{user?.name || user?.username}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <User className="w-3 h-3 text-cyan-400" />
                                        <span className="text-[11px] text-cyan-400 font-medium">{displayRole}</span>
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
                    <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 flex items-center shadow-sm">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-slate-500 hover:text-slate-700 focus:outline-none"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="ml-4 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                                <CalendarCheck className="w-4 h-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">AttendSync</h1>
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
