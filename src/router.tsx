import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ChatCompletions from './pages/chat-completions/ChatCompletions'
import JsonDiff from './pages/json-diff/JsonDiff'
import TextEscape from './pages/text-escape/TextEscape'

const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { path: '/', element: <Navigate to="/json-diff" replace /> },
        { path: '/json-diff', element: <JsonDiff /> },
        { path: '/text-escape', element: <TextEscape /> },
        { path: '/chat-completions', element: <ChatCompletions /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

export default router
