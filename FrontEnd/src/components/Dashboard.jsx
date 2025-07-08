import { useState, useEffect } from 'react';
import { PHDEE02AForm } from './forms/PHDEE02-A';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'forms', 'phdee02a'

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setUserProfile(user);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleLogout = () => {
    // Clear any stored tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    onLogout();
  };

  const handleFormSubmissionComplete = (submissionData) => {
    console.log('Form submitted successfully:', submissionData);
    // You can add a success message or redirect here
    setCurrentView('dashboard');
    // Optional: Show success notification
    alert('Form submitted successfully!');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Render the form view
  if (currentView === 'phdee02a') {
    return (
      <div className="dashboard-container">
        <div className="dashboard-wrapper">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <div className="header-left">
                <h1>PhD Research Tracking</h1>
                <p>PHDEE02-A Form</p>
              </div>
              <div className="header-right">
                <div className="user-info">
                  <span className="user-name">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </span>
                  <span className="user-role">{userProfile?.role?.toUpperCase()}</span>
                </div>
                <button 
                  onClick={() => setCurrentView('dashboard')} 
                  className="logout-btn"
                  style={{ marginRight: '1rem' }}
                >
                  Back to Dashboard
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          </header>

          {/* Form Content */}
          <main className="dashboard-main">
            <PHDEE02AForm 
              user={userProfile}
              onClose={() => setCurrentView('dashboard')}
              onSubmissionComplete={handleFormSubmissionComplete}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="header-left">
              <h1>PhD Research Tracking</h1>
              <p>Welcome back, {userProfile?.firstName}!</p>
            </div>
            <div className="header-right">
              <div className="user-info">
                <span className="user-name">
                  {userProfile?.firstName} {userProfile?.lastName}
                </span>
                <span className="user-role">{userProfile?.role?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="welcome-section">
            <div className="welcome-card">
              <h2>🎉 Login Successful!</h2>
              <p>You have successfully logged into the PhD Research Tracking System.</p>
              
              <div className="user-details">
                <h3>Your Profile Information:</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Name:</strong> {userProfile?.firstName} {userProfile?.lastName}
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong> {userProfile?.email}
                  </div>
                  <div className="detail-item">
                    <strong>Role:</strong> {userProfile?.role}
                  </div>
                  <div className="detail-item">
                    <strong>User ID:</strong> {userProfile?.id}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forms Section */}
          <div className="dashboard-sections">
            <div className="section-card">
              <h3>📋 Research Forms</h3>
              <p>Access and complete your research tracking forms with auto-filled data from your profile.</p>
              <div className="feature-list">
                <div className="feature-item">
                  <strong>PHDEE02-A Form</strong>
                  <p style={{ margin: '0.5rem 0 1rem 0', fontSize: '0.9rem', color: '#6c757d' }}>
                    Research project registration and tracking form
                  </p>
                  <button 
                    onClick={() => setCurrentView('phdee02a')}
                    className="action-btn primary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  >
                    Open Form
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Role-specific sections */}
          <div className="dashboard-sections">
            {userProfile?.role === 'student' && (
              <div className="section-card">
                <h3>📚 Student Dashboard</h3>
                <p>Track your PhD research progress, manage tasks, and communicate with your supervisor.</p>
                <div className="feature-list">
                  <div className="feature-item">✅ Research Progress Tracking</div>
                  <div className="feature-item">📋 Task Management</div>
                  <div className="feature-item">📊 Progress Reports</div>
                  <div className="feature-item">💬 Supervisor Communication</div>
                </div>
              </div>
            )}

            {userProfile?.role === 'supervisor' && (
              <div className="section-card">
                <h3>👨‍🏫 Supervisor Dashboard</h3>
                <p>Monitor your students' progress and manage research supervision activities.</p>
                <div className="feature-list">
                  <div className="feature-item">👥 Student Overview</div>
                  <div className="feature-item">📈 Progress Monitoring</div>
                  <div className="feature-item">📝 Review Tasks</div>
                  <div className="feature-item">📅 Meeting Scheduling</div>
                </div>
              </div>
            )}

            {userProfile?.role === 'admin' && (
              <div className="section-card">
                <h3>⚙️ Admin Dashboard</h3>
                <p>Manage users, system settings, and overall platform administration.</p>
                <div className="feature-list">
                  <div className="feature-item">👥 User Management</div>
                  <div className="feature-item">📊 System Analytics</div>
                  <div className="feature-item">⚙️ Settings Control</div>
                  <div className="feature-item">🔒 Security Management</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn primary">View Profile</button>
              <button className="action-btn secondary">Update Settings</button>
              <button className="action-btn secondary">Help & Support</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 