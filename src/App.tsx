import { lazy, Suspense } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'

const HomePage = lazy(() => import('./pages/HomePage'))
const SessionsPage = lazy(() => import('./pages/SessionsPage'))
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage'))
const AddEditSessionPage = lazy(() => import('./pages/AddEditSessionPage'))
const TechniquesPage = lazy(() => import('./pages/TechniquesPage'))
const TechniqueGraphPage = lazy(() => import('./pages/TechniqueGraphPage'))
const TechniqueDetailPage = lazy(() => import('./pages/TechniqueDetailPage'))
const TechniqueEditPage = lazy(() => import('./pages/TechniqueEditPage'))
const ClubsPage = lazy(() => import('./pages/ClubsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const DevSettingsPage = lazy(() => import('./pages/DevSettingsPage'))
const SessionTypeIconsPage = lazy(() => import('./pages/SessionTypeIconsPage'))
const SettingsGoalsPage = lazy(() => import('./pages/SettingsGoalsPage'))
const SettingsHomeSectionsPage = lazy(
  () => import('./pages/SettingsHomeSectionsPage'),
)
const SettingsDataResetPage = lazy(
  () => import('./pages/SettingsDataResetPage'),
)

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/sessions', element: <SessionsPage /> },
      { path: '/sessions/new', element: <AddEditSessionPage /> },
      { path: '/sessions/:id', element: <SessionDetailPage /> },
      { path: '/sessions/:id/edit', element: <AddEditSessionPage /> },
      { path: '/clubs', element: <ClubsPage /> },
      { path: '/techniques', element: <TechniquesPage /> },
      { path: '/techniques/graph', element: <TechniqueGraphPage /> },
      { path: '/techniques/new/edit', element: <TechniqueEditPage /> },
      { path: '/techniques/:id', element: <TechniqueDetailPage /> },
      { path: '/techniques/:id/edit', element: <TechniqueEditPage /> },
      { path: '/categories', element: <CategoriesPage /> },
      { path: '/session-type-icons', element: <SessionTypeIconsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/settings/goals', element: <SettingsGoalsPage /> },
      {
        path: '/settings/home-sections',
        element: <SettingsHomeSectionsPage />,
      },
      { path: '/settings/data-reset', element: <SettingsDataResetPage /> },
      { path: '/settings/dev', element: <DevSettingsPage /> },
    ],
  },
])

export default function App() {
  return (
    <Suspense fallback={<div />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
