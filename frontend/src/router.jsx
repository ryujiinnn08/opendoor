import { createBrowserRouter, Navigate } from 'react-router-dom'
import GuestRoute from './auth/GuestRoute.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import PortalLayout from './components/layout/PortalLayout.jsx'
import PublicLayout from './components/layout/PublicLayout.jsx'
import RootLayout from './components/layout/RootLayout.jsx'
import AccommodationsPage from './portals/admin/AccommodationsPage.jsx'
import AdminDashboard from './portals/admin/AdminDashboard.jsx'
import CategoriesPage from './portals/admin/CategoriesPage.jsx'
import CandidateDashboard from './portals/candidate/CandidateDashboard.jsx'
import EmployerDashboard from './portals/employer/EmployerDashboard.jsx'
import AccessibilityPage from './portals/public/AccessibilityPage.jsx'
import HomePage from './portals/public/HomePage.jsx'
import LoginPage from './portals/public/LoginPage.jsx'
import NotFoundPage from './portals/public/NotFoundPage.jsx'
import PrivacyPage from './portals/public/PrivacyPage.jsx'
import RegisterPage from './portals/public/RegisterPage.jsx'

function portal(role, pages) {
  return {
    element: <ProtectedRoute roles={[role]} />,
    children: [
      { path: `/${role}`, element: <Navigate to={`/${role}/dashboard`} replace /> },
      { element: <PortalLayout />, children: pages },
    ],
  }
}

export const routes = [
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/privacy', element: <PrivacyPage /> },
          { path: '/accessibility', element: <AccessibilityPage /> },
          {
            element: <GuestRoute />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      portal('candidate', [{ path: '/candidate/dashboard', element: <CandidateDashboard /> }]),
      portal('employer', [{ path: '/employer/dashboard', element: <EmployerDashboard /> }]),
      portal('admin', [
        { path: '/admin/dashboard', element: <AdminDashboard /> },
        { path: '/admin/categories', element: <CategoriesPage /> },
        { path: '/admin/accommodations', element: <AccommodationsPage /> },
      ]),
    ],
  },
]

export const router = createBrowserRouter(routes)
