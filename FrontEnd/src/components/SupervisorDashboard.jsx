import { useState, useEffect } from 'react';
import {
  getFormSubmissions,
  approveFormSubmission,
  getAllStudents,
  getNotifications,
  formatDate,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';

const SupervisorDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [pendingForms, setPendingForms] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedForms: 0,
    rejectedForms: 0,
    totalSubmissions: 0,
    recentActivity: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [formsResult, studentsResult, notificationsResult] = await Promise.all([
        getFormSubmissions({ supervisor_id: user.id }),
        getAllStudents({ supervisor_id: user.id }),
        getNotifications({ page: 1, limit: 10 })
      ]);

      if (formsResult.success) {
        const submissions = formsResult.data.submissions || [];
        setAllSubmissions(submissions);
        setPendingForms(submissions.filter(s => s.supervisor_approval_status === 'pending'));
        
        // Calculate stats
        setStats({
          totalStudents: studentsResult.success ? studentsResult.data.students?.length || 0 : 0,
          pendingApprovals: submissions.filter(s => s.supervisor_approval_status === 'pending').length,
          approvedForms: submissions.filter(s => s.supervisor_approval_status === 'approved').length,
          rejectedForms: submissions.filter(s => s.supervisor_approval_status === 'rejected').length,
          totalSubmissions: submissions.length,
          recentActivity: submissions.filter(s => {
            const submitDate = new Date(s.submitted_at);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return submitDate > weekAgo;
          }).length
        });
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data.students || []);
      }

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (submissionId, action, comments = '') => {
    try {
      const result = await approveFormSubmission(submissionId, action, comments, 'supervisor');
      if (result.success) {
        loadDashboardData(); // Refresh data
        alert(`Form ${action}d successfully!`);
      } else {
        alert(`Failed to ${action} form: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing form:`, error);
      alert(`Error ${action}ing form. Please try again.`);
    }
  };

  const StatCard = ({ title, value, description, color = 'blue', icon, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          {icon && (
            <div className={`p-3 rounded-full bg-${color}-100 mb-2`}>
              <span className={`text-${color}-600 text-xl`}>{icon}</span>
            </div>
          )}
          {trend && (
            <div className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const filteredSubmissions = allSubmissions.filter(submission => {
    const matchesSearch = submission.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.form_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || submission.supervisor_approval_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervisor dashboard...</p>
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
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.title} {user.first_name} {user.last_name}</h1>
            <p className="text-blue-100 mt-1">Supervise your students and manage form approvals</p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <div className="text-sm opacity-90">Department</div>
              <div className="text-xl font-semibold">{user.department || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          description="Under supervision"
          color="blue"
          icon="👥"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          description="Awaiting review"
          color="yellow"
          icon="⏳"
        />
        <StatCard
          title="Approved Forms"
          value={stats.approvedForms}
          description="Successfully approved"
          color="green"
          icon="✅"
        />
        <StatCard
          title="Rejected Forms"
          value={stats.rejectedForms}
          description="Needs revision"
          color="red"
          icon="❌"
        />
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          description="All time"
          color="purple"
          icon="📄"
        />
        <StatCard
          title="Recent Activity"
          value={stats.recentActivity}
          description="Last 7 days"
          color="indigo"
          icon="📈"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-soft">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Overview' },
              { id: 'pending', label: 'Pending Approvals' },
              { id: 'submissions', label: 'All Submissions' },
              { id: 'students', label: 'My Students' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentView('pending')}
                    className="p-4 text-left border-2 border-dashed border-yellow-200 rounded-lg hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-yellow-600">Review Pending Forms</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.pendingApprovals} forms awaiting approval</div>
                  </button>
                  <button
                    onClick={() => setCurrentView('students')}
                    className="p-4 text-left border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-blue-600">View My Students</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.totalStudents} students under supervision</div>
                  </button>
                  <button
                    onClick={() => setCurrentView('submissions')}
                    className="p-4 text-left border-2 border-dashed border-purple-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-purple-600">View All Submissions</div>
                    <div className="text-xs text-gray-500 mt-1">{stats.totalSubmissions} total submissions</div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {allSubmissions.slice(0, 5).map((submission) => (
                    <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{submission.student_name}</div>
                        <div className="text-sm text-gray-500">{submission.form_name}</div>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.supervisor_approval_status)}`}>
                          {submission.supervisor_approval_status}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(submission.submitted_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'pending' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approvals</h3>
                {pendingForms.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📋</div>
                    <p className="text-gray-500">No pending approvals</p>
                    <p className="text-sm text-gray-400 mt-1">All forms have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingForms.map((form) => (
                      <div key={form.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{form.form_name}</h4>
                            <p className="text-sm text-gray-600">
                              Submitted by {form.student_name} on {formatDate(form.submitted_at)}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Pending Review
                          </span>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleApproval(form.id, 'approve')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproval(form.id, 'reject')}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                          <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'submissions' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search students or forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Submissions List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Submissions</h3>
                {filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">📄</div>
                    <p className="text-gray-500">No submissions found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSubmissions.map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{submission.student_name}</h4>
                            <p className="text-sm text-gray-600">{submission.form_name}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted {formatDate(submission.submitted_at)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.supervisor_approval_status)}`}>
                              {submission.supervisor_approval_status}
                            </span>
                            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'students' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Students</h3>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">👥</div>
                  <p className="text-gray-500">No students assigned</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-blue-600 font-semibold">
                            {student.first_name?.[0]}{student.last_name?.[0]}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">
                          {student.first_name} {student.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">{student.student_id}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {getWorkflowStageDisplayName(student.current_stage)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard; 