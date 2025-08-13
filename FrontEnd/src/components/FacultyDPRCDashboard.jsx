import React, { useState, useEffect } from 'react';
import {
  getDPRCDashboard,
  processDPRCApproval,
  getDPRCFormDetails,
  formatDate
} from '../utils/api';
import FormViewer from './FormViewer';

const FacultyDPRCDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [pendingForms, setPendingForms] = useState([]);
  const [recentForms, setRecentForms] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showFormViewer, setShowFormViewer] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [departmentInfo, setDepartmentInfo] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get DPRC dashboard data directly
      const dashboardResult = await getDPRCDashboard();
      if (dashboardResult.success) {
        const data = dashboardResult.data;
        
        // Set user profile with DPRC membership info
        setUserProfile({
          is_dprc_member: true,
          dprc_info: data.dprc_info,
          department_id: data.department_info.id
        });
        
        // Set forms data
        setPendingForms(data.pending_forms || []);
        setRecentForms(data.recent_forms || []);
        setDepartmentInfo(data.department_info);
      } else {
        // User is not a DPRC member
        setUserProfile({ is_dprc_member: false });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setUserProfile({ is_dprc_member: false });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (submissionId) => {
    try {
      const result = await getDPRCFormDetails(submissionId);
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

  const handleApproval = async (submissionId, action) => {
    try {
      const comments = prompt(`Enter ${action === 'approve' ? 'approval' : 'rejection'} comments (optional):`);
      const result = await processDPRCApproval(submissionId, action, comments);
      
      if (result.success) {
        // Show detailed success message with voting status
        const data = result.data;
        let message = `Form ${action}d successfully!\n\n`;
        message += `Overall Status: ${data.overall_status}\n`;
        message += `Progress: ${data.progress}\n`;
        
        if (data.approved_by && data.approved_by.length > 0) {
          message += `\n✅ Approved by: ${data.approved_by.join(', ')}`;
        }
        if (data.rejected_by && data.rejected_by.length > 0) {
          message += `\n❌ Rejected by: ${data.rejected_by.join(', ')}`;
        }
        if (data.pending_members && data.pending_members.length > 0) {
          message += `\n⏳ Still pending: ${data.pending_members.join(', ')}`;
        }
        
        alert(message);
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

  const handleCloseFormViewer = () => {
    setShowFormViewer(false);
    setSelectedSubmission(null);
  };

  const renderPendingApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pending DPRC Approvals</h2>
        <div className="text-sm text-gray-600">
          {departmentInfo && `${departmentInfo.dept_name} Department`}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-orange-600">{pendingForms.length}</div>
          <div className="text-sm text-gray-600">Pending Approvals</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {recentForms.filter(f => f.dprc_approval_status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Recently Approved</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-2xl font-bold text-blue-600">{recentForms.length}</div>
          <div className="text-sm text-gray-600">Total Processed</div>
        </div>
      </div>

      {/* Pending Forms */}
      {pendingForms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-gray-600">No pending approvals for your department at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingForms.map(form => (
            <div key={form.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{form.form_name}</h4>
                  <p className="text-sm text-gray-600">
                    Submitted by {form.student_name} ({form.student_id}) on {formatDate(form.submitted_at)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Semester: {form.semester} | Academic Year: {form.academic_year}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
                    {form.total_responses > 0 ? `In Progress (${form.total_responses}/${form.total_members})` : 'Awaiting Your Vote'}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Submitted {Math.ceil((new Date() - new Date(form.submitted_at)) / (1000 * 60 * 60 * 24))} days ago
                  </div>
                </div>
              </div>

              {/* Individual Member Tracking */}
              {form.total_members > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    DPRC Progress: {form.total_responses || 0}/{form.total_members} members voted
                  </div>
                  
                  {/* Approved by */}
                  {form.approved_by && form.approved_by.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-green-700">🟢 Approved by: </span>
                      <span className="text-xs text-green-600">
                        {form.approved_by.filter(name => name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Rejected by */}
                  {form.rejected_by && form.rejected_by.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-medium text-red-700">❌ Rejected by: </span>
                      <span className="text-xs text-red-600">
                        {form.rejected_by.filter(name => name).join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Pending members */}
                  {form.pending_members && form.pending_members.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-orange-700">⏳ Pending approval: </span>
                      <span className="text-xs text-orange-600">
                        {form.pending_members.filter(name => name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleApproval(form.id, 'approve')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleApproval(form.id, 'reject')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleViewDetails(form.id)}
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

  const renderRecentForms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recently Processed Forms</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Recent Forms Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DPRC Status & Votes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Your Decision
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentForms.map(form => (
              <tr key={form.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{form.form_name}</div>
                  <div className="text-sm text-gray-500">{form.form_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{form.student_name}</div>
                  <div className="text-sm text-gray-500">{form.student_id}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      form.dprc_approval_status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {form.dprc_approval_status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                    
                    {/* Vote breakdown */}
                    <div className="text-xs text-gray-600">
                      {form.approved_count || 0}/{form.total_members || 0} approved
                    </div>
                    
                    {/* Individual votes */}
                    {form.approved_by && form.approved_by.length > 0 && (
                      <div className="text-xs text-green-600">
                        ✓ {form.approved_by.filter(name => name).join(', ')}
                      </div>
                    )}
                    {form.rejected_by && form.rejected_by.length > 0 && (
                      <div className="text-xs text-red-600">
                        ✗ {form.rejected_by.filter(name => name).join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {form.my_decision ? (
                    <div className="space-y-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        form.my_decision === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {form.my_decision === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                      <div className="text-xs text-gray-500">
                        {formatDate(form.my_decision_date)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No vote recorded</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleViewDetails(form.id)}
                    className="text-blue-600 hover:text-blue-900"
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
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading DPRC dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is DPRC member
  if (!userProfile?.is_dprc_member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🏛️</div>
          <h3 className="text-lg font-medium mb-2">DPRC Access Required</h3>
          <p className="text-gray-600">
            You need to be a member of a Departmental PhD Research Committee (DPRC) to access this dashboard.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please contact your administrator if you believe this is an error.
          </p>
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
              <h1 className="text-3xl font-bold text-gray-900">DPRC Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Departmental PhD Research Committee - {departmentInfo?.dept_name || 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {pendingForms.length} pending approvals
              </span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-600">DPRC Member</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'pending', name: 'Pending Approvals', icon: '⏳', count: pendingForms.length },
              { id: 'recent', name: 'Recent Forms', icon: '📋', count: recentForms.length }
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
        {activeTab === 'pending' && renderPendingApprovals()}
        {activeTab === 'recent' && renderRecentForms()}
      </div>

      {/* Form Viewer Modal */}
      {showFormViewer && selectedSubmission && (
        <FormViewer
          submission={selectedSubmission}
          onClose={handleCloseFormViewer}
          onApprove={(submissionId) => handleApproval(submissionId, 'approve')}
          onReject={(submissionId) => handleApproval(submissionId, 'reject')}
          userType="dprc"
        />
      )}
    </div>
  );
};

export default FacultyDPRCDashboard; 