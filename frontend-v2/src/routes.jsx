import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const PasswordResetPage = React.lazy(() => import('./pages/PasswordResetPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const GameLobbyPage = React.lazy(() => import('./pages/GameLobbyPage'));
const GamePage = React.lazy(() => import('./pages/GamePage'));
const GameSummaryPage = React.lazy(() => import('./pages/GameSummaryPage'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const CompleteProfilePage = React.lazy(() => import('./pages/CompleteProfilePage'));
const ProtectedRoute = React.lazy(() => import('./components/ProtectedRoute'));

export default function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset" element={<PasswordResetPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
          <Route path="/lobby/:gameId" element={<ProtectedRoute><GameLobbyPage /></ProtectedRoute>} />
          <Route path="/game/:gameId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
          <Route path="/summary/:gameId" element={<ProtectedRoute><GameSummaryPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}