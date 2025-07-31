import React, { useState, useEffect } from 'react';
import {
  getAllUsers,
  getAllStudents,
  getAllFaculty,
  getAdminDashboardOverview,
  getFormSubmissions,
  getPendingApprovals,
  processApproval,
  getAllGECCommittees,
  createUser,
  updateUserStatus,
  assignSupervisor,
  updateStudentWorkflowStage,
  getAllDepartments,
  getFormSubmissionDetails,
  formatDate,
  getStatusColor
} from '../utils/api';
import FormViewer from './FormViewer';
import DepartmentManagement from './DepartmentManagement';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    overview: {},
    users: [],
    students: [],
    faculty: [],
    submissions: [],
    pendingApprovals: [],
    committees: [],
    departments: [],
    systemStats: {}
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showFormViewer, setShowFormViewer] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        overviewResult,
        usersResult,
        studentsResult,
        facultyResult,
        submissionsResult,
        pendingApprovalsResult,
        committeesResult,
        departmentsResult
      ] = await Promise.all([
        getAdminDashboardOverview(),
        getAllUsers(),
        getAllStudents(),
        getAllFaculty(),
        getFormSubmissions({ admin: true }),
        getPendingApprovals(),
        getAllGECCommittees(),
        getAllDepartments()
      ]);

      setDashboardData({
        overview: overviewResult.success ? overviewResult.data : {},
        users: usersResult.success ? usersResult.data : [],
        students: studentsResult.success ? studentsResult.data : [],
        faculty: facultyResult.success ? facultyResult.data : [],
        submissions: submissionsResult.success ? submissionsResult.data.submissions || [] : [],
        pendingApprovals: pendingApprovalsResult.success ? pendingApprovalsResult.data : [],
        committees: committeesResult.success ? committeesResult.data : [],
        departments: departmentsResult.success ? departmentsResult.data : [],
        systemStats: calculateSystemStats(
          usersResult.data || [],
          studentsResult.data || [],
          submissionsResult.data?.submissions || []
        )
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSystemStats = (users, students, submissions) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      newUsersThisMonth: users.filter(u => new Date(u.created_at) >= thisMonth).length,
      totalStudents: students.length,
      activeStudents: students.filter(s => s.is_active).length,
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter(s => s.status === 'submitted' || s.admin_approval_status === 'pending').length,
      approvedSubmissions: submissions.filter(s => s.status === 'approved').length,
      rejectedSubmissions: submissions.filter(s => s.status === 'rejected').length,
    };
  };

  const handleUserAction = async (action, userId, data = {}) => {
    try {
      let result;
      switch (action) {
        case 'activate':
        case 'deactivate':
          result = await updateUserStatus(userId, action === 'activate');
          break;
        case 'create':
          result = await createUser(data);
          break;
        case 'assignSupervisor':
          result = await assignSupervisor(data);
          break;
        case 'updateStage':
          result = await updateStudentWorkflowStage(userId, data.stage, data.semester, data.academic_year);
          break;
        default:
          return;
      }

      if (result.success) {
        alert('Action completed successfully!');
        loadDashboardData();
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleApproval = async (submissionId, action, approvalStage = 'dec') => {
    try {
      const comments = prompt(`Enter ${action === 'approve' ? 'approval' : 'rejection'} comments (optional):`);
      const result = await processApproval(submissionId, { action, comments, approvalStage });
      
      if (result.success) {
        alert(`Form ${action}d successfully!`);
        loadDashboardData();
        setShowFormViewer(false);
        setSelectedSubmission(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error processing approval: ' + error.message);
    }
  };

  const handleViewDetails = async (submissionId) => {
    try {
      const result = await getFormSubmissionDetails(submissionId, 'admin');
      if (result.success) {
        setSelectedSubmission(result.data);
        setShowFormViewer(true);
      } else {
        alert('Error loading form details: ' + result.message);
      }
    } catch (error) {
      alert('Error loading form details: ' + error.message);
    }
  };

  const handleCloseFormViewer = () => {
    setShowFormViewer(false);
    setSelectedSubmission(null);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={dashboardData.systemStats.totalUsers}
          subtitle={`${dashboardData.systemStats.activeUsers} active`}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Students"
          value={dashboardData.systemStats.totalStudents}
          subtitle={`${dashboardData.systemStats.activeStudents} active`}
          icon="🎓"
          color="green"
        />
        <MetricCard
          title="Form Submissions"
          value={dashboardData.systemStats.totalSubmissions}
          subtitle={`${dashboardData.systemStats.pendingSubmissions} pending`}
          icon="📋"
          color="orange"
        />
        <MetricCard
          title="GEC Committees"
          value={dashboardData.committees.length}
          subtitle="Active committees"
          icon="🏛️"
          color="purple"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Form Submission Status</h3>
          <div className="space-y-3">
            <StatBar
              label="Approved"
              value={dashboardData.systemStats.approvedSubmissions}
              total={dashboardData.systemStats.totalSubmissions}
              color="green"
            />
            <StatBar
              label="Pending"
              value={dashboardData.systemStats.pendingSubmissions}
              total={dashboardData.systemStats.totalSubmissions}
              color="yellow"
            />
            <StatBar
              label="Rejected"
              value={dashboardData.systemStats.rejectedSubmissions}
              total={dashboardData.systemStats.totalSubmissions}
              color="red"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {dashboardData.departments.slice(0, 5).map(dept => {
              const studentCount = dashboardData.students.filter(s => s.department_id === dept.id).length;
              return (
                <div key={dept.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{dept.dept_code}</span>
                  <span className="text-sm text-gray-600">{studentCount} students</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Form Submissions</h3>
        <div className="space-y-3">
          {dashboardData.submissions.slice(0, 8).map(submission => (
            <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{submission.form_name}</p>
                <p className="text-sm text-gray-600">
                  {submission.student_name} • {formatDate(submission.submitted_at)}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add User
          </button>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* User Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <select className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
            <option value="">All Departments</option>
            {dashboardData.departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.dept_name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search users..."
            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 flex-1"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dashboardData.users.slice(0, 20).map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.department_name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.last_login ? formatDate(user.last_login) : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button 
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleUserAction(user.is_active ? 'deactivate' : 'activate', user.id)}
                    className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                  >
                    {user.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPendingApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Approvals</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {dashboardData.pendingApprovals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-gray-600">No pending approvals at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dashboardData.pendingApprovals.map(approval => (
            <div key={approval.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{approval.form_name}</h4>
                  <p className="text-sm text-gray-600">
                    Submitted by {approval.student_name} ({approval.student_id}) on {formatDate(approval.submitted_at)}
                  </p>
                  <p className="text-sm text-gray-500">Department: {approval.dept_name}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    approval.approval_stage === 'dec_approval' ? 'bg-blue-100 text-blue-800' :
                    approval.approval_stage === 'supervisor_approval' ? 'bg-yellow-100 text-yellow-800' :
                    approval.approval_stage === 'gec_approval' ? 'bg-purple-100 text-purple-800' :
                    approval.approval_stage === 'hod_approval' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {approval.approval_stage.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleApproval(approval.id, 'approve', 'dec')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleApproval(approval.id, 'reject', 'dec')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleViewDetails(approval.id)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFormManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Form Management</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Form Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{dashboardData.systemStats.totalSubmissions}</div>
          <div className="text-sm text-gray-600">Total Submissions</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-600">{dashboardData.systemStats.pendingSubmissions}</div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{dashboardData.systemStats.approvedSubmissions}</div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{dashboardData.systemStats.rejectedSubmissions}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Form Submissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dashboardData.submissions.slice(0, 20).map(submission => (
              <tr key={submission.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{submission.form_name}</div>
                  <div className="text-sm text-gray-500">{submission.form_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{submission.student_name}</div>
                  <div className="text-sm text-gray-500">{submission.student_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(submission.submitted_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {submission.current_approval_stage || 'Initial'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">View</button>
                  {submission.status === 'submitted' && (
                    <>
                      <button className="text-green-600 hover:text-green-900">Approve</button>
                      <button className="text-red-600 hover:text-red-900">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Academic Year Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Academic Year</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" defaultValue="2024-2025" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Semester</label>
              <select className="mt-1 block w-full border border-gray-300 rounded px-3 py-2">
                <option>Fall 2024</option>
                <option>Spring 2025</option>
                <option>Summer 2025</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Update Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Form Deadlines</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Deadline</label>
              <input type="date" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Withdrawal Deadline</label>
              <input type="date" className="mt-1 block w-full border border-gray-300 rounded px-3 py-2" />
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Update Deadlines
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">System Maintenance</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <div>
              <h4 className="font-medium">Database Backup</h4>
              <p className="text-sm text-gray-600">Last backup: 2 hours ago</p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Run Backup
            </button>
          </div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <div>
              <h4 className="font-medium">Clear Cache</h4>
              <p className="text-sm text-gray-600">Improve system performance</p>
            </div>
            <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">System administration and management</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {dashboardData.systemStats.activeUsers} active users
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600">System Online</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥', count: dashboardData.systemStats.totalUsers },
              { id: 'departments', name: 'Departments', icon: '🏢', count: dashboardData.departments.length },
              { id: 'approvals', name: 'Pending Approvals', icon: '⏳', count: dashboardData.pendingApprovals.length },
              { id: 'forms', name: 'Forms', icon: '📋', count: dashboardData.systemStats.pendingSubmissions },
              { id: 'committees', name: 'GEC', icon: '🏛️', count: dashboardData.committees.length },
              { id: 'settings', name: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.count > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUserManagement()}
        {activeTab === 'departments' && <DepartmentManagement />}
        {activeTab === 'approvals' && renderPendingApprovals()}
        {activeTab === 'forms' && renderFormManagement()}
        {activeTab === 'committees' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-lg font-medium mb-2">GEC Committee Management</h3>
            <p className="text-gray-600 mb-4">
              Manage Graduate Examination Committees and their members.
            </p>
            <p className="text-sm text-gray-500">Coming soon...</p>
          </div>
        )}
        {activeTab === 'settings' && renderSystemSettings()}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          departments={dashboardData.departments}
          faculty={dashboardData.faculty}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={(userData) => {
            if (selectedUser) {
              handleUserAction('update', selectedUser.id, userData);
            } else {
              handleUserAction('create', null, userData);
            }
          }}
        />
      )}

      {/* Form Viewer Modal */}
      {showFormViewer && selectedSubmission && (
        <FormViewer
          submission={selectedSubmission}
          onClose={handleCloseFormViewer}
          onApprove={(submissionId) => handleApproval(submissionId, 'approve')}
          onReject={(submissionId) => handleApproval(submissionId, 'reject')}
          userType="admin"
        />
      )}
    </div>
  );
};

// Helper Components
const MetricCard = ({ title, value, subtitle, icon, color = 'blue' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  </div>
);

const StatBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1">
        <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`bg-${color}-500 h-2 rounded-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <span className="text-sm text-gray-600 ml-3">{value}</span>
    </div>
  );
};

const UserModal = ({ user, departments, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: user?.role || 'student',
    departmentId: user?.department_id || '',
    studentId: user?.student_id || '',
    enrollmentYear: user?.enrollment_year || new Date().getFullYear(),
    currentSemester: user?.current_semester || '1st',
    academicYear: user?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    researchArea: user?.research_area || '',
    agreeToTerms: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate passwords match for new users
    if (!user && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Validate password strength for new users
    if (!user && formData.password.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {!user && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  required={!user}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  required={!user}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.dept_name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID</label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enrollment Year</label>
                  <input
                    type="number"
                    required
                    min="2000"
                    max={new Date().getFullYear() + 5}
                    value={formData.enrollmentYear}
                    onChange={(e) => setFormData({...formData, enrollmentYear: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Research Area</label>
                <input
                  type="text"
                  required
                  value={formData.researchArea}
                  onChange={(e) => setFormData({...formData, researchArea: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Machine Learning, Computer Vision, etc."
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {user ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminDashboard; 