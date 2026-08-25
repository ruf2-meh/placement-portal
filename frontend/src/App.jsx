import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from "./components/Dashboard";
import ResumeBuilder from "./components/ResumeBuilder";

function App() {
  const isLoggedIn = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isStudent = isLoggedIn && user.role === 'Student';

  return (
    <Router>
      {/* We removed the centering h1 text and layout paddings to allow full screen split pane view */}
      <Routes>
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/resume" element={isStudent ? <ResumeBuilder /> : (isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)} />
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;