import { useState, useEffect } from 'react';
import { SupervisorConsentForm } from './forms/SupervisorConsentForm';
import { FormPreview } from './forms/FormPreview';
import { Timeline } from './Timeline';
import { 
  Users, Clock, CheckCircle, AlertCircle, BookOpen, Calendar, 
  TrendingUp, FileText, GraduationCap, Eye, Download, Printer,
  BarChart3, Settings, Bell, Search, Filter, RefreshCw
} from 'lucide-react';
import './Dashboard.css';
import './SupervisorDashboard.css';

const SupervisorDashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [pendingForms, setPendingForms] = useState([]);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedForms: 0,
    totalSubmissions: 0,
    recentActivity: 0
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

  const handlePreviewForm = (formSubmission) => {
    setSelectedFormSubmission(formSubmission);
    setCurrentView('form-preview');
  };

  const showNotification = (message, type = 'info') => {
    // Enhanced notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  };

  const getInitials = (firstName, lastName) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  const filteredForms = pendingForms.filter(form => {
    const matchesSearch = form.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.project_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || form.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
            <RefreshCw size={16} />
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
        <div className="supervisor-header modern-header">
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

  // Render form preview view
  if (currentView === 'form-preview' && selectedFormSubmission) {
    return (
      <div className="supervisor-dashboard">
        <div className="supervisor-header modern-header">
          <div className="supervisor-header-content">
            <div className="supervisor-welcome">
              <div className="supervisor-avatar">
                {getInitials(userProfile?.first_name, userProfile?.last_name)}
              </div>
              <div className="supervisor-info">
                <h1>Form Preview</h1>
                <p>Preview for {selectedFormSubmission.student_name}</p>
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
          <FormPreview 
            formSubmission={selectedFormSubmission}
            onClose={() => setCurrentView('dashboard')}
          />
        </div>
      </div>
    );
  }

  // Render timeline view
  if (currentView === 'timeline') {
    return (
      <div className="supervisor-dashboard">
        <div className="supervisor-header modern-header">
          <div className="supervisor-header-content">
            <div className="supervisor-welcome">
              <div className="supervisor-avatar">
                {getInitials(userProfile?.first_name, userProfile?.last_name)}
              </div>
              <div className="supervisor-info">
                <h1>Timeline & Activity</h1>
                <p>Track form submissions and approvals</p>
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
          <Timeline 
            userEmail={userProfile?.email}
            onClose={() => setCurrentView('dashboard')}
          />
        </div>
      </div>
    );
  }

  // Main supervisor dashboard
  return (
    <div className="supervisor-dashboard">
      {/* Modern Header with Navigation */}
      <div className="supervisor-header modern-header">
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
            <div className="notification-wrapper">
              <button 
                className="modern-btn modern-btn-icon" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {stats.pendingApprovals > 0 && (
                  <span className="notification-badge">{stats.pendingApprovals}</span>
                )}
              </button>
            </div>
            <button 
              onClick={() => setCurrentView('timeline')} 
              className="modern-btn modern-btn-secondary"
            >
              <Calendar size={16} />
              Timeline
            </button>
            <button onClick={handleLogout} className="modern-btn modern-btn-primary">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="supervisor-main">
        {/* Enhanced Stats Grid */}
        <div className="stats-grid enhanced-stats">
          <div className="stat-card urgent-stat">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.pendingApprovals}</h3>
                <p className="stat-label">Pending Approvals</p>
              </div>
              <div className="stat-icon urgent-icon">
                <Clock size={24} />
              </div>
            </div>
            <div className="stat-trend urgent-trend">
              <AlertCircle size={16} />
              <span>Requires immediate attention</span>
            </div>
          </div>

          <div className="stat-card success-stat">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.approvedForms}</h3>
                <p className="stat-label">Approved Forms</p>
              </div>
              <div className="stat-icon success-icon">
                <CheckCircle size={24} />
              </div>
            </div>
            <div className="stat-trend success-trend">
              <TrendingUp size={16} />
              <span>This month</span>
            </div>
          </div>

          <div className="stat-card info-stat">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.totalStudents}</h3>
                <p className="stat-label">Active Students</p>
              </div>
              <div className="stat-icon info-icon">
                <Users size={24} />
              </div>
            </div>
            <div className="stat-trend info-trend">
              <GraduationCap size={16} />
              <span>Under supervision</span>
            </div>
          </div>

          <div className="stat-card neutral-stat">
            <div className="stat-header">
              <div>
                <h3 className="stat-number">{stats.totalSubmissions}</h3>
                <p className="stat-label">Total Submissions</p>
              </div>
              <div className="stat-icon neutral-icon">
                <FileText size={24} />
              </div>
            </div>
            <div className="stat-trend neutral-trend">
              <BarChart3 size={16} />
              <span>All time</span>
            </div>
          </div>
        </div>

        {/* Enhanced Pending Approvals Section */}
        <div className="section-card enhanced-section">
          <div className="section-header enhanced-header">
            <div className="section-title-group">
              <h2 className="section-title">
                <AlertCircle size={24} />
                Student Forms Awaiting Your Approval
              </h2>
              <p className="section-subtitle">
                Review and approve student research proposals that require your consent
              </p>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="section-controls">
              <div className="search-wrapper">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search students or projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-wrapper">
                <Filter size={16} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <button 
                onClick={() => {
                  loadPendingForms();
                  loadStats();
                }}
                className="refresh-btn"
                title="Refresh data"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          
          <div className="section-content">
            {filteredForms.length === 0 ? (
              <div className="empty-state enhanced-empty">
                <div className="empty-state-icon">
                  {searchTerm || filterStatus !== 'all' ? <Search size={48} /> : <CheckCircle size={48} />}
                </div>
                <h3>{searchTerm || filterStatus !== 'all' ? 'No results found' : 'All caught up!'}</h3>
                <p>
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No student forms are currently awaiting your approval. New submissions will appear here when students submit their research proposals.'
                  }
                </p>
                {(searchTerm || filterStatus !== 'all') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    className="modern-btn modern-btn-secondary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="forms-grid enhanced-forms">
                {filteredForms.map((formSubmission) => (
                  <div key={formSubmission.id} className="form-card enhanced-card">
                    <div className="form-card-header">
                      <div className="form-card-title-group">
                        <h4 className="form-card-title">PHDEE02-A Form</h4>
                        <span className="form-id">#{formSubmission.id}</span>
                      </div>
                      <span className="form-status pending">
                        <Clock size={12} />
                        Awaiting Consent
                      </span>
                    </div>
                    
                    <div className="form-card-content">
                      <div className="student-info">
                        <div className="student-avatar">
                          {formSubmission.student_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="student-details">
                          <h5 className="student-name">{formSubmission.student_name}</h5>
                          <p className="student-email">{formSubmission.student_email}</p>
                        </div>
                      </div>
                      
                      <div className="form-details">
                        <div className="form-detail">
                          <span className="form-detail-label">Project:</span>
                          <span className="form-detail-value" title={formSubmission.project_title}>
                            {formSubmission.project_title || 'No title provided'}
                          </span>
                        </div>
                        <div className="form-detail">
                          <span className="form-detail-label">Submitted:</span>
                          <span className="form-detail-value">
                            {new Date(formSubmission.submitted_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-card-actions enhanced-actions">
                      <button 
                        onClick={() => handlePreviewForm(formSubmission)}
                        className="form-action-btn secondary"
                        title="Preview form details"
                      >
                        <Eye size={16} />
                        Preview
                      </button>
                      <button 
                        onClick={() => handleFillConsentForm(formSubmission)}
                        className="form-action-btn primary"
                        title="Fill consent form"
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

        {/* Enhanced Quick Actions */}
        <div className="quick-actions enhanced-actions">
          <h3>Quick Actions</h3>
          <div className="quick-actions-grid">
            <div className="quick-action-item" onClick={() => setCurrentView('timeline')}>
              <div className="quick-action-icon">
                <Calendar size={24} />
              </div>
              <h4 className="quick-action-title">View Timeline</h4>
              <p className="quick-action-desc">Track all form activities</p>
            </div>
            
            <div className="quick-action-item" onClick={() => window.location.reload()}>
              <div className="quick-action-icon">
                <RefreshCw size={24} />
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
                <BarChart3 size={24} />
              </div>
              <h4 className="quick-action-title">Analytics</h4>
              <p className="quick-action-desc">View supervision reports</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard; 