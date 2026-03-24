import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import AuthPage from './pages/AuthPage'
import { AuthProvider, useAuth } from './hooks/useAuth'

function Root() {
  const { user } = useAuth()
  return user ? <App /> : <AuthPage />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </React.StrictMode>
)
