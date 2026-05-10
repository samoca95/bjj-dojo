import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import SessionsPage from './pages/SessionsPage'
import SessionDetailPage from './pages/SessionDetailPage'
import AddEditSessionPage from './pages/AddEditSessionPage'
import TechniquesPage from './pages/TechniquesPage'
import TechniqueDetailPage from './pages/TechniqueDetailPage'

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/sessions', element: <SessionsPage /> },
      { path: '/sessions/new', element: <AddEditSessionPage /> },
      { path: '/sessions/:id', element: <SessionDetailPage /> },
      { path: '/sessions/:id/edit', element: <AddEditSessionPage /> },
      { path: '/techniques', element: <TechniquesPage /> },
      { path: '/techniques/:id', element: <TechniqueDetailPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
