import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import JsonDiff from './pages/json-diff/JsonDiff'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/json-diff" replace /> },
      { path: '/json-diff', element: <JsonDiff /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
})

export default router
