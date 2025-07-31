import React, { useState, useEffect } from 'react';
import {
  getAllDepartments,
  getDepartmentDetails,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAllDPRCs,
  createDPRC,
  updateDPRC,
  getDPRCDetails,
  getAvailableFaculty,
  getAllFaculty
} from '../utils/api';

const DepartmentManagement = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [dprcs, setDprcs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDPRC, setSelectedDPRC] = useState(null);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showDPRCModal, setShowDPRCModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptResult, dprcResult, facultyResult] = await Promise.all([
        getAllDepartments(),
        getAllDPRCs(),
        getAllFaculty()
      ]);

      setDepartments(deptResult.success ? deptResult.data : []);
      setDprcs(dprcResult.success ? dprcResult.data : []);
      setFaculty(facultyResult.success ? facultyResult.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (deptData) => {
    try {
      const result = await createDepartment(deptData);
      if (result.success) {
        alert('Department created successfully!');
        loadData();
        setShowDepartmentModal(false);
        setSelectedDepartment(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error creating department: ' + error.message);
    }
  };

  const handleUpdateDepartment = async (deptId, deptData) => {
    try {
      const result = await updateDepartment(deptId, deptData);
      if (result.success) {
        alert('Department updated successfully!');
        loadData();
        setShowDepartmentModal(false);
        setSelectedDepartment(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error updating department: ' + error.message);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (window.confirm('Are you sure you want to deactivate this department?')) {
      try {
        const result = await deleteDepartment(deptId);
        if (result.success) {
          alert('Department deactivated successfully!');
          loadData();
        } else {
          alert(`Error: ${result.message}`);
        }
      } catch (error) {
        alert('Error deactivating department: ' + error.message);
      }
    }
  };

  const handleCreateDPRC = async (dprcData) => {
    try {
      const result = await createDPRC(dprcData);
      if (result.success) {
        alert('DPRC created successfully!');
        loadData();
        setShowDPRCModal(false);
        setSelectedDPRC(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error creating DPRC: ' + error.message);
    }
  };

  const renderDepartmentManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
        <button
          onClick={() => {
            setSelectedDepartment(null);
            setShowDepartmentModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Add Department</span>
        </button>
      </div>

      {/* Department Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{departments.length}</div>
          <div className="text-sm text-gray-600">Total Departments</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {departments.filter(d => d.has_dprc).length}
          </div>
          <div className="text-sm text-gray-600">With DPRC</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">
            {departments.filter(d => d.can_form_dprc && !d.has_dprc).length}
          </div>
          <div className="text-sm text-gray-600">Can Form DPRC</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-red-600">
            {departments.filter(d => !d.can_form_dprc).length}
          </div>
          <div className="text-sm text-gray-600">Need More Faculty</div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faculty Count
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DPRC Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map(dept => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {dept.dept_name}
                    </div>
                    <div className="text-sm text-gray-500">{dept.dept_code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dept.total_faculty}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dept.total_students}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dept.has_dprc ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✅ DPRC Formed
                    </span>
                  ) : dept.can_form_dprc ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      ⏳ Can Form DPRC
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      ❌ Need More Faculty
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDepartment(dept);
                      setShowDepartmentModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  {!dept.has_dprc && dept.can_form_dprc && (
                    <button
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setShowDPRCModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Form DPRC
                    </button>
                  )}
                  {dept.has_dprc && (
                    <button
                      onClick={() => {
                        // View DPRC details
                        const dprc = dprcs.find(d => d.department_id === dept.id);
                        if (dprc) {
                          setSelectedDPRC(dprc);
                          setShowDPRCModal(true);
                        }
                      }}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      View DPRC
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDPRCManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">DPRC Management</h2>
        <div className="text-sm text-gray-600">
          Departmental PhD Research Committees
        </div>
      </div>

      {/* DPRC Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{dprcs.length}</div>
          <div className="text-sm text-gray-600">Active DPRCs</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {dprcs.reduce((sum, dprc) => sum + dprc.member_count, 0)}
          </div>
          <div className="text-sm text-gray-600">Total DPRC Members</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">
            {departments.filter(d => d.can_form_dprc && !d.has_dprc).length}
          </div>
          <div className="text-sm text-gray-600">Pending Formation</div>
        </div>
      </div>

      {/* DPRC Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Committee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chair
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formation Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dprcs.map(dprc => (
              <tr key={dprc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{dprc.dept_name}</div>
                  <div className="text-sm text-gray-500">{dprc.dept_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dprc.committee_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dprc.chair_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {dprc.member_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(dprc.formation_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      setSelectedDPRC(dprc);
                      setShowDPRCModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDPRC(dprc);
                      setShowDPRCModal(true);
                    }}
                    className="text-green-600 hover:text-green-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading department management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'departments', name: 'Departments', icon: '🏢', count: departments.length },
              { id: 'dprc', name: 'DPRC Committees', icon: '👥', count: dprcs.length }
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
        {activeTab === 'departments' && renderDepartmentManagement()}
        {activeTab === 'dprc' && renderDPRCManagement()}
      </div>

      {/* Department Modal */}
      {showDepartmentModal && (
        <DepartmentModal
          department={selectedDepartment}
          faculty={faculty}
          onClose={() => {
            setShowDepartmentModal(false);
            setSelectedDepartment(null);
          }}
          onSave={(deptData) => {
            if (selectedDepartment) {
              handleUpdateDepartment(selectedDepartment.id, deptData);
            } else {
              handleCreateDepartment(deptData);
            }
          }}
        />
      )}

      {/* DPRC Modal */}
      {showDPRCModal && (
        <DPRCModal
          dprc={selectedDPRC}
          department={selectedDepartment}
          faculty={faculty}
          onClose={() => {
            setShowDPRCModal(false);
            setSelectedDPRC(null);
            setSelectedDepartment(null);
          }}
          onSave={(dprcData) => {
            if (selectedDPRC) {
              // Update DPRC
            } else {
              handleCreateDPRC(dprcData);
            }
          }}
        />
      )}
    </div>
  );
};

// Department Modal Component
const DepartmentModal = ({ department, faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    dept_code: department?.dept_code || '',
    dept_name: department?.dept_name || '',
    dept_full_name: department?.dept_full_name || '',
    faculty_members: department?.faculty_members || []
  });

  const [selectedFaculty, setSelectedFaculty] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dept_code || !formData.dept_name) {
      alert('Department code and name are required!');
      return;
    }

    if (!department && selectedFaculty.length < 4) {
      alert('At least 4 faculty members are required for a new department!');
      return;
    }

    onSave({
      ...formData,
      faculty_members: selectedFaculty.map(f => ({ id: f.id }))
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {department ? 'Edit Department' : 'Add New Department'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Code</label>
              <input
                type="text"
                required
                value={formData.dept_code}
                onChange={(e) => setFormData({...formData, dept_code: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., CS, EE, SE"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department Name</label>
              <input
                type="text"
                required
                value={formData.dept_name}
                onChange={(e) => setFormData({...formData, dept_name: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={formData.dept_full_name}
              onChange={(e) => setFormData({...formData, dept_full_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g., Department of Computer Science"
            />
          </div>

          {!department && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign Faculty Members (Minimum 4 required)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
                {faculty.map(f => (
                  <label key={f.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedFaculty.some(sf => sf.id === f.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFaculty([...selectedFaculty, f]);
                        } else {
                          setSelectedFaculty(selectedFaculty.filter(sf => sf.id !== f.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {f.first_name} {f.last_name} - {f.designation}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Selected: {selectedFaculty.length} faculty members
              </p>
            </div>
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
              {department ? 'Update' : 'Create'} Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// DPRC Modal Component
const DPRCModal = ({ dprc, department, faculty, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    department_id: department?.id || dprc?.department_id || '',
    committee_name: dprc?.committee_name || `${department?.dept_name || ''} DPRC`,
    chair_faculty_id: dprc?.chair_faculty_id || '',
    members: dprc?.members || [],
    meeting_schedule: dprc?.meeting_schedule || 'Monthly - First Tuesday'
  });

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableFaculty, setAvailableFaculty] = useState([]);

  useEffect(() => {
    if (formData.department_id) {
      loadAvailableFaculty();
    }
  }, [formData.department_id]);

  const loadAvailableFaculty = async () => {
    try {
      const result = await getAvailableFaculty(formData.department_id);
      if (result.success) {
        setAvailableFaculty(result.data);
      }
    } catch (error) {
      console.error('Error loading available faculty:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.committee_name || !formData.chair_faculty_id) {
      alert('Committee name and chair are required!');
      return;
    }

    const totalMembers = selectedMembers.length + 1; // +1 for chair
    if (totalMembers < 4) {
      alert('DPRC must have at least 4 members including the chair!');
      return;
    }

    onSave({
      ...formData,
      members: [
        { faculty_id: formData.chair_faculty_id, role: 'chair' },
        ...selectedMembers.map(m => ({ faculty_id: m.id, role: 'member' }))
      ]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {dprc ? 'DPRC Details' : 'Form DPRC Committee'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Committee Name</label>
            <input
              type="text"
              required
              value={formData.committee_name}
              onChange={(e) => setFormData({...formData, committee_name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select Chair</label>
            <select
              required
              value={formData.chair_faculty_id}
              onChange={(e) => setFormData({...formData, chair_faculty_id: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select Committee Chair</option>
              {availableFaculty.map(f => (
                <option key={f.id} value={f.id}>
                  {f.first_name} {f.last_name} - {f.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Committee Members (Minimum 3 more members required)
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded p-3">
              {availableFaculty
                .filter(f => f.id !== parseInt(formData.chair_faculty_id))
                .map(f => (
                  <label key={f.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some(sm => sm.id === f.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, f]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(sm => sm.id !== f.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {f.first_name} {f.last_name} - {f.designation}
                    </span>
                  </label>
                ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Selected: {selectedMembers.length + (formData.chair_faculty_id ? 1 : 0)} total members
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Meeting Schedule</label>
            <input
              type="text"
              value={formData.meeting_schedule}
              onChange={(e) => setFormData({...formData, meeting_schedule: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="e.g., Monthly - First Tuesday"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              {dprc ? 'Close' : 'Cancel'}
            </button>
            {!dprc && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Form DPRC Committee
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentManagement; 