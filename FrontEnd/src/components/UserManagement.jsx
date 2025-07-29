import React, { useState, useEffect } from 'react';
import {
  getAllUsers,
  getAllStudents,
  getAllFaculty,
  getAllDepartments,
  createUser,
  updateUserStatus,
  assignSupervisor,
  updateStudentWorkflowStage,
  formatDate,
  getStatusColor
} from '../utils/api';

const UserManagement = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filters, setFilters] = useState({
    role: '',
    department: '',
    status: '',
    search: ''
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, deptResult, facultyResult] = await Promise.all([
        getAllUsers(),
        getAllDepartments(),
        getAllFaculty()
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
      }

      if (deptResult.success) {
        setDepartments(deptResult.data);
      }

      if (facultyResult.success) {
        setFaculty(facultyResult.data);
      }
    } catch (error) {
      console.error('Error loading user management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(user => user.department_id === parseInt(filters.department));
    }

    // Status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(user => user.is_active === isActive);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchTerm) ||
        user.last_name.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        (user.student_id && user.student_id.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredUsers(filtered);
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
        loadData();
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUserIds.length === 0) {
      alert('Please select users first');
      return;
    }

    if (!confirm(`Are you sure you want to ${action} ${selectedUserIds.length} users?`)) {
      return;
    }

    try {
      const promises = selectedUserIds.map(userId => {
        switch (action) {
          case 'activate':
            return updateUserStatus(userId, true);
          case 'deactivate':
            return updateUserStatus(userId, false);
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(promises);
      alert(`Bulk ${action} completed successfully!`);
      loadData();
      setSelectedUserIds([]);
      setShowBulkActions(false);
    } catch (error) {
      alert('Bulk action failed: ' + error.message);
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return { total, active, byRole };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user management...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUserModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add User
              </button>
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.byRole.student || 0}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.byRole.faculty || 0}</div>
            <div className="text-sm text-gray-600">Faculty</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.byRole.admin || 0}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({...filters, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
                <option value="supervisor">Supervisors</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({...filters, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.dept_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users.length} users
              </span>
              {selectedUserIds.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedUserIds.length} selected
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              {selectedUserIds.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('activate')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Activate Selected
                  </button>
                  <button
                    onClick={() => handleBulkAction('deactivate')}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Deactivate Selected
                  </button>
                </div>
              )}
              <button
                onClick={loadData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                    className="h-4 w-4 text-blue-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  departments={departments}
                  faculty={faculty}
                  isSelected={selectedUserIds.includes(user.id)}
                  onSelect={() => handleUserSelect(user.id)}
                  onEdit={(user) => {
                    setSelectedUser(user);
                    setShowUserModal(true);
                  }}
                  onAction={handleUserAction}
                />
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your filters or add a new user.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          departments={departments}
          faculty={faculty}
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
    </div>
  );
};

const UserRow = ({ user, departments, faculty, isSelected, onSelect, onEdit, onAction }) => {
  const department = departments.find(d => d.id === user.department_id);
  
  return (
    <tr className={isSelected ? 'bg-blue-50' : ''}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="h-4 w-4 text-blue-600"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user.first_name.charAt(0)}{user.last_name.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {user.student_id && (
              <div className="text-xs text-gray-400">{user.student_id}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {department?.dept_name || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(user.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
        <button
          onClick={() => onEdit(user)}
          className="text-blue-600 hover:text-blue-900"
        >
          Edit
        </button>
        <button
          onClick={() => onAction(user.is_active ? 'deactivate' : 'activate', user.id)}
          className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
        >
          {user.is_active ? 'Deactivate' : 'Activate'}
        </button>
        {user.role === 'student' && (
          <button
            onClick={() => onEdit(user)}
            className="text-purple-600 hover:text-purple-900"
          >
            Manage
          </button>
        )}
      </td>
    </tr>
  );
};

const UserModal = ({ user, departments, faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    role: user?.role || 'student',
    department_id: user?.department_id || '',
    student_id: user?.student_id || '',
    phone: user?.phone || '',
    primary_supervisor_id: user?.primary_supervisor_id || '',
    research_area: user?.research_area || '',
    current_semester: user?.current_semester || '1st',
    workflow_stage: user?.workflow_stage || 'admission'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {user ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.dept_name}</option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Student Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Semester</label>
                  <select
                    value={formData.current_semester}
                    onChange={(e) => setFormData({...formData, current_semester: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1st">1st Semester</option>
                    <option value="2nd">2nd Semester</option>
                    <option value="3rd">3rd Semester</option>
                    <option value="4th">4th Semester</option>
                    <option value="5th">5th Semester</option>
                    <option value="6th">6th Semester</option>
                    <option value="7th">7th Semester</option>
                    <option value="8th">8th Semester</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Supervisor</label>
                <select
                  value={formData.primary_supervisor_id}
                  onChange={(e) => setFormData({...formData, primary_supervisor_id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Supervisor</option>
                  {faculty.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.first_name} {fac.last_name} - {fac.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Research Area</label>
                <textarea
                  value={formData.research_area}
                  onChange={(e) => setFormData({...formData, research_area: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Stage</label>
                <select
                  value={formData.workflow_stage}
                  onChange={(e) => setFormData({...formData, workflow_stage: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admission">Admission</option>
                  <option value="supervision_consent">Supervision Consent</option>
                  <option value="course_registration">Course Registration</option>
                  <option value="gec_formation">GEC Formation</option>
                  <option value="comprehensive_exam">Comprehensive Exam</option>
                  <option value="research_candidacy">Research Candidacy</option>
                  <option value="synopsis_defense">Synopsis Defense</option>
                  <option value="thesis_writing">Thesis Writing</option>
                  <option value="thesis_evaluation">Thesis Evaluation</option>
                  <option value="thesis_defense">Thesis Defense</option>
                  <option value="graduation">Graduation</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {user ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement; 