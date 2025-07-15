import { useState, useEffect } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  // Change 1: Set initial page state to null to let the auth check decide.
  const [currentPage, setCurrentPage] = useState(null); 
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/verify-token', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setCurrentPage('dashboard');
          } else {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            // Change 2: If token is invalid, go to login.
            setCurrentPage('login'); 
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setCurrentPage('login');
        }
      } else {
        // Change 3: If no token exists, default to login page.
        setCurrentPage('login'); 
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Handle login (No changes needed here)
  const handleLogin = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await response.json();
      if (response.ok) {
        if (formData.rememberMe) {
          localStorage.setItem('token', data.token);
        } else {
          sessionStorage.setItem('token', data.token);
        }
        setUser(data.user);
        setCurrentPage('dashboard');
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please check if the backend is running.' };
    }
  };

  // Handle signup (No changes needed here)
  const handleSignup = async (formData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setCurrentPage('dashboard');
        return { success: true };
      } else {
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Network error. Please check if the backend is running.' };
    }
  };

  // Handle logout (No changes needed here)
  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
  };
  
  // Show a generic loading screen while checking auth
  if (loading) {
    return (
      <div className="App-loading">
        <div className="spinner"></div>
        <p>Initializing...</p>
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'login' && (
        <Login onSwitchToSignup={() => setCurrentPage('signup')} onLogin={handleLogin} />
      )}
      {currentPage === 'signup' && (
        <Signup onSwitchToLogin={() => setCurrentPage('login')} onSignup={handleSignup} />
      )}
      {currentPage === 'dashboard' && user && (
        // Change 4: Pass the actual 'user' object from state, not the mock user.
        <Dashboard  
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;