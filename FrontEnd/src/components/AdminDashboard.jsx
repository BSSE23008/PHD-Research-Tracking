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
  formatDate,
  formatDateTime,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';

const AdminDashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const loadStudents = async (page = 1, filters = {}) => {
    const result = await getAllStudents({ ...filters, page, limit: pagination.students.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, students: result.data.students }));
      setPagination(prev => ({ ...prev, students: { ...prev.students, page } }));
    }
  };

  const loadUsers = async (page = 1, filters = {}) => {
    const result = await getAllUsers({ ...filters, page, limit: pagination.users.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, users: result.data.users }));
      setPagination(prev => ({ ...prev, users: { ...prev.users, page } }));
    }
  };

  const loadApprovals = async (page = 1, filters = {}) => {
    const result = await getPendingApprovals({ ...filters, page, limit: pagination.approvals.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, approvals: result.data.approvals }));
      setPagination(prev => ({ ...prev, approvals: { ...prev.approvals, page } }));
    }
  };

  const loadExams = async () => {
    const result = await getComprehensiveExams();
    if (result.success) {
      setDashboardData(prev => ({ ...prev, exams: result.data.exams }));
    }
  };

  const loadDefenses = async () => {
    const result = await getThesisDefenses();
    if (result.success) {
      setDashboardData(prev => ({ ...prev, defenses: result.data.defenses }));
    }
  };

  const loadLogs = async (page = 1, filters = {}) => {
    const result = await getSystemLogs({ ...filters, page, limit: pagination.logs.limit });
    if (result.success) {
      setDashboardData(prev => ({ ...prev, logs: result.data.logs }));
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

  const handleViewChange = (view) => {
    setCurrentView(view);
    
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

  const StatCard = ({ title, value, change, color = 'blue' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-medium transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        </div>
        {change && (
          <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </div>
        )}
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.first_name}</span>
              <button
                onClick={onLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'students', label: 'Students' },
              { key: 'users', label: 'Users' },
              { key: 'approvals', label: 'Approvals' },
              { key: 'exams', label: 'Exams' },
              { key: 'defenses', label: 'Defenses' },
              { key: 'logs', label: 'System Logs' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => handleViewChange(item.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentView === item.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'overview' && (
          <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <StatCard
                title="Total Students"
                value={dashboardData.overview.total_students || 0}
                color="blue"
              />
              <StatCard
                title="Total Supervisors"
                value={dashboardData.overview.total_supervisors || 0}
                color="green"
              />
              <StatCard
                title="Today's Submissions"
                value={dashboardData.overview.todays_submissions || 0}
                color="purple"
              />
              <StatCard
                title="Pending Approvals"
                value={dashboardData.overview.pending_approvals || 0}
                color="orange"
              />
              <StatCard
                title="Upcoming Exams"
                value={dashboardData.overview.upcoming_exams || 0}
                color="red"
              />
              <StatCard
                title="Upcoming Defenses"
                value={dashboardData.overview.upcoming_defenses || 0}
                color="indigo"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {dashboardData.overview.recent_activity && dashboardData.overview.recent_activity.map((activity, index) => (
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
                ))}
                {(!dashboardData.overview.recent_activity || dashboardData.overview.recent_activity.length === 0) && (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'students' && (
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
                    {dashboardData.students.map((student) => (
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
                            <span className="text-green-600">{student.completed_forms} completed</span>
                            <span className="text-orange-600">{student.pending_forms} pending</span>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'approvals' && (
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
                    {dashboardData.approvals.map((approval) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'users' && (
          <div className="space-y-6">
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
                    {dashboardData.users.map((user) => (
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
                          <button className="text-orange-600 hover:text-orange-900">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'exams' && (
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
                    {dashboardData.exams.map((exam) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'defenses' && (
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
                    {dashboardData.defenses.map((defense) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'logs' && (
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
                    {dashboardData.logs.map((log) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

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