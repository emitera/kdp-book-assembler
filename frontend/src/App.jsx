import React, { useState, useEffect } from 'react'
import { AppProvider } from './context/AppContext'
import Dashboard from './components/Dashboard'
import AdminPanel from './components/AdminPanel'
import SupportPage from './components/SupportPage'
import DocViewer from './components/DocViewer'

function MainContent() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (currentPath === '/admin') {
    return <AdminPanel />
  }

  if (currentPath === '/support') {
    return <SupportPage />
  }

  if (currentPath === '/terms') {
    return <DocViewer type="terms" />
  }

  if (currentPath === '/refund') {
    return <DocViewer type="refund" />
  }

  if (currentPath === '/privacy') {
    return <DocViewer type="privacy" />
  }

  return <Dashboard />
}

function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}

export default App
