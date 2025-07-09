import { useState, useEffect } from 'react'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import SupervisorDashboard from './components/SupervisorDashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login') // 'login', 'signup', 'dashboard'
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      if (token) {
        try {
          // Verify token with backend
          const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
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
          localStorage.setItem('token', data.token)
        } else {
          sessionStorage.setItem('token', data.token)
        }
        
        setUser(data.user)
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
      // Convert boolean agreeToTerms to string for backend validation
      const signupData = {
        ...formData,
        agreeToTerms: formData.agreeToTerms.toString()
      };

      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      })

      const data = await response.json()

      if (response.ok) {
        // Store token
        localStorage.setItem('token', data.token)
        setUser(data.user)
        setCurrentPage('dashboard')
        return { success: true }
      } else {
        return { success: false, message: data.message, errors: data.errors }
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

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          color: '#6c757d'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #B6B09F',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Enhanced Login component with API integration
  const EnhancedLogin = () => (
    <Login 
      onSwitchToSignup={() => setCurrentPage('signup')} 
      onLogin={handleLogin}
    />
  )

  // Enhanced Signup component with API integration
  const EnhancedSignup = () => (
    <Signup 
      onSwitchToLogin={() => setCurrentPage('login')} 
      onSignup={handleSignup}
    />
  )

  return (
    <div className="App">
      {currentPage === 'login' && <EnhancedLogin />}
      {currentPage === 'signup' && <EnhancedSignup />}
      {currentPage === 'dashboard' && (
        user?.role === 'supervisor' ? (
          <SupervisorDashboard 
            user={user} 
            onLogout={handleLogout}
          />
        ) : (
        <Dashboard 
          user={user} 
          onLogout={handleLogout}
        />
        )
      )}
    </div>
  )
}

export default App
