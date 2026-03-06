import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Toaster } from 'react-hot-toast';

import { AdminLayout } from './layouts/AdminLayout';
import { UserLayout } from './layouts/UserLayout';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';

import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminRequests } from './pages/admin/AdminRequests';
import { AdminEmployees } from './pages/admin/AdminEmployees';

import { UserDashboard } from './pages/user/UserDashboard';
import { UserHistory } from './pages/user/UserHistory';
import { UserRequests } from './pages/user/UserRequests';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes wrapped in AdminLayout */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="requests" element={<AdminRequests />} />
          </Route>

          {/* User Routes wrapped in UserLayout */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user', 'staff', 'trainee']}><UserLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="history" element={<UserHistory />} />
            <Route path="requests" element={<UserRequests />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
