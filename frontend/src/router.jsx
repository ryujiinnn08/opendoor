import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireEmployerProfile, RequireNoEmployerProfile } from './auth/EmployerRoutes.jsx'
import GuestRoute from './auth/GuestRoute.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import PortalLayout from './components/layout/PortalLayout.jsx'
import PublicLayout from './components/layout/PublicLayout.jsx'
import RootLayout from './components/layout/RootLayout.jsx'
import AccommodationsPage from './portals/admin/AccommodationsPage.jsx'
import AdminDashboard from './portals/admin/AdminDashboard.jsx'
import CategoriesPage from './portals/admin/CategoriesPage.jsx'
import EmployerVerificationPage from './portals/admin/EmployerVerificationPage.jsx'
import PostingApprovalsPage from './portals/admin/PostingApprovalsPage.jsx'
import PostingReviewPage from './portals/admin/PostingReviewPage.jsx'
import SettingsPage from './portals/admin/SettingsPage.jsx'
import CandidateDashboard from './portals/candidate/CandidateDashboard.jsx'
import CompanyPage from './portals/employer/CompanyPage.jsx'
import EmployerDashboard from './portals/employer/EmployerDashboard.jsx'
import IndividualProfilePage from './portals/employer/IndividualProfilePage.jsx'
import JobPostingFormPage from './portals/employer/JobPostingFormPage.jsx'
import JobPostingPreviewPage from './portals/employer/JobPostingPreviewPage.jsx'
import JobPostingsPage from './portals/employer/JobPostingsPage.jsx'
import SetupPage from './portals/employer/SetupPage.jsx'
import TeamPage from './portals/employer/TeamPage.jsx'
import AccessibilityPage from './portals/public/AccessibilityPage.jsx'
import HomePage from './portals/public/HomePage.jsx'
import JoinPage from './portals/public/JoinPage.jsx'
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
          { path: '/join/:code', element: <JoinPage /> },
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
      portal('employer', [
        { element: <RequireNoEmployerProfile />, children: [{ path: '/employer/setup', element: <SetupPage /> }] },
        {
          element: <RequireEmployerProfile kinds={['owner', 'hr', 'individual']} />,
          children: [
            { path: '/employer/dashboard', element: <EmployerDashboard /> },
            { path: '/employer/job-postings', element: <JobPostingsPage /> },
            { path: '/employer/job-postings/new', element: <JobPostingFormPage /> },
            { path: '/employer/job-postings/:id', element: <JobPostingPreviewPage /> },
            { path: '/employer/job-postings/:id/edit', element: <JobPostingFormPage /> },
          ],
        },
        {
          element: <RequireEmployerProfile kinds={['owner']} />,
          children: [
            { path: '/employer/company', element: <CompanyPage /> },
            { path: '/employer/team', element: <TeamPage /> },
          ],
        },
        {
          element: <RequireEmployerProfile kinds={['individual']} />,
          children: [{ path: '/employer/profile', element: <IndividualProfilePage /> }],
        },
      ]),
      portal('admin', [
        { path: '/admin/dashboard', element: <AdminDashboard /> },
        { path: '/admin/categories', element: <CategoriesPage /> },
        { path: '/admin/accommodations', element: <AccommodationsPage /> },
        { path: '/admin/employers', element: <EmployerVerificationPage /> },
        { path: '/admin/job-postings', element: <PostingApprovalsPage /> },
        { path: '/admin/job-postings/:id', element: <PostingReviewPage /> },
        { path: '/admin/settings', element: <SettingsPage /> },
      ]),
    ],
  },
]

export const router = createBrowserRouter(routes)
