import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from "./components/Dashboard";
import ShortlistPage from "./components/ShortlistPage";

function App() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <Router>
    <Routes>
    <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
    <Route path="/shortlist/:jobId" element={isLoggedIn ? <ShortlistPage /> : <Navigate to="/login" />} />
    <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
    <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/dashboard" />} />
    <Route path="/register" element={!isLoggedIn ? <Register /> : <Navigate to="/dashboard" />} />
    </Routes>
    </Router>
  );
}

export default App;
