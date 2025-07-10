import { useState, useEffect } from 'react';
import { SupervisorConsentForm } from './forms/SupervisorConsentForm';
import { FormPreview } from './forms/FormPreview';
import { Timeline } from './Timeline';
import Navbar from './Navbar';
import { 
  Users, Clock, CheckCircle, AlertCircle, BookOpen, Calendar, 
  TrendingUp, FileText, GraduationCap, Eye, Download, Printer,
  BarChart3, Settings, Bell, Search, Filter, RefreshCw, Home,
  PlusCircle, Archive, Activity
} from 'lucide-react';

const SupervisorDashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [pendingForms, setPendingForms] = useState([]);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState('light');
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedForms: 0,
    rejectedForms: 0,
    totalSubmissions: 0,
    recentActivity: 0
  });

  // Navigation items for the navbar
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'pending', label: 'Pending Forms', icon: Clock },
    { id: 'submitted', label: 'All Submissions', icon: Archive },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        setUserProfile(user);
        await Promise.all([
          loadPendingForms(),
          loadSubmittedForms(), 
          loadStats(),
          loadNotifications()
        ]);
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
      const response = await fetch('/api/forms/supervisor/pending-approvals', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setPendingForms(result.data || []);
      } else {
        console.error('Failed to load pending forms');
        // Use mock data if API fails
        setPendingForms(getMockPendingForms());
      }
    } catch (error) {
      console.error('Error loading pending forms:', error);
      setPendingForms(getMockPendingForms());
    }
  };

  const loadSubmittedForms = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/forms/supervisor/all-submissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSubmittedForms(result.data || []);
      } else {
        console.error('Failed to load submitted forms');
        setSubmittedForms(getMockSubmittedForms());
      }
    } catch (error) {
      console.error('Error loading submitted forms:', error);
      setSubmittedForms(getMockSubmittedForms());
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/forms/supervisor/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data || stats);
      } else {
        // Use calculated stats from forms data
        calculateStats();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      calculateStats();
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/notifications/supervisor', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
      } else {
        setNotifications(getMockNotifications());
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications(getMockNotifications());
    }
  };

  const calculateStats = () => {
    const totalSubmissions = [...pendingForms, ...submittedForms].length;
    const pendingCount = pendingForms.length;
    const approvedCount = submittedForms.filter(f => f.status === 'approved').length;
    const rejectedCount = submittedForms.filter(f => f.status === 'rejected').length;
    
    setStats({
      totalStudents: new Set([...pendingForms, ...submittedForms].map(f => f.student_email)).size,
      pendingApprovals: pendingCount,
      approvedForms: approvedCount,
      rejectedForms: rejectedCount,
      totalSubmissions,
      recentActivity: pendingCount + approvedCount + rejectedCount
    });
  };

  // Mock data functions
  const getMockPendingForms = () => [
    {
      id: 1,
      student_name: 'John Doe',
      student_email: 'john.doe@student.itu.edu.pk',
      project_title: 'Machine Learning Applications in Healthcare Diagnostics',
      submitted_at: new Date('2024-01-15T10:30:00'),
      status: 'pending',
      form_data: {
        studentId: 'PHD2024001',
        studentName: 'John Doe',
        projectDescription: 'Developing ML models for early disease detection'
      }
    },
    {
      id: 2,
      student_name: 'Sarah Ahmad',
      student_email: 'sarah.ahmad@student.itu.edu.pk',
      project_title: 'Blockchain Security in IoT Networks',
      submitted_at: new Date('2024-01-14T14:20:00'),
      status: 'pending',
      form_data: {
        studentId: 'PHD2024002',
        studentName: 'Sarah Ahmad',
        projectDescription: 'Enhancing IoT security using blockchain technology'
      }
    }
  ];

  const getMockSubmittedForms = () => [
    {
      id: 3,
      student_name: 'Ali Hassan',
      student_email: 'ali.hassan@student.itu.edu.pk',
      project_title: 'AI Ethics in Autonomous Systems',
      submitted_at: new Date('2024-01-10T09:15:00'),
      status: 'approved',
      approved_at: new Date('2024-01-12T16:30:00'),
      supervisor_comments: 'Excellent research proposal with clear methodology.',
      form_data: {
        studentId: 'PHD2024003',
        studentName: 'Ali Hassan',
        projectDescription: 'Developing ethical frameworks for AI decision-making'
      }
    },
    {
      id: 4,
      student_name: 'Fatima Khan',
      student_email: 'fatima.khan@student.itu.edu.pk',
      project_title: 'Quantum Computing for Cryptography',
      submitted_at: new Date('2024-01-08T11:45:00'),
      status: 'rejected',
      rejected_at: new Date('2024-01-09T14:20:00'),
      supervisor_comments: 'Research scope needs refinement. Please revise the methodology section.',
      form_data: {
        studentId: 'PHD2024004',
        studentName: 'Fatima Khan',
        projectDescription: 'Implementing quantum algorithms for enhanced security'
      }
    }
  ];

  const getMockNotifications = () => [
    {
      id: 1,
      message: 'New form submission from John Doe requires your approval',
      time: '2 hours ago',
      read: false,
      type: 'form_submission'
    },
    {
      id: 2,
      message: 'Reminder: 3 forms pending approval for more than 7 days',
      time: '1 day ago',
      read: false,
      type: 'reminder'
    },
    {
      id: 3,
      message: 'Ali Hassan\'s research proposal has been approved',
      time: '3 days ago',
      read: true,
      type: 'approval'
    }
  ];

  const handleNavigation = (viewId) => {
    setCurrentView(viewId);
    setSelectedFormSubmission(null);
  };

  const handleSearch = (query) => {
    setSearchTerm(query);
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleConsentFormSubmission = async (consentData) => {
    console.log('Consent form submitted:', consentData);
    await Promise.all([loadPendingForms(), loadSubmittedForms(), loadStats()]);
    setCurrentView('dashboard');
    setSelectedFormSubmission(null);
    
    // Add success notification
    const newNotification = {
      id: Date.now(),
      message: `Consent form for ${consentData.studentName} has been processed successfully`,
      time: 'Just now',
      read: false,
      type: 'success'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const handleFillConsentForm = (formSubmission) => {
    setSelectedFormSubmission(formSubmission);
    setCurrentView('consent-form');
  };

  const handlePreviewForm = (formSubmission) => {
    setSelectedFormSubmission(formSubmission);
    setCurrentView('form-preview');
  };

  const filteredForms = (forms) => {
    return forms.filter(form => {
      const matchesSearch = form.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           form.project_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           form.student_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || form.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading supervisor dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Render consent form view
  if (currentView === 'consent-form' && selectedFormSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          user={userProfile}
          onLogout={onLogout}
          navigationItems={navigationItems}
          activeView={currentView}
          onNavigate={handleNavigation}
          notifications={notifications}
          showSearch={false}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className="text-amber-600 hover:text-amber-700 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Supervisor Consent Form
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fill consent form for {selectedFormSubmission.student_name}
            </p>
          </div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          user={userProfile}
          onLogout={onLogout}
          navigationItems={navigationItems}
          activeView={currentView}
          onNavigate={handleNavigation}
          notifications={notifications}
          showSearch={false}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button 
              onClick={() => setCurrentView('dashboard')} 
              className="text-amber-600 hover:text-amber-700 flex items-center"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              Form Preview
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Preview for {selectedFormSubmission.student_name}
            </p>
          </div>
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          user={userProfile}
          onLogout={onLogout}
          navigationItems={navigationItems}
          activeView={currentView}
          onNavigate={handleNavigation}
          notifications={notifications}
          showSearch={true}
          onSearch={handleSearch}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Timeline 
            userEmail={userProfile?.email}
            onClose={() => setCurrentView('dashboard')}
          />
        </div>
      </div>
    );
  }

  // Render submitted forms view
  if (currentView === 'submitted') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          user={userProfile}
          onLogout={onLogout}
          navigationItems={navigationItems}
          activeView={currentView}
          onNavigate={handleNavigation}
          notifications={notifications}
          showSearch={true}
          onSearch={handleSearch}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <SubmittedFormsView 
            forms={filteredForms(submittedForms)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onPreviewForm={handlePreviewForm}
            onRefresh={() => loadSubmittedForms()}
          />
        </div>
      </div>
    );
  }

  // Render pending forms view
  if (currentView === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar
          user={userProfile}
          onLogout={onLogout}
          navigationItems={navigationItems}
          activeView={currentView}
          onNavigate={handleNavigation}
          notifications={notifications}
          showSearch={true}
          onSearch={handleSearch}
          theme={theme}
          onThemeToggle={handleThemeToggle}
        />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <PendingFormsView 
            forms={filteredForms(pendingForms)}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onPreviewForm={handlePreviewForm}
            onFillConsentForm={handleFillConsentForm}
            onRefresh={() => loadPendingForms()}
          />
        </div>
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        user={userProfile}
        onLogout={onLogout}
        navigationItems={navigationItems}
        activeView={currentView}
        onNavigate={handleNavigation}
        notifications={notifications}
        showSearch={true}
        onSearch={handleSearch}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {userProfile?.title} {userProfile?.first_name} {userProfile?.last_name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {userProfile?.department} | {userProfile?.institution}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Last login: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={Clock}
            color="amber"
            trend={`${stats.pendingApprovals} require attention`}
            urgent={stats.pendingApprovals > 0}
          />
          <StatsCard
            title="Approved Forms"
            value={stats.approvedForms}
            icon={CheckCircle}
            color="green"
            trend="This month"
          />
          <StatsCard
            title="Active Students"
            value={stats.totalStudents}
            icon={Users}
            color="blue"
            trend="Under supervision"
          />
          <StatsCard
            title="Total Submissions"
            value={stats.totalSubmissions}
            icon={FileText}
            color="gray"
            trend="All time"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <QuickAction
            title="Review Pending Forms"
            description="Approve or reject student research proposals"
            icon={Clock}
            count={stats.pendingApprovals}
            onClick={() => setCurrentView('pending')}
            urgent={stats.pendingApprovals > 0}
          />
          <QuickAction
            title="View All Submissions"
            description="Browse all submitted forms and their status"
            icon={Archive}
            count={stats.totalSubmissions}
            onClick={() => setCurrentView('submitted')}
          />
          <QuickAction
            title="Activity Timeline"
            description="Track form submissions and approvals"
            icon={Activity}
            onClick={() => setCurrentView('timeline')}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <button 
              onClick={() => Promise.all([loadPendingForms(), loadSubmittedForms(), loadStats()])}
              className="text-amber-600 hover:text-amber-700 flex items-center text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
          
          <RecentActivityList 
            pendingForms={pendingForms.slice(0, 3)}
            submittedForms={submittedForms.slice(0, 2)}
            onPreviewForm={handlePreviewForm}
            onFillConsentForm={handleFillConsentForm}
          />
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, color, trend, urgent = false }) => {
  const colorClasses = {
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    gray: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${urgent ? 'ring-2 ring-amber-500' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {urgent && <AlertCircle className="w-4 h-4 text-amber-500 mr-1" />}
          <span className={`text-sm ${urgent ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

// Quick Action Component
const QuickAction = ({ title, description, icon: Icon, count, onClick, urgent = false }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow ${
      urgent ? 'ring-2 ring-amber-500' : ''
    }`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-full ${urgent ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      {count !== undefined && (
        <span className={`text-2xl font-bold ${urgent ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
          {count}
        </span>
      )}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
  </div>
);

// Recent Activity List Component  
const RecentActivityList = ({ pendingForms, submittedForms, onPreviewForm, onFillConsentForm }) => {
  const allForms = [
    ...pendingForms.map(f => ({ ...f, type: 'pending' })),
    ...submittedForms.map(f => ({ ...f, type: 'submitted' }))
  ].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  if (allForms.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allForms.map((form) => (
        <div key={`${form.type}-${form.id}`} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-full ${
              form.status === 'pending' ? 'bg-amber-100 text-amber-600' :
              form.status === 'approved' ? 'bg-green-100 text-green-600' :
              'bg-red-100 text-red-600'
            }`}>
              {form.status === 'pending' ? <Clock className="w-4 h-4" /> :
               form.status === 'approved' ? <CheckCircle className="w-4 h-4" /> :
               <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{form.student_name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{form.project_title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {new Date(form.submitted_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onPreviewForm(form)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Eye className="w-4 h-4" />
            </button>
            {form.status === 'pending' && (
              <button
                onClick={() => onFillConsentForm(form)}
                className="text-amber-600 hover:text-amber-700"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Pending Forms View Component
const PendingFormsView = ({ 
  forms, 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  onPreviewForm, 
  onFillConsentForm, 
  onRefresh 
}) => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pending Forms</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Student forms awaiting your approval
      </p>
    </div>

    {/* Search and Filters */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={onRefresh}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    {/* Forms Grid */}
    <FormsGrid 
      forms={forms}
      onPreviewForm={onPreviewForm}
      onFillConsentForm={onFillConsentForm}
      showConsentButton={true}
    />
  </div>
);

// Submitted Forms View Component
const SubmittedFormsView = ({ 
  forms, 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  onPreviewForm, 
  onRefresh 
}) => (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Submissions</h1>
      <p className="text-gray-600 dark:text-gray-400">
        Complete history of form submissions and their status
      </p>
    </div>

    {/* Search and Filters */}
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search students or projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={onRefresh}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    {/* Forms Grid */}
    <FormsGrid 
      forms={forms}
      onPreviewForm={onPreviewForm}
      showConsentButton={false}
    />
  </div>
);

// Forms Grid Component
const FormsGrid = ({ forms, onPreviewForm, onFillConsentForm, showConsentButton = false }) => {
  if (forms.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No forms found</h3>
        <p className="text-gray-600 dark:text-gray-400">
          No forms match your current search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {forms.map((form) => (
        <FormCard
          key={form.id}
          form={form}
          onPreviewForm={onPreviewForm}
          onFillConsentForm={onFillConsentForm}
          showConsentButton={showConsentButton}
        />
      ))}
    </div>
  );
};

// Form Card Component
const FormCard = ({ form, onPreviewForm, onFillConsentForm, showConsentButton }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              PHDEE02-A Form
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">#{form.id}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}>
            {getStatusIcon(form.status)}
            <span className="ml-1 capitalize">{form.status}</span>
          </span>
        </div>

        {/* Student Info */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {form.student_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{form.student_name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{form.student_email}</p>
            </div>
          </div>
        </div>

        {/* Project Info */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Title:</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {form.project_title || 'No title provided'}
          </p>
        </div>

        {/* Submission Date */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Submitted: {new Date(form.submitted_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          {form.approved_at && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Approved: {new Date(form.approved_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          )}
          {form.rejected_at && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Rejected: {new Date(form.rejected_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          )}
        </div>

        {/* Comments */}
        {form.supervisor_comments && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor Comments:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {form.supervisor_comments}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onPreviewForm(form)}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 text-sm font-medium flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </button>
          {showConsentButton && form.status === 'pending' && (
            <button
              onClick={() => onFillConsentForm(form)}
              className="flex-1 bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 text-sm font-medium flex items-center justify-center"
            >
              <FileText className="w-4 h-4 mr-1" />
              Fill Consent
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard; 