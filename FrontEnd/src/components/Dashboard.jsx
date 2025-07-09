import { useState, useEffect } from 'react';
import { PHDEE02AForm } from './forms/PHDEE02-A';
import { FormViewer } from './forms/FormViewer';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'forms', 'phdee02a', 'form-viewer'
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState(null);
  const [supervisorConsent, setSupervisorConsent] = useState(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
      setUserProfile(user);
        
        // Load user's form submissions
        await loadFormSubmissions();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
      setLoading(false);
      }
    };

    initializeDashboard();
  }, [user]);

  const loadFormSubmissions = async () => {
    try {
      const response = await fetch('/api/forms/submissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setFormSubmissions(result.submissions || []);
      }
    } catch (error) {
      console.error('Error loading form submissions:', error);
    }
  };

  const handleLogout = () => {
    // Clear any stored tokens
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    onLogout();
  };

  const handleFormSubmissionComplete = async (submissionData) => {
    console.log('Form submitted successfully:', submissionData);
    // Reload form submissions to show the new submission
    await loadFormSubmissions();
    setCurrentView('dashboard');
    alert('Form submitted successfully!');
  };

  const handleViewForm = async (formSubmission) => {
    try {
      setSelectedFormSubmission(formSubmission);
      
      // Try to load supervisor consent if it exists
      const consentResponse = await fetch(`/api/forms/supervisor-consent/${formSubmission.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (consentResponse.ok) {
        const consentResult = await consentResponse.json();
        setSupervisorConsent(consentResult.data);
      } else {
        setSupervisorConsent(null);
      }
      
      setCurrentView('form-viewer');
    } catch (error) {
      console.error('Error loading form details:', error);
      setSupervisorConsent(null);
      setCurrentView('form-viewer');
    }
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

  // Render the form viewer
  if (currentView === 'form-viewer' && selectedFormSubmission) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-wrapper">
          <FormViewer
            formSubmission={selectedFormSubmission}
            supervisorConsent={supervisorConsent}
            onClose={() => setCurrentView('dashboard')}
          />
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

          {/* Form Submissions Section */}
          <div className="dashboard-sections">
            <div className="section-card">
              <h3>📄 Your Form Submissions</h3>
              <p>Track the status of your submitted forms and supervisor approvals.</p>
              
              {formSubmissions.length === 0 ? (
                <div style={{ 
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6c757d',
                  fontStyle: 'italic'
                }}>
                  No form submissions yet. Start by filling out the PHDEE02-A form above.
                </div>
              ) : (
                <div className="submissions-list">
                  {formSubmissions.map((submission) => (
                    <div key={submission.id} className="submission-item" style={{
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      margin: '1rem 0',
                      background: 'white'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#000' }}>
                            {submission.form_type} Form
                          </h4>
                          <p style={{ margin: '0', fontSize: '0.9rem', color: '#6c757d' }}>
                            Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <span className={`status-badge ${
                          submission.supervisor_approval_status === 'approved' ? 'approved' :
                          submission.supervisor_approval_status === 'rejected' ? 'rejected' : 'pending'
                        }`} style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          background: submission.supervisor_approval_status === 'approved' ? '#d4edda' :
                                     submission.supervisor_approval_status === 'rejected' ? '#f8d7da' : '#fff3cd',
                          color: submission.supervisor_approval_status === 'approved' ? '#155724' :
                                submission.supervisor_approval_status === 'rejected' ? '#721c24' : '#856404'
                        }}>
                          {submission.supervisor_approval_status === 'approved' && '✓ Approved'}
                          {submission.supervisor_approval_status === 'rejected' && '✗ Rejected'}
                          {submission.supervisor_approval_status === 'pending' && '⏳ Pending Approval'}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>Project:</strong> {submission.form_data.projectTitle}
                        </p>
                        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                          <strong>Supervisor:</strong> {submission.form_data.supervisorName}
                        </p>
                        
                        {submission.supervisor_approval_status === 'approved' && submission.supervisor_approved_at && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#28a745' }}>
                            <strong>Approved on:</strong> {new Date(submission.supervisor_approved_at).toLocaleDateString()}
                          </p>
                        )}
                        
                        {submission.supervisor_approval_status === 'pending' && (
                          <p style={{ 
                            margin: '0.5rem 0',
                            fontSize: '0.85rem',
                            color: '#856404',
                            fontStyle: 'italic',
                            padding: '0.5rem',
                            background: '#fff3cd',
                            borderRadius: '4px'
                          }}>
                            Waiting for supervisor to fill and approve the consent form.
                          </p>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => handleViewForm(submission)}
                        className="action-btn secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                      >
                        View Form & Status
                      </button>
                    </div>
                  ))}
                </div>
              )}
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