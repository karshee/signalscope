import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './lib/auth'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Channels from './pages/Channels'
import ChannelDetail from './pages/ChannelDetail'
import Templates from './pages/Templates'
import Automations from './pages/Automations'
import Settings from './pages/Settings'

// React Flow is heavy — load the editor only when someone opens it
const AutomationEditor = lazy(() => import('./pages/AutomationEditor'))

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

function EditorFallback() {
  return (
    <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
      Loading editor…
    </div>
  )
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
      { path: 'templates', element: <Templates /> },
      { path: 'automations', element: <Automations /> },
      {
        path: 'automations/new',
        element: (
          <Suspense fallback={<EditorFallback />}>
            <AutomationEditor />
          </Suspense>
        ),
      },
      {
        path: 'automations/:id',
        element: (
          <Suspense fallback={<EditorFallback />}>
            <AutomationEditor />
          </Suspense>
        ),
      },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
