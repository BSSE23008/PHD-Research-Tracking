import { useState, useEffect } from 'react';
import { SupervisorConsentForm } from './forms/SupervisorConsentForm';
import { Users, Clock, CheckCircle, AlertCircle, BookOpen, Calendar, TrendingUp, FileText, GraduationCap } from 'lucide-react';
import './Dashboard.css';
import './SupervisorDashboard.css';

const SupervisorDashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [pendingForms, setPendingForms] = useState([]);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedForms: 0,
    totalSubmissions: 0
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        setUserProfile(user);
        await loadPendingForms();
        await loadStats();
      } catch (error) {
        console.error('Error initializing supervisor dashboard:', error);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user]);

  const loadPendingForms = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Loading pending forms for supervisor:', user?.email);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('/api/forms/supervisor/pending-approvals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Pending forms result:', result);
        setPendingForms(result.data || []);
      } else {
        // Try to get error message, but handle HTML responses
        let errorMessage = 'Unknown error';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'API returned error';
        } catch {
          // Response is not JSON (likely HTML error page)
          const textResponse = await response.text();
          console.error('Non-JSON response received:', textResponse.substring(0, 200));
          errorMessage = `Backend server error (Status: ${response.status}). Check if backend is running on correct port.`;
        }
        console.error('Error response:', errorMessage);
        setError(`Failed to load pending forms: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error loading pending forms:', error);
      if (error.message.includes('fetch')) {
        setError('Cannot connect to backend server. Please check if backend is running on http://localhost:3001');
      } else {
        setError(`Network error while loading pending forms: ${error.message}`);
      }
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      console.log('Loading supervisor stats...');
      
      // Load overall supervisor statistics
      const response = await fetch('/api/forms/supervisor/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Stats response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Stats result:', result);
        setStats(result.data || stats);
      } else {
        // Try to get error message, but handle HTML responses
        try {
          const errorData = await response.json();
          console.error('Stats error response:', errorData);
        } catch {
          // Response is not JSON (likely HTML error page)
          const textResponse = await response.text();
          console.error('Stats non-JSON response:', textResponse.substring(0, 200));
        }
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't set error for stats as it's not critical, but log for debugging
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    onLogout();
  };

  const handleConsentFormSubmission = async (consentData) => {
    console.log('Consent form submitted:', consentData);
    await loadPendingForms();
    await loadStats();
    setCurrentView('dashboard');
    setSelectedFormSubmission(null);
    
    // Show success notification
    showNotification('Supervisor consent form submitted successfully!', 'success');
  };

  const handleFillConsentForm = (formSubmission) => {
    console.log('Opening consent form for:', formSubmission);
    setSelectedFormSubmission(formSubmission);
    setCurrentView('consent-form');
  };

  const showNotification = (message) => {
    // Simple notification for now - could be enhanced with a proper notification system
    alert(message);
  };

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="supervisor-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading supervisor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="supervisor-dashboard">
        <div className="error-state" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <AlertCircle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error Loading Dashboard</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="modern-btn modern-btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Render consent form view
  if (currentView === 'consent-form' && selectedFormSubmission) {
    return (
      <div className="supervisor-dashboard">
        <div className="supervisor-header">
          <div className="supervisor-header-content">
            <div className="supervisor-welcome">
              <div className="supervisor-avatar">
                {getInitials(userProfile?.first_name, userProfile?.last_name)}
              </div>
              <div className="supervisor-info">
                <h1>Supervisor Consent Form</h1>
                <p>Fill consent form for {selectedFormSubmission.student_name}</p>
              </div>
            </div>
            <div className="supervisor-actions">
              <button 
                onClick={() => setCurrentView('dashboard')} 
                className="modern-btn modern-btn-secondary"
              >
                ← Back to Dashboard
              </button>
              <button onClick={handleLogout} className="modern-btn modern-btn-primary">
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="supervisor-main">
          <SupervisorConsentForm 
            user={userProfile}
            formSubmission={selectedFormSubmission}
            onClose={() => setCurrentView('dashboard')}
            onSubmissionComplete={handleConsentFormSubmission}
          />
        </div>
      </div>
    );
  }

  // Main supervisor dashboard
  return (
    <div className="supervisor-dashboard">
      {/* Modern Header */}
      <div className="supervisor-header">
        <div className="supervisor-header-content">
          <div className="supervisor-welcome">
            <div className="supervisor-avatar">
              {getInitials(userProfile?.first_name, userProfile?.last_name)}
            </div>
            <div className="supervisor-info">
              <h1>Welcome, {userProfile?.title} {userProfile?.first_name} {userProfile?.last_name}</h1>
              <p>{userProfile?.department} | {userProfile?.institution}</p>
            </div>
          </div>
          <div className="supervisor-actions">
            <button onClick={handleLogout} className="modern-btn modern-btn-primary">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="supervisor-main">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.pendingApprovals}</h3>
                <p className="stat-label">Pending Approvals</p>
              </div>
              <div className="stat-icon">
                <Clock size={24} />
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUp size={16} />
              <span>Requires attention</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.approvedForms}</h3>
                <p className="stat-label">Approved Forms</p>
              </div>
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUp size={16} />
              <span>This month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.totalStudents}</h3>
                <p className="stat-label">Active Students</p>
              </div>
              <div className="stat-icon">
                <Users size={24} />
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUp size={16} />
              <span>Under supervision</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.totalSubmissions}</h3>
                <p className="stat-label">Total Submissions</p>
              </div>
              <div className="stat-icon">
                <FileText size={24} />
              </div>
            </div>
            <div className="stat-trend">
              <TrendingUp size={16} />
              <span>All time</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">
              <AlertCircle size={24} />
              Student Forms Awaiting Your Approval
            </h2>
            <p className="section-subtitle">
              Review and approve student research proposals that require your consent
            </p>
          </div>
          
          <div className="section-content">
            {pendingForms.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <CheckCircle size={32} />
                </div>
                <h3>All caught up!</h3>
                <p>No student forms are currently awaiting your approval.<br />
                   New submissions will appear here when students submit their research proposals.</p>
              </div>
            ) : (
              <div className="forms-grid">
                {pendingForms.map((formSubmission) => (
                  <div key={formSubmission.id} className="form-card">
                    <div className="form-card-header">
                      <h4 className="form-card-title">PHDEE02-A Form</h4>
                      <span className="form-status pending">
                        Awaiting Consent
                      </span>
                    </div>
                    
                    <div className="form-card-content">
                      <div className="form-detail">
                        <span className="form-detail-label">Student:</span>
                        <span className="form-detail-value">{formSubmission.student_name}</span>
                      </div>
                      <div className="form-detail">
                        <span className="form-detail-label">Email:</span>
                        <span className="form-detail-value">{formSubmission.student_email}</span>
                      </div>
                      <div className="form-detail">
                        <span className="form-detail-label">Project:</span>
                        <span className="form-detail-value">{formSubmission.project_title}</span>
                      </div>
                      <div className="form-detail">
                        <span className="form-detail-label">Submitted:</span>
                        <span className="form-detail-value">
                          {new Date(formSubmission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="form-card-actions">
                      <button 
                        onClick={() => handleFillConsentForm(formSubmission)}
                        className="form-action-btn primary"
                      >
                        <FileText size={16} />
                        Fill Consent Form
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-item" onClick={() => window.location.reload()}>
              <div className="quick-action-icon">
                <Clock size={24} />
              </div>
              <h4 className="quick-action-title">Refresh Dashboard</h4>
              <p className="quick-action-desc">Check for new submissions</p>
            </div>
            
            <div className="quick-action-item">
              <div className="quick-action-icon">
                <GraduationCap size={24} />
              </div>
              <h4 className="quick-action-title">Student Management</h4>
              <p className="quick-action-desc">View all your students</p>
            </div>
            
            <div className="quick-action-item">
              <div className="quick-action-icon">
                <BookOpen size={24} />
              </div>
              <h4 className="quick-action-title">Research Reports</h4>
              <p className="quick-action-desc">Generate supervision reports</p>
            </div>
            
            <div className="quick-action-item">
              <div className="quick-action-icon">
                <Calendar size={24} />
              </div>
              <h4 className="quick-action-title">Schedule Meetings</h4>
              <p className="quick-action-desc">Plan student consultations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard; 