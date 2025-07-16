import React, { useState, useEffect } from 'react';
import {
  getAdminDashboardOverview,
  getWorkflowAnalytics,
  getAllStudents,
  getAllUsers,
  getPendingApprovals,
  getComprehensiveExams,
  getThesisDefenses,
  getSystemLogs,
  approveFormSubmission,
  updateStudentWorkflowStage,
  getNotificationStats,
  createUser,
  updateUserStatus,
  formatDate,
  formatDateTime,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';

const AdminDashboard = ({ user, onLogout, currentView = 'overview' }) => {
  const [loading, setLoading] = useState(true);
  // Set currentView based on prop, default to 'overview' if 'dashboard'
  const activeView = currentView === 'dashboard' ? 'overview' : currentView;
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    analytics: {},
    students: [],
    users: [],
    approvals: [],
    exams: [],
    defenses: [],
    logs: [],
    notifications: {}
  });
  const [pagination, setPagination] = useState({
    students: { page: 1, limit: 10 },
    users: { page: 1, limit: 10 },
    approvals: { page: 1, limit: 10 },
    logs: { page: 1, limit: 20 }
  });
  const [filters, setFilters] = useState({
    students: { stage: '', semester: '', academicYear: '' },
    users: { role: '', search: '' },
    approvals: { status: '', formType: '' }
  });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [updateModal, setUpdateModal] = useState({ show: false, student: null, newStage: '' });
  const [addUserModal, setAddUserModal] = useState({ show: false, type: 'supervisor' });
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'supervisor',
    title: '',
    department: '',
    institution: '',
    officeLocation: '',
    researchInterests: '',
    maxStudents: 5
  });

  useEffect(() => {
    loadDashboardData();
    // Load data based on current view
    loadViewData(activeView);
  }, [activeView]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overview, analytics, notifications] = await Promise.all([
        getAdminDashboardOverview(),
        getWorkflowAnalytics(),
        getNotificationStats()
      ]);

      setDashboardData(prev => ({
        ...prev,
        overview: overview.success ? overview.data : {},
        analytics: analytics.success ? analytics.data : {},
        notifications: notifications.success ? notifications.data : {}
      }));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadViewData = (view) => {
    // Load data for specific views
    switch (view) {
      case 'students':
        loadStudents();
        break;
      case 'users':
        loadUsers();
        break;
      case 'approvals':
        loadApprovals();
        break;
      case 'exams':
        loadExams();
        break;
      case 'defenses':
        loadDefenses();
        break;
      case 'logs':
        loadLogs();
        break;
      default:
        break;
    }
  };

  const loadStudents = async (page = 1, filters = {}) => {
    const result = await getAllStudents({ ...filters, page, limit: pagination.students.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, students: result.data.students || result.data.users?.filter(u => u.role === 'student') || [] }));
      setPagination(prev => ({ ...prev, students: { ...prev.students, page } }));
    }
  };

  const loadUsers = async (page = 1, filters = {}) => {
    const result = await getAllUsers({ ...filters, page, limit: pagination.users.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, users: result.data.users || [] }));
      setPagination(prev => ({ ...prev, users: { ...prev.users, page } }));
    }
  };

  const loadApprovals = async (page = 1, filters = {}) => {
    const result = await getPendingApprovals({ ...filters, page, limit: pagination.approvals.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, approvals: result.data.approvals || [] }));
      setPagination(prev => ({ ...prev, approvals: { ...prev.approvals, page } }));
    }
  };

  const loadExams = async () => {
    const result = await getComprehensiveExams();
    if (result.success) {
      setDashboardData(prev => ({ ...prev, exams: result.data.exams || [] }));
    }
  };

  const loadDefenses = async () => {
    const result = await getThesisDefenses();
    if (result.success) {
      setDashboardData(prev => ({ ...prev, defenses: result.data.defenses || [] }));
    }
  };

  const loadLogs = async (page = 1, filters = {}) => {
    const result = await getSystemLogs({ ...filters, page, limit: pagination.logs.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, logs: result.data.logs || [] }));
      setPagination(prev => ({ ...prev, logs: { ...prev.logs, page } }));
    }
  };

  const handleApproval = async (submissionId, action, comments = '') => {
    const result = await approveFormSubmission(submissionId, action, comments);
    if (result.success) {
      loadApprovals(); // Refresh approvals
      alert(`Form ${action} successfully!`);
    } else {
      alert(`Failed to ${action} form: ${result.message}`);
    }
  };

  const handleUpdateWorkflowStage = async () => {
    if (!updateModal.student || !updateModal.newStage) return;

    const result = await updateStudentWorkflowStage(
      updateModal.student.id,
      updateModal.newStage
    );

    if (result.success) {
      setUpdateModal({ show: false, student: null, newStage: '' });
      loadStudents(); // Refresh students
      alert('Student workflow stage updated successfully!');
    } else {
      alert(`Failed to update workflow stage: ${result.message}`);
    }
  };

  const handleAddUser = async () => {
    try {
      const result = await createUser(newUserData);
      if (result.success) {
        setAddUserModal({ show: false, type: 'supervisor' });
        setNewUserData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: 'supervisor',
          title: '',
          department: '',
          institution: '',
          officeLocation: '',
          researchInterests: '',
          maxStudents: 5
        });
        loadUsers(); // Refresh users
        alert(`${newUserData.role} added successfully!`);
      } else {
        alert(`Failed to add ${newUserData.role}: ${result.message}`);
      }
    } catch (error) {
      alert(`Error adding ${newUserData.role}: ${error.message}`);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const result = await updateUserStatus(userId, !currentStatus);
      if (result.success) {
        loadUsers(); // Refresh users
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        alert(`Failed to update user status: ${result.message}`);
      }
    } catch (error) {
      alert(`Error updating user status: ${error.message}`);
    }
  };

  const StatCard = ({ title, value, change, color = 'blue', icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className="flex flex-col items-end">
          {icon && <div className="text-2xl mb-2">{icon}</div>}
          {change && (
            <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const workflowStages = [
    'admission', 'supervision_consent', 'course_registration', 'gec_formation',
    'comprehensive_exam', 'synopsis_defense', 'research_candidacy',
    'thesis_writing', 'thesis_evaluation', 'thesis_defense', 'graduation'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Remove second navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user.first_name}!</h1>
              <p className="text-primary-100">Here's an overview of your PhD Research Tracking System</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <StatCard
                title="Total Students"
                value={dashboardData.overview.total_students || 0}
                color="blue"
                icon="👨‍🎓"
              />
              <StatCard
                title="Total Supervisors"
                value={dashboardData.overview.total_supervisors || 0}
                color="green"
                icon="👩‍🏫"
              />
              <StatCard
                title="Today's Submissions"
                value={dashboardData.overview.todays_submissions || 0}
                color="purple"
                icon="📄"
              />
              <StatCard
                title="Pending Approvals"
                value={dashboardData.overview.pending_approvals || 0}
                color="orange"
                icon="⏳"
              />
              <StatCard
                title="Upcoming Exams"
                value={dashboardData.overview.upcoming_exams || 0}
                color="red"
                icon="📝"
              />
              <StatCard
                title="Upcoming Defenses"
                value={dashboardData.overview.upcoming_defenses || 0}
                color="indigo"
                icon="🎓"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setAddUserModal({ show: true, type: 'supervisor' })}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Add Supervisor
                </button>
                <button
                  onClick={() => setAddUserModal({ show: true, type: 'gec_member' })}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Add GEC Member
                </button>
                <button
                  onClick={() => window.location.href = '#approvals'}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Review Approvals
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {dashboardData.overview.recent_activity && dashboardData.overview.recent_activity.length > 0 ? (
                  dashboardData.overview.recent_activity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{activity.student_name}</p>
                        <p className="text-sm text-gray-600">{activity.form_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(activity.submitted_at)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Header */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Analytics</h2>
              <p className="text-gray-600">Comprehensive insights into your PhD research tracking system</p>
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Stage Distribution */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Stage Distribution</h3>
                <div className="space-y-4">
                  {dashboardData.analytics.stage_distribution && dashboardData.analytics.stage_distribution.length > 0 ? (
                    dashboardData.analytics.stage_distribution.map((stage, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getWorkflowStageDisplayName(stage.stage)}</p>
                          <p className="text-xs text-gray-500">{stage.count} students</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${(stage.count / (dashboardData.overview.total_students || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{stage.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No workflow data available</p>
                  )}
                </div>
              </div>

              {/* Completion Rates */}
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Completion Rates</h3>
                <div className="space-y-4">
                  {dashboardData.analytics.completion_rates && Object.keys(dashboardData.analytics.completion_rates).length > 0 ? (
                    Object.entries(dashboardData.analytics.completion_rates).map(([stage, rate]) => (
                      <div key={stage} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getWorkflowStageDisplayName(stage)}</p>
                          <p className="text-xs text-gray-500">{rate}% completion</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{rate}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No completion data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Average Processing Time</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.analytics.avg_processing_time || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Per form approval</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Success Rate</h4>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.analytics.success_rate || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Form approvals</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Active Users</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.analytics.active_users || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft p-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">System Uptime</h4>
                <p className="text-2xl font-bold text-indigo-600">
                  {dashboardData.analytics.system_uptime || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>
        )}

        {activeView === 'students' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Students</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filters.students.stage}
                  onChange={(e) => setFilters(prev => ({ ...prev, students: { ...prev.students, stage: e.target.value } }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Stages</option>
                  {workflowStages.map(stage => (
                    <option key={stage} value={stage}>{getWorkflowStageDisplayName(stage)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Academic Year (e.g., 2024-2025)"
                  value={filters.students.academicYear}
                  onChange={(e) => setFilters(prev => ({ ...prev, students: { ...prev.students, academicYear: e.target.value } }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  onClick={() => loadStudents(1, filters.students)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Students</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forms</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.students.length > 0 ? (
                      dashboardData.students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{student.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                              {getWorkflowStageDisplayName(student.current_stage)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.semester} ({student.academic_year})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.supervisor_name || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <span className="text-green-600">{student.completed_forms || 0} completed</span>
                              <span className="text-orange-600">{student.pending_forms || 0} pending</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setUpdateModal({ show: true, student, newStage: student.current_stage })}
                              className="text-primary-600 hover:text-primary-900 mr-3"
                            >
                              Update Stage
                            </button>
                            <button
                              onClick={() => setSelectedStudent(student)}
                              className="text-green-600 hover:text-green-900"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No students found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'users' && (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-600">Add and manage supervisors and GEC committee members</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setAddUserModal({ show: true, type: 'supervisor' })}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add Supervisor
                  </button>
                  <button
                    onClick={() => setAddUserModal({ show: true, type: 'gec_member' })}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add GEC Member
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.users.length > 0 ? (
                      dashboardData.users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{user.student_id || user.title}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'supervisor' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">
                              View
                            </button>
                            <button className="text-orange-600 hover:text-orange-900 mr-3">
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                              className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'approvals' && (
          <div className="space-y-6">
            {/* Approvals Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.approvals.length > 0 ? (
                      dashboardData.approvals.map((approval) => (
                        <tr key={approval.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{approval.student_name}</div>
                              <div className="text-sm text-gray-500">{approval.student_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {approval.form_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(approval.submitted_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(approval.admin_approval_status)}`}>
                              {approval.admin_approval_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleApproval(approval.id, 'approve')}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval(approval.id, 'reject')}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No pending approvals
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'exams' && (
          <div className="space-y-6">
            {/* Exams Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Comprehensive Exams</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.exams.length > 0 ? (
                      dashboardData.exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{exam.student_name}</div>
                              <div className="text-sm text-gray-500">{exam.student_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(exam.exam_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(exam.status)}`}>
                              {exam.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.result || 'Pending'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No comprehensive exams found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'defenses' && (
          <div className="space-y-6">
            {/* Defenses Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Thesis Defenses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Defense Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thesis Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.defenses.length > 0 ? (
                      dashboardData.defenses.map((defense) => (
                        <tr key={defense.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{defense.student_name}</div>
                              <div className="text-sm text-gray-500">{defense.student_email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(defense.defense_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{defense.thesis_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(defense.status)}`}>
                              {defense.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-primary-600 hover:text-primary-900 mr-3">
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No thesis defenses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'logs' && (
          <div className="space-y-6">
            {/* System Logs Table */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.logs.length > 0 ? (
                      dashboardData.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{log.user_name}</div>
                            <div className="text-sm text-gray-500">{log.user_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.ip_address}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No system logs found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {addUserModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add {addUserModal.type === 'supervisor' ? 'Supervisor' : 'GEC Member'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="First Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Email Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newUserData.title}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Professor, Dr., etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newUserData.department}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Department"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input
                  type="text"
                  value={newUserData.institution}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, institution: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Institution"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Location</label>
                <input
                  type="text"
                  value={newUserData.officeLocation}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, officeLocation: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Office Location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Research Interests</label>
                <textarea
                  value={newUserData.researchInterests}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, researchInterests: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Research Interests"
                  rows="3"
                />
              </div>
              {addUserModal.type === 'supervisor' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    value={newUserData.maxStudents}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Maximum number of students"
                    min="1"
                    max="20"
                  />
                </div>
              )}
              <div className="flex space-x-3">
                <button
                  onClick={handleAddUser}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add {addUserModal.type === 'supervisor' ? 'Supervisor' : 'GEC Member'}
                </button>
                <button
                  onClick={() => setAddUserModal({ show: false, type: 'supervisor' })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {updateModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Workflow Stage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                <p className="text-sm text-gray-900">
                  {updateModal.student?.first_name} {updateModal.student?.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Stage</label>
                <select
                  value={updateModal.newStage}
                  onChange={(e) => setUpdateModal(prev => ({ ...prev, newStage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {workflowStages.map(stage => (
                    <option key={stage} value={stage}>{getWorkflowStageDisplayName(stage)}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateWorkflowStage}
                  className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setUpdateModal({ show: false, student: null, newStage: '' })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 