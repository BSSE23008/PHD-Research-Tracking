import React, { useState, useEffect } from 'react';
import {
  getPendingApprovals,
  getFormSubmissions,
  approveFormSubmission,
  getSubmissionById,
  formatDate,
  formatDateTime,
  getStatusColor
} from '../utils/api';

const FormApprovalInterface = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    stage: '',
    form_type: '',
    priority: '',
    search: ''
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [approvals, filters]);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [pendingResult, allSubmissionsResult] = await Promise.all([
        getPendingApprovals({ faculty_id: user.id }),
        getFormSubmissions({ status: 'submitted', faculty_id: user.id })
      ]);

      let allApprovals = [];
      
      if (pendingResult.success) {
        allApprovals = [...pendingResult.data];
      }

      // Add additional submissions that need faculty review
      if (allSubmissionsResult.success) {
        const additionalSubmissions = allSubmissionsResult.data.submissions || [];
        const existingIds = new Set(allApprovals.map(a => a.id));
        
        const newApprovals = additionalSubmissions
          .filter(sub => !existingIds.has(sub.id))
          .filter(sub => needsFacultyApproval(sub, user))
          .map(sub => ({
            ...sub,
            approval_stage: determineApprovalStage(sub, user),
            priority: calculatePriority(sub)
          }));

        allApprovals = [...allApprovals, ...newApprovals];
      }

      setApprovals(allApprovals);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const needsFacultyApproval = (submission, user) => {
    // Check if this submission needs approval from this specific faculty member
    const userRoles = user.roles || [user.role];
    
    // Supervisor approval
    if (submission.supervisor_approval_status === 'pending' && 
        (submission.supervisor_id === user.id || submission.primary_supervisor_id === user.id)) {
      return true;
    }

    // GEC member approval
    if (submission.gec_approval_status === 'pending' && userRoles.includes('gec_member')) {
      return true;
    }

    // HOD approval
    if (submission.hod_approval_status === 'pending' && userRoles.includes('hod')) {
      return true;
    }

    // Chairperson approval
    if (submission.chairperson_approval_status === 'pending' && userRoles.includes('chairperson')) {
      return true;
    }

    // DEC member approval
    if (submission.dec_approval_status === 'pending' && userRoles.includes('dec_member')) {
      return true;
    }

    return false;
  };

  const determineApprovalStage = (submission, user) => {
    const userRoles = user.roles || [user.role];

    if (submission.supervisor_approval_status === 'pending' && 
        (submission.supervisor_id === user.id || submission.primary_supervisor_id === user.id)) {
      return 'supervisor';
    }

    if (submission.gec_approval_status === 'pending' && userRoles.includes('gec_member')) {
      return 'gec';
    }

    if (submission.hod_approval_status === 'pending' && userRoles.includes('hod')) {
      return 'hod';
    }

    if (submission.chairperson_approval_status === 'pending' && userRoles.includes('chairperson')) {
      return 'chairperson';
    }

    if (submission.dec_approval_status === 'pending' && userRoles.includes('dec_member')) {
      return 'dec';
    }

    return 'unknown';
  };

  const calculatePriority = (submission) => {
    const submittedDate = new Date(submission.submitted_at);
    const daysSinceSubmission = Math.floor((new Date() - submittedDate) / (1000 * 60 * 60 * 24));
    
    // High priority forms
    const highPriorityForms = ['PHDEE03', 'PHDEE04-A', 'PHDEE05-A'];
    if (highPriorityForms.includes(submission.form_code)) return 'high';
    
    // Overdue submissions
    if (daysSinceSubmission > 7) return 'high';
    if (daysSinceSubmission > 3) return 'medium';
    
    return 'low';
  };

  const applyFilters = () => {
    let filtered = [...approvals];

    if (filters.stage) {
      filtered = filtered.filter(approval => approval.approval_stage === filters.stage);
    }

    if (filters.form_type) {
      filtered = filtered.filter(approval => approval.form_code?.includes(filters.form_type));
    }

    if (filters.priority) {
      filtered = filtered.filter(approval => approval.priority === filters.priority);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(approval => 
        approval.student_name?.toLowerCase().includes(searchTerm) ||
        approval.form_name?.toLowerCase().includes(searchTerm) ||
        approval.student_id?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.submitted_at) - new Date(a.submitted_at);
    });

    setFilteredApprovals(filtered);
  };

  const handleApproval = async (submissionId, action, comments = '') => {
    setProcessing(true);
    try {
      const result = await approveFormSubmission(submissionId, action, comments, 'faculty');
      
      if (result.success) {
        alert(`Form ${action}d successfully!`);
        loadApprovals();
        setShowDetailModal(false);
        setSelectedSubmission(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      alert('Error processing approval: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = async (submission) => {
    try {
      const result = await getSubmissionById(submission.id);
      if (result.success) {
        setSelectedSubmission(result.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error loading submission details:', error);
      setSelectedSubmission(submission);
      setShowDetailModal(true);
    }
  };

  const getApprovalStats = () => {
    const total = approvals.length;
    const byPriority = approvals.reduce((acc, approval) => {
      acc[approval.priority] = (acc[approval.priority] || 0) + 1;
      return acc;
    }, {});
    const byStage = approvals.reduce((acc, approval) => {
      acc[approval.approval_stage] = (acc[approval.approval_stage] || 0) + 1;
      return acc;
    }, {});

    return { total, byPriority, byStage };
  };

  const stats = getApprovalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approvals...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Form Approvals</h1>
              <p className="text-gray-600 mt-1">Review and approve student form submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {stats.total} pending approvals
              </span>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.byPriority.high || 0}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.byPriority.medium || 0}</div>
            <div className="text-sm text-gray-600">Medium Priority</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.byStage.supervisor || 0}</div>
            <div className="text-sm text-gray-600">Supervisor Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.byStage.gec || 0}</div>
            <div className="text-sm text-gray-600">GEC Review</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-indigo-600">{stats.byStage.hod || 0}</div>
            <div className="text-sm text-gray-600">HOD Review</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Stage</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters({...filters, stage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stages</option>
                <option value="supervisor">Supervisor</option>
                <option value="gec">GEC Committee</option>
                <option value="hod">Head of Department</option>
                <option value="chairperson">Chairperson</option>
                <option value="dec">DEC Member</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Form Type</label>
              <select
                value={filters.form_type}
                onChange={(e) => setFilters({...filters, form_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Forms</option>
                <option value="PHDEE02">Supervisor & GEC Forms</option>
                <option value="PHDEE03">Comprehensive Exam</option>
                <option value="PHDEE04">Synopsis Defense</option>
                <option value="PHDEE05">Thesis Defense</option>
                <option value="E1">Evaluation Forms</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search student, form..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredApprovals.length} of {approvals.length} approvals
            </span>
            <button
              onClick={loadApprovals}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Approvals List */}
        <div className="space-y-4">
          {filteredApprovals.length > 0 ? (
            filteredApprovals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onViewDetails={handleViewDetails}
                onQuickAction={handleApproval}
                processing={processing}
              />
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {approvals.length === 0 ? 'No pending approvals' : 'No approvals match your filters'}
              </h3>
              <p className="text-gray-600">
                {approvals.length === 0 
                  ? 'All caught up! Check back later for new submissions.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <FormDetailModal
          submission={selectedSubmission}
          user={user}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubmission(null);
          }}
          onApprove={(comments) => handleApproval(selectedSubmission.id, 'approve', comments)}
          onReject={(comments) => handleApproval(selectedSubmission.id, 'reject', comments)}
          processing={processing}
        />
      )}
    </div>
  );
};

const ApprovalCard = ({ approval, onViewDetails, onQuickAction, processing }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚠️';
      case 'low': return '🔵';
      default: return '📋';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg shadow hover:shadow-md transition-shadow ${getPriorityColor(approval.priority)}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{getPriorityIcon(approval.priority)}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{approval.form_name}</h3>
                <p className="text-sm text-gray-600">{approval.form_code}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Student:</span>
                <p className="font-medium">{approval.student_name}</p>
                <p className="text-xs text-gray-400">{approval.student_id}</p>
              </div>
              <div>
                <span className="text-gray-500">Submitted:</span>
                <p className="font-medium">{formatDate(approval.submitted_at)}</p>
                <p className="text-xs text-gray-400">{formatDateTime(approval.submitted_at)}</p>
              </div>
              <div>
                <span className="text-gray-500">Stage:</span>
                <p className="font-medium capitalize">{approval.approval_stage}</p>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  approval.priority === 'high' ? 'bg-red-100 text-red-800' :
                  approval.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {approval.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {approval.comments && (
              <p className="italic">"{approval.comments.slice(0, 100)}..."</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(approval)}
              className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              View Details
            </button>
            <button
              onClick={() => onQuickAction(approval.id, 'reject', 'Quick rejection')}
              disabled={processing}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Quick Reject
            </button>
            <button
              onClick={() => onQuickAction(approval.id, 'approve', 'Quick approval')}
              disabled={processing}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Quick Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FormDetailModal = ({ submission, user, onClose, onApprove, onReject, processing }) => {
  const [comments, setComments] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{submission.form_name}</h2>
            <p className="text-gray-600">
              {submission.student_name} ({submission.student_id}) • {formatDateTime(submission.submitted_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['details', 'data', 'history'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Submission Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Form Code:</strong> {submission.form_code}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    <div><strong>Current Stage:</strong> {submission.current_approval_stage}</div>
                    <div><strong>Submitted:</strong> {formatDateTime(submission.submitted_at)}</div>
                    <div><strong>Academic Year:</strong> {submission.academic_year}</div>
                    <div><strong>Semester:</strong> {submission.semester}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Approval Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Supervisor:</span>
                      <span className={getStatusColor(submission.supervisor_approval_status)}>
                        {submission.supervisor_approval_status || 'Not Required'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>GEC:</span>
                      <span className={getStatusColor(submission.gec_approval_status)}>
                        {submission.gec_approval_status || 'Not Required'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>HOD:</span>
                      <span className={getStatusColor(submission.hod_approval_status)}>
                        {submission.hod_approval_status || 'Not Required'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Admin:</span>
                      <span className={getStatusColor(submission.admin_approval_status)}>
                        {submission.admin_approval_status || 'Not Required'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Form Data</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(submission.form_data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Approval History</h3>
              <div className="space-y-3">
                {submission.approval_history?.map((history, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{history.approver_name}</p>
                        <p className="text-sm text-gray-600">{history.stage} • {history.action}</p>
                      </div>
                      <span className="text-xs text-gray-500">{formatDateTime(history.timestamp)}</span>
                    </div>
                    {history.comments && (
                      <p className="text-sm text-gray-700 mt-2 italic">"{history.comments}"</p>
                    )}
                  </div>
                )) || (
                  <p className="text-gray-500">No approval history available</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your review comments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => onReject(comments)}
                disabled={processing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
              <button
                onClick={() => onApprove(comments)}
                disabled={processing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormApprovalInterface; 