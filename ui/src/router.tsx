import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Channels from './pages/Channels'
import ChannelDetail from './pages/ChannelDetail'
import Signals from './pages/Signals'
import Leaderboard from './pages/Leaderboard'
import Settings from './pages/Settings'

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  {
    path: '/app',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'channels', element: <Channels /> },
      { path: 'channels/:id', element: <ChannelDetail /> },
      { path: 'signals', element: <Signals /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
