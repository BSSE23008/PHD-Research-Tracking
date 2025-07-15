import { useState, useEffect } from 'react';
import { 
  getDashboardSummary, 
  getFormSubmissions, 
  formatDate,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';

const Dashboard = ({ user, onNavigate, onFormSelect }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    workflowStatus: {},
    recentSubmissions: [],
    unreadNotifications: 0
  });
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, submissionsResult] = await Promise.all([
        getDashboardSummary(),
        getFormSubmissions()
      ]);

      if (summaryResult.success) {
        setDashboardData(summaryResult.data);
      }

      if (submissionsResult.success) {
        setFormSubmissions(submissionsResult.data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (page, formCode = null) => {
    if (onNavigate) {
      onNavigate(page);
    }
    if (formCode && onFormSelect) {
      // Small delay to ensure page transition completes
      setTimeout(() => {
        onFormSelect(formCode);
      }, 100);
    }
  };

  const StatCard = ({ title, value, description, color = 'blue', icon, onClick }) => (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-full bg-${color}-100`}>
            <div className={`w-6 h-6 text-${color}-600`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );

  const QuickAction = ({ title, description, onClick, color = 'primary' }) => (
    <button
      onClick={onClick}
      className={`p-4 text-left border-2 border-dashed border-${color}-200 rounded-lg hover:border-${color}-300 hover:bg-${color}-50 transition-colors w-full`}
    >
      <div className={`text-sm font-medium text-${color}-600`}>{title}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.first_name}!</h1>
            <p className="text-primary-100 mt-1">Track your PhD journey and manage your submissions</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-sm opacity-90">Current Stage</div>
              <div className="text-xl font-semibold">
                {getWorkflowStageDisplayName(dashboardData.workflowStatus?.current_stage || 'supervision_consent')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Submissions"
          value={formSubmissions.length}
          description="All time submissions"
          color="blue"
          icon="📄"
          onClick={() => handleNavigation('forms')}
        />
        <StatCard
          title="Pending Approvals"
          value={formSubmissions.filter(f => f.status === 'submitted' || f.admin_approval_status === 'pending').length}
          description="Awaiting review"
          color="yellow"
          icon="⏳"
          onClick={() => handleNavigation('forms')}
        />
        <StatCard
          title="Approved Forms"
          value={formSubmissions.filter(f => f.status === 'approved').length}
          description="Successfully approved"
          color="green"
          icon="✅"
          onClick={() => handleNavigation('forms')}
        />
        <StatCard
          title="Unread Notifications"
          value={dashboardData.unreadNotifications || 0}
          description="Check your updates"
          color="purple"
          icon="🔔"
          onClick={() => handleNavigation('notifications')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickAction
            title="Submit New Form"
            description="Start a new form submission"
            onClick={() => handleNavigation('forms')}
            color="blue"
          />
          <QuickAction
            title="View Progress"
            description="Check your PhD timeline"
            onClick={() => handleNavigation('workflow')}
            color="green"
          />
          <QuickAction
            title="Check Notifications"
            description="Review your updates"
            onClick={() => handleNavigation('notifications')}
            color="purple"
          />
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          <button 
            onClick={() => handleNavigation('forms')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </button>
        </div>
        
        {formSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <p className="text-gray-500">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Get started by submitting your first form</p>
            <button
              onClick={() => handleNavigation('forms')}
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Submit First Form
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {formSubmissions.slice(0, 5).map((submission) => (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{submission.form_name}</h4>
                  <p className="text-sm text-gray-500">
                    Submitted on {formatDate(submission.submitted_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                  <button 
                    onClick={() => handleNavigation('forms')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workflow Progress */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Progress</h3>
          <button
            onClick={() => handleNavigation('workflow')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Timeline
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">PhD Journey</span>
            <span className="text-sm text-gray-500">
              {dashboardData.workflowStatus?.semester || 1} Semester, {dashboardData.workflowStatus?.academic_year || '2024-2025'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: '30%' }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Started</span>
            <span className="font-medium">
              {getWorkflowStageDisplayName(dashboardData.workflowStatus?.current_stage || 'supervision_consent')}
            </span>
            <span>Graduation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 