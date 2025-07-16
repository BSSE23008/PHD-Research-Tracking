import { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import SupervisorDashboard from './components/SupervisorDashboard'
import AdminDashboard from './components/AdminDashboard'
import FormManager from './components/FormManager'
import WorkflowTracker from './components/WorkflowTracker'
import NotificationSystem from './components/NotificationSystem'
import Navbar from './components/Navbar'
import { verifyToken } from './utils/api'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFormCode, setSelectedFormCode] = useState(null)

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (token) {
        try {
          const result = await verifyToken()
          if (result.success) {
            setUser(result.data.user)
            setCurrentPage('dashboard')
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token')
            sessionStorage.removeItem('token')
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          sessionStorage.removeItem('token')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Handle login
  const handleLogin = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store token
        if (formData.rememberMe) {
          localStorage.setItem('token', data.data.token)
        } else {
          sessionStorage.setItem('token', data.data.token)
        }
        
        setUser(data.data.user)
        setCurrentPage('dashboard')
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, message: 'Network error. Please check if the backend is running.' }
    }
  }

  // Handle signup
  const handleSignup = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.data.token)
        setUser(data.data.user)
        setCurrentPage('dashboard')
        return { success: true }
      } else {
        return { success: false, message: data.message }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Network error. Please check if the backend is running.' }
    }
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
    setUser(null)
    setCurrentPage('login')
  }

  // Generate navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return []

    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: null }
    ]

    if (user.role === 'student') {
      baseItems.push(
        { id: 'forms', label: 'Forms', icon: null },
        { id: 'workflow', label: 'Progress', icon: null }
      )
    }

    if (user.role === 'supervisor') {
      baseItems.push(
        { id: 'students', label: 'My Students', icon: null }
      )
    }

    if (user.role === 'admin') {
      baseItems.push(
        { id: 'admin', label: 'Admin Panel', icon: null },
        { id: 'analytics', label: 'Analytics', icon: null }
      )
    }

    baseItems.push(
      { id: 'notifications', label: 'Notifications', icon: null }
    )

    return baseItems
  }

  // Enhanced navigation based on user role
  const getRoleBasedDashboard = () => {
    if (!user) return null

    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />
      case 'supervisor':
        return <SupervisorDashboard user={user} />
      case 'student':
        return <Dashboard user={user} onNavigate={setCurrentPage} onFormSelect={setSelectedFormCode} />
      default:
        return <Dashboard user={user} onNavigate={setCurrentPage} onFormSelect={setSelectedFormCode} />
    }
  }

  // Main content router
  const renderContent = () => {
    if (!user) {
      return currentPage === 'signup' ? (
        <Signup 
          onSignup={handleSignup} 
          onSwitchToLogin={() => setCurrentPage('login')} 
        />
      ) : (
        <Login 
          onLogin={handleLogin} 
          onSwitchToSignup={() => setCurrentPage('signup')} 
        />
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return getRoleBasedDashboard()
      case 'forms':
        return user.role === 'student' ? <FormManager user={user} selectedFormCode={selectedFormCode} onFormCodeCleared={() => setSelectedFormCode(null)} /> : getRoleBasedDashboard()
      case 'workflow':
        return user.role === 'student' ? <WorkflowTracker onNavigate={setCurrentPage} onFormSelect={setSelectedFormCode} /> : getRoleBasedDashboard()
      case 'admin':
        return user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : getRoleBasedDashboard()
      case 'students':
        return user.role === 'supervisor' ? <SupervisorDashboard user={user} /> : getRoleBasedDashboard()
      case 'notifications': {
        const { NotificationPage } = NotificationSystem({ user })
        return <NotificationPage />
      }
      default:
        return getRoleBasedDashboard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        navigationItems={getNavigationItems()}
        activeView={currentPage}
        onNavigate={setCurrentPage}
        notifications={[]}
        showSearch={false}
      />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
