import React, { useState, useEffect } from 'react';
import {
  getAllGECCommittees,
  getMyGECCommittee,
  createGECCommittee,
  updateGECCommittee,
  addGECMember,
  removeGECMember,
  getGECChangeRequests,
  approveGECChangeRequest,
  createGECChangeRequest,
  getAllStudents,
  getAllFaculty,
  getAllDepartments,
  formatDate,
  getStatusColor
} from '../utils/api';

const GECCommitteeManagement = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('committees');
  const [committees, setCommittees] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // create, edit, addMember, changeRequest

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        committeesResult,
        changeRequestsResult,
        studentsResult,
        facultyResult,
        departmentsResult
      ] = await Promise.all([
        user.role === 'admin' ? getAllGECCommittees() : getMyGECCommittee(),
        getGECChangeRequests(),
        getAllStudents(),
        getAllFaculty(),
        getAllDepartments()
      ]);

      if (committeesResult.success) {
        const committeesData = Array.isArray(committeesResult.data) 
          ? committeesResult.data 
          : committeesResult.data ? [committeesResult.data] : [];
        setCommittees(committeesData);
      }

      if (changeRequestsResult.success) {
        setChangeRequests(changeRequestsResult.data || []);
      }

      if (studentsResult.success) {
        setStudents(studentsResult.data || []);
      }

      if (facultyResult.success) {
        setFaculty(facultyResult.data || []);
      }

      if (departmentsResult.success) {
        setDepartments(departmentsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading GEC data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommittee = async (committeeData) => {
    try {
      const result = await createGECCommittee(committeeData);
      if (result.success) {
        alert('GEC Committee created successfully!');
        loadData();
        setShowModal(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error creating committee: ' + error.message);
    }
  };

  const handleUpdateCommittee = async (committeeId, updateData) => {
    try {
      const result = await updateGECCommittee(committeeId, updateData);
      if (result.success) {
        alert('Committee updated successfully!');
        loadData();
        setShowModal(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error updating committee: ' + error.message);
    }
  };

  const handleAddMember = async (committeeId, memberData) => {
    try {
      const result = await addGECMember(committeeId, memberData);
      if (result.success) {
        alert('Member added successfully!');
        loadData();
        setShowModal(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error adding member: ' + error.message);
    }
  };

  const handleRemoveMember = async (committeeId, memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const result = await removeGECMember(committeeId, memberId);
      if (result.success) {
        alert('Member removed successfully!');
        loadData();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error removing member: ' + error.message);
    }
  };

  const handleChangeRequest = async (requestData) => {
    try {
      const result = await createGECChangeRequest(requestData);
      if (result.success) {
        alert('Change request submitted successfully!');
        loadData();
        setShowModal(false);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error submitting change request: ' + error.message);
    }
  };

  const handleApproveChangeRequest = async (requestId, approvalData) => {
    try {
      const result = await approveGECChangeRequest(requestId, approvalData);
      if (result.success) {
        alert('Change request processed successfully!');
        loadData();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error processing change request: ' + error.message);
    }
  };

  const getCommitteeStats = () => {
    const total = committees.length;
    const active = committees.filter(c => c.is_active).length;
    const pendingRequests = changeRequests.filter(r => r.status === 'pending').length;
    const departmentDist = committees.reduce((acc, committee) => {
      const dept = committee.department_name || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return { total, active, pendingRequests, departmentDist };
  };

  const renderCommittees = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">GEC Committees</h2>
        <div className="space-x-2">
          {user.role === 'admin' && (
            <button
              onClick={() => {
                setModalType('create');
                setSelectedCommittee(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Committee
            </button>
          )}
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {committees.length > 0 ? (
        <div className="grid gap-6">
          {committees.map(committee => (
            <CommitteeCard
              key={committee.id}
              committee={committee}
              user={user}
              faculty={faculty}
              onEdit={(committee) => {
                setSelectedCommittee(committee);
                setModalType('edit');
                setShowModal(true);
              }}
              onAddMember={(committee) => {
                setSelectedCommittee(committee);
                setModalType('addMember');
                setShowModal(true);
              }}
              onRemoveMember={handleRemoveMember}
              onChangeRequest={(committee) => {
                setSelectedCommittee(committee);
                setModalType('changeRequest');
                setShowModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No GEC Committees</h3>
          <p className="text-gray-600 mb-4">
            {user.role === 'admin' 
              ? 'Create the first GEC committee to get started.'
              : 'You are not assigned to any GEC committees yet.'}
          </p>
          {user.role === 'admin' && (
            <button
              onClick={() => {
                setModalType('create');
                setSelectedCommittee(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Committee
            </button>
          )}
        </div>
      )}
    </div>
  );

  const renderChangeRequests = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Change Requests</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {changeRequests.length > 0 ? (
        <div className="space-y-4">
          {changeRequests.map(request => (
            <ChangeRequestCard
              key={request.id}
              request={request}
              user={user}
              onApprove={(approvalData) => handleApproveChangeRequest(request.id, approvalData)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Change Requests</h3>
          <p className="text-gray-600">No pending change requests at the moment.</p>
        </div>
      )}
    </div>
  );

  const stats = getCommitteeStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading GEC committees...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">GEC Committee Management</h1>
              <p className="text-gray-600 mt-1">Manage Graduate Examination Committees</p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-800">Total Committees</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-green-800">Active</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pendingRequests}</div>
              <div className="text-sm text-orange-800">Pending Requests</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.departmentDist).length}</div>
              <div className="text-sm text-purple-800">Departments</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'committees', name: 'Committees', icon: '👥', count: stats.total },
              { id: 'requests', name: 'Change Requests', icon: '📝', count: stats.pendingRequests },
              { id: 'analytics', name: 'Analytics', icon: '📊' }
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
        {activeTab === 'committees' && renderCommittees()}
        {activeTab === 'requests' && renderChangeRequests()}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium mb-2">GEC Analytics Coming Soon</h3>
            <p className="text-gray-600">Committee performance and effectiveness metrics.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'create' && (
            <CommitteeModal
              type="create"
              students={students}
              faculty={faculty}
              departments={departments}
              onClose={() => setShowModal(false)}
              onSave={handleCreateCommittee}
            />
          )}
          {modalType === 'edit' && (
            <CommitteeModal
              type="edit"
              committee={selectedCommittee}
              students={students}
              faculty={faculty}
              departments={departments}
              onClose={() => setShowModal(false)}
              onSave={(data) => handleUpdateCommittee(selectedCommittee.id, data)}
            />
          )}
          {modalType === 'addMember' && (
            <AddMemberModal
              committee={selectedCommittee}
              faculty={faculty}
              onClose={() => setShowModal(false)}
              onSave={(data) => handleAddMember(selectedCommittee.id, data)}
            />
          )}
          {modalType === 'changeRequest' && (
            <ChangeRequestModal
              committee={selectedCommittee}
              faculty={faculty}
              onClose={() => setShowModal(false)}
              onSave={handleChangeRequest}
            />
          )}
        </>
      )}
    </div>
  );
};

const CommitteeCard = ({ committee, user, faculty, onEdit, onAddMember, onRemoveMember, onChangeRequest }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              Committee for {committee.student_name}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Student ID: {committee.student_id}</p>
              <p>Formed: {formatDate(committee.committee_formed_date)}</p>
              <p>Type: {committee.committee_type}</p>
              <p>Department: {committee.department_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              committee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {committee.is_active ? 'Active' : 'Inactive'}
            </span>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="border-t pt-4 space-y-4">
            {/* Members */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-900">Committee Members</h4>
                {user.role === 'admin' && (
                  <button
                    onClick={() => onAddMember(committee)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Add Member
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {committee.members?.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      <span className="ml-2 text-sm text-gray-600">({member.role})</span>
                      <span className="ml-2 text-xs text-gray-500">{member.department}</span>
                    </div>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => onRemoveMember(committee.id, member.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500 text-sm">No members assigned</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              {user.role === 'admin' && (
                <button
                  onClick={() => onEdit(committee)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Committee
                </button>
              )}
              {user.role === 'student' && committee.student_user_id === user.id && (
                <button
                  onClick={() => onChangeRequest(committee)}
                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  Request Change
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChangeRequestCard = ({ request, user, onApprove }) => {
  const [comments, setComments] = useState('');

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Change Request from {request.student_name}
          </h3>
          <p className="text-sm text-gray-600">
            Committee ID: {request.committee_id} • Submitted: {formatDate(request.submitted_at)}
          </p>
          <p className="text-sm text-gray-700 mt-2">
            <strong>Reason:</strong> {request.reason}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>Details:</strong> {request.details}
          </p>
        </div>
        
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
      </div>

      {user.role === 'admin' && request.status === 'pending' && (
        <div className="border-t pt-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Admin Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add your comments..."
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onApprove({ status: 'rejected', comments })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
            <button
              onClick={() => onApprove({ status: 'approved', comments })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CommitteeModal = ({ type, committee, students, faculty, departments, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    student_user_id: committee?.student_user_id || '',
    committee_type: committee?.committee_type || 'initial',
    committee_formed_date: committee?.committee_formed_date || new Date().toISOString().split('T')[0],
    notes: committee?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {type === 'create' ? 'Create GEC Committee' : 'Edit Committee'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
            <select
              required
              value={formData.student_user_id}
              onChange={(e) => setFormData({...formData, student_user_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} ({student.student_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Committee Type</label>
            <select
              value={formData.committee_type}
              onChange={(e) => setFormData({...formData, committee_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="initial">Initial Committee</option>
              <option value="comprehensive">Comprehensive Exam</option>
              <option value="synopsis">Synopsis Defense</option>
              <option value="thesis">Thesis Defense</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Formation Date</label>
            <input
              type="date"
              required
              value={formData.committee_formed_date}
              onChange={(e) => setFormData({...formData, committee_formed_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Additional notes about the committee..."
            />
          </div>

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
              {type === 'create' ? 'Create' : 'Update'} Committee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddMemberModal = ({ committee, faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    faculty_id: '',
    role: 'member',
    is_external: false,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Committee Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faculty Member</label>
            <select
              required
              value={formData.faculty_id}
              onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Faculty</option>
              {faculty.map(fac => (
                <option key={fac.id} value={fac.id}>
                  {fac.first_name} {fac.last_name} - {fac.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="chairperson">Chairperson</option>
              <option value="external">External Member</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_external}
              onChange={(e) => setFormData({...formData, is_external: e.target.checked})}
              className="h-4 w-4 text-blue-600 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">External Member</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangeRequestModal = ({ committee, faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    reason: '',
    details: '',
    requested_changes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      committee_id: committee.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Request Committee Change</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Change</label>
            <select
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Reason</option>
              <option value="member_unavailable">Member No Longer Available</option>
              <option value="expertise_mismatch">Expertise Mismatch</option>
              <option value="conflict_of_interest">Conflict of Interest</option>
              <option value="research_direction_change">Research Direction Change</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Explanation</label>
            <textarea
              required
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Please provide a detailed explanation for the requested change..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Requested Changes</label>
            <textarea
              required
              value={formData.requested_changes}
              onChange={(e) => setFormData({...formData, requested_changes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Describe the specific changes you are requesting..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GECCommitteeManagement; 