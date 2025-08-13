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
import OnboardingFlow from './components/OnboardingFlow'
import EnhancedStudentDashboard from './components/EnhancedStudentDashboard'
import EnhancedFacultyDashboard from './components/EnhancedFacultyDashboard'
import DynamicFormRenderer from './components/DynamicFormRenderer'
import UserManagement from './components/UserManagement'
import { verifyToken } from './utils/api'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedFormCode, setSelectedFormCode] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      if (token) {
        try {
          const result = await verifyToken()
          if (result.success) {
            const userData = result.data.user;
            setUser(userData);
            
            // Check if user needs onboarding
            if (userData.role === 'student' && shouldShowOnboarding(userData)) {
              setShowOnboarding(true);
              setCurrentPage('onboarding');
            } else {
              setCurrentPage('dashboard');
            }
          } else {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            setCurrentPage('login');
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setCurrentPage('login');
        }
      } else {
        setCurrentPage('login');
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Determine if student needs onboarding
  const shouldShowOnboarding = (userData) => {
    // Show onboarding if:
    // - Student doesn't have a supervisor assigned
    // - Student is in first semester and hasn't completed initial setup
    // - Student profile is incomplete
    return userData.role === 'student' && 
           !userData.primary_supervisor_id && 
           userData.current_semester === '1st';
  };

  const handleLogin = (userData) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
    
    // Check if student needs onboarding
    if (userData.role === 'student' && shouldShowOnboarding(userData)) {
      setShowOnboarding(true);
      setCurrentPage('onboarding');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
    setShowOnboarding(false);
    setSelectedFormCode(null);
  };

  const handleNavigation = (page, formCode = null) => {
    setCurrentPage(page);
    if (formCode) {
      setSelectedFormCode(formCode);
    }
  };

  const handleSwitchToSignup = () => {
    setCurrentPage('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentPage('login');
  };

  const handleSignup = async (userData) => {
    console.log('Signup successful, user data:', userData);
    // After successful signup, redirect to login
    setCurrentPage('login');
    // You might want to show a success message here
  };

  const handleOnboardingComplete = (result) => {
    setShowOnboarding(false);
    setCurrentPage('dashboard');
    
    // Show success message
    if (result && result.message) {
      alert(result.message);
    }
    
    // Update user data to reflect onboarding completion
    setUser(prev => ({
      ...prev,
      onboarding_completed: true
    }));
  };

  const getDashboardComponent = () => {
    if (!user) return null;

    // Role-based dashboard selection
    switch (user.role) {
      case 'student':
        return (
          <EnhancedStudentDashboard 
            user={user} 
            onNavigate={handleNavigation} 
            onFormSelect={setSelectedFormCode}
          />
        );
        
      case 'supervisor':
      case 'faculty':
      case 'gec_member':
      case 'hod':
      case 'chairperson':
        return (
          <EnhancedFacultyDashboard 
            user={user} 
            onNavigate={handleNavigation}
          />
        );
        
      case 'admin':
        return (
          <AdminDashboard 
            user={user} 
            onNavigate={handleNavigation}
          />
        );
        
      default:
        // Fallback to original dashboard
        return (
          <Dashboard 
            user={user} 
            onNavigate={handleNavigation} 
            onFormSelect={setSelectedFormCode}
          />
        );
    }
  };

  const getFormsComponent = () => {
    // Use enhanced dynamic form renderer for students
    if (user && user.role === 'student') {
      return (
        <DynamicFormRenderer
          user={user}
          selectedFormCode={selectedFormCode}
          onNavigate={handleNavigation}
        />
      );
    }
    
    // Fallback to original form manager for other roles
    return (
      <FormManager
        user={user}
        selectedFormCode={selectedFormCode}
        onNavigate={handleNavigation}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-600">Loading PhD Research Tracking System...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  // Render current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'login':
        return (
          <Login 
            onLogin={handleLogin} 
            onSwitchToSignup={handleSwitchToSignup}
          />
        );

      case 'signup':
        return (
          <Signup 
            onSignup={handleSignup} 
            onSwitchToLogin={handleSwitchToLogin}
          />
        );

      case 'onboarding':
        return (
          <OnboardingFlow 
            user={user}
            onComplete={handleOnboardingComplete}
            onNavigate={handleNavigation}
          />
        );

      case 'dashboard':
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            {getDashboardComponent()}
          </div>
        );

      case 'forms':
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            {getFormsComponent()}
          </div>
        );

      case 'workflow':
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            <WorkflowTracker 
              user={user} 
              onNavigate={handleNavigation}
            />
          </div>
        );

      case 'notifications':
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            <NotificationSystem 
              user={user} 
              onNavigate={handleNavigation}
            />
          </div>
        );

      case 'admin':
        // Only allow admin users to access admin dashboard
        if (user.role !== 'admin') {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-6">You don't have permission to access the admin dashboard.</p>
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            <AdminDashboard 
              user={user} 
              onNavigate={handleNavigation}
            />
          </div>
        );

      case 'users':
        // Only allow admin users to access user management
        if (user.role !== 'admin') {
          return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🚫</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-6">You don't have permission to access user management.</p>
                <button
                  onClick={() => handleNavigation('dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="min-h-screen bg-gray-50">
            <Navbar 
              user={user} 
              onLogout={handleLogout} 
              onNavigate={handleNavigation}
              currentPage={currentPage}
            />
            <UserManagement 
              user={user} 
              onNavigate={handleNavigation}
            />
          </div>
        );

      default:
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
              <button
                onClick={() => handleNavigation('dashboard')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {renderCurrentPage()}
      
      {/* Global notifications or modals can be added here */}
      {showOnboarding && currentPage !== 'onboarding' && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <p className="font-medium">Complete your onboarding!</p>
          <p className="text-sm mt-1">Finish setting up your PhD program profile.</p>
          <button
            onClick={() => setCurrentPage('onboarding')}
            className="mt-2 px-3 py-1 bg-white text-blue-600 rounded text-sm hover:bg-gray-100"
          >
            Complete Now
          </button>
        </div>
      )}
    </div>
  );
}

export default App;