import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import AdminDashboard from './portals/admin/AdminDashboard.jsx'
import CandidateDashboard from './portals/candidate/CandidateDashboard.jsx'
import EmployerDashboard from './portals/employer/EmployerDashboard.jsx'
import HomePage from './portals/public/HomePage.jsx'
import NotFoundPage from './portals/public/NotFoundPage.jsx'

// Portal routes get role guards (ProtectedRoute) in Phase 1.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/candidate/dashboard', element: <CandidateDashboard /> },
      { path: '/employer/dashboard', element: <EmployerDashboard /> },
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
