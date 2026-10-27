import React, { useState, useEffect, lazy, Suspense } from 'react'
import { AppProvider } from './context/AppContext'
import Dashboard from './components/Dashboard'
import { pingSupabaseKeepAlive } from './services/supabaseClient'
import { Loader2 } from 'lucide-react'

// Code-split heavy routes to drastically reduce initial bundle size
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const SupportPage = lazy(() => import('./components/SupportPage'))
const DocViewer = lazy(() => import('./components/DocViewer'))

function PageFallback() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  )
}

function MainContent() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <Suspense fallback={<PageFallback />}>
      {(() => {
        if (currentPath === '/admin') return <AdminPanel />
        if (currentPath === '/support') return <SupportPage />
        if (currentPath === '/terms') return <DocViewer type="terms" />
        if (currentPath === '/refund') return <DocViewer type="refund" />
        if (currentPath === '/privacy') return <DocViewer type="privacy" />
        return <Dashboard />
      })()}
    </Suspense>
  )
}

function App() {
  useEffect(() => {
    pingSupabaseKeepAlive();
  }, []);

  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}

export default App

