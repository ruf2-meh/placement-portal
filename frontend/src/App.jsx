<<<<<<< HEAD
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register'; // Make sure it's imported!
import Dashboard from './components/Dashboard';
=======
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Login from './components/Login';
import Register from './components/Register';

// Import Dashboard Views
import StudentDashboard from './components/dashboards/StudentDashboard';
import CompanyDashboard from './components/dashboards/CompanyDashboard';
import FacultyDashboard from './components/dashboards/FacultyDashboard';
import AdminDashboard from './components/dashboards/AdminDashboard';

// Guard requiring user token
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

// Role-specific Route Guard
const RoleGuard = ({ allowedRole }) => {
  const role = localStorage.getItem('role');
  return role === allowedRole ? <Outlet /> : <Navigate to={`/${role || 'student'}-dashboard`} replace />;
};

// Public route guard (Redirects logged-in users away from login/register)
const PublicOnlyRoute = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role') || 'student';
  return !token ? <Outlet /> : <Navigate to={`/${role}-dashboard`} replace />;
};

// Dynamic helper redirecting generic path requests to correct user dashboard
const DynamicDashboardRedirect = () => {
  const role = localStorage.getItem('role') || 'student';
  return <Navigate to={`/${role}-dashboard`} replace />;
};
>>>>>>> main

function App() {
  return (
    <Router>
      <Routes>
<<<<<<< HEAD
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* <--- Check this line */}
        <Route path="/dashboard" element={<Dashboard />} />
=======
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard allowedRole="student" />}>
            <Route path="/student-dashboard" element={<StudentDashboard />} />
          </Route>
          
          <Route element={<RoleGuard allowedRole="company" />}>
            <Route path="/company-dashboard" element={<CompanyDashboard />} />
          </Route>
          
          <Route element={<RoleGuard allowedRole="faculty" />}>
            <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
          </Route>
          
          <Route element={<RoleGuard allowedRole="admin" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Public Guest Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<DynamicDashboardRedirect />} />
>>>>>>> main
      </Routes>
    </Router>
  );
}

export default App;