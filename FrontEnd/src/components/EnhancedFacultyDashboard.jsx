import React, { useState, useEffect } from 'react';
import {
  getFacultyPendingApprovals,
  getFacultyStudents,
  getFormSubmissions,
  approveFormSubmission,
  getAllGECCommittees,
  getFormSubmissionDetails,
  getDPRCDashboard,
  formatDate,
  getStatusColor
} from '../utils/api';
import FormViewer from './FormViewer';
import FacultyDPRCDashboard from './FacultyDPRCDashboard';

const EnhancedFacultyDashboard = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showFormViewer, setShowFormViewer] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    pendingApprovals: [],
    myStudents: [],
    recentSubmissions: [],
    gecCommittees: [],
    facultyStats: {},
    isDPRCMember: false,
    dprcData: null
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Check if faculty is DPRC member
      let dprcResult = null;
      try {
        dprcResult = await getDPRCDashboard();
      } catch {
        // Not a DPRC member, which is fine
        console.log('Faculty is not a DPRC member');
      }

      const [
        approvalsResult,
        studentsResult,
        submissionsResult,
        gecResult
      ] = await Promise.all([
        getFacultyPendingApprovals(user.id),
        getFacultyStudents(),
        getFormSubmissions({ user_type: 'faculty' }),
        user.roles?.includes('gec_member') ? getAllGECCommittees() : Promise.resolve({ success: true, data: [] })
      ]);

      setDashboardData({
        pendingApprovals: approvalsResult.success ? approvalsResult.data : [],
        myStudents: studentsResult.success ? studentsResult.data : [],
        recentSubmissions: submissionsResult.success ? submissionsResult.data.submissions || [] : [],
        gecCommittees: gecResult.success ? gecResult.data : [],
        isDPRCMember: dprcResult?.success || false,
        dprcData: dprcResult?.success ? dprcResult.data : null,
        facultyStats: calculateStats(studentsResult.data || [], approvalsResult.data || [])
      });
    } catch (error) {
      console.error('Error loading faculty dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (students, approvals) => {
    return {
      totalStudents: students.length,
      activeStudents: students.filter(s => s.is_active).length,
      pendingApprovals: approvals.length,
      thisMonthApprovals: approvals.filter(a => 
        new Date(a.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length
    };
  };

  const handleApproval = async (submissionId, action, comments = '') => {
    try {
      const result = await approveFormSubmission(submissionId, action, comments, 'faculty');
      if (result.success) {
        alert(`Form ${action} successfully!`);
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
      const result = await getFormSubmissionDetails(submissionId, 'faculty');
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Students"
          value={dashboardData.facultyStats.activeStudents}
          description={`${dashboardData.facultyStats.totalStudents} total`}
          icon="👨‍🎓"
          color="blue"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          title="Pending Approvals"
          value={dashboardData.facultyStats.pendingApprovals}
          description="Awaiting your review"
          icon="⏳"
          color="orange"
          onClick={() => setActiveTab('approvals')}
        />
        <StatCard
          title="This Month"
          value={dashboardData.facultyStats.thisMonthApprovals}
          description="Forms approved"
          icon="✅"
          color="green"
        />
        <StatCard
          title="GEC Committees"
          value={dashboardData.gecCommittees.filter(g => g.members?.some(m => m.faculty_id === user.id)).length}
          description="Active committees"
          icon="👥"
          color="purple"
          onClick={() => setActiveTab('gec')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            title="Review Forms"
            description="Pending approvals"
            onClick={() => setActiveTab('approvals')}
            color="blue"
          />
          <QuickAction
            title="My Students"
            description="View supervised students"
            onClick={() => setActiveTab('students')}
            color="green"
          />
          <QuickAction
            title="GEC Meetings"
            description="Committee activities"
            onClick={() => setActiveTab('gec')}
            color="purple"
          />
          <QuickAction
            title="Reports"
            description="Generate reports"
            onClick={() => setActiveTab('reports')}
            color="indigo"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Form Submissions</h3>
        {dashboardData.recentSubmissions.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recentSubmissions.slice(0, 5).map(submission => (
              <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{submission.form_name}</p>
                  <p className="text-sm text-gray-600">
                    by {submission.student_name} • {formatDate(submission.submitted_at)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                  {submission.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent submissions</p>
        )}
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pending Approvals</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {dashboardData.pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          {dashboardData.pendingApprovals.map(approval => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              onApprove={(comments) => handleApproval(approval.id, 'approve', comments)}
              onReject={(comments) => handleApproval(approval.id, 'reject', comments)}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-gray-600">No pending approvals at the moment.</p>
        </div>
      )}
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Students</h2>
        <div className="space-x-2">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {dashboardData.myStudents.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Research Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.myStudents.map(student => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-gray-500">{student.student_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.current_semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.research_area || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(student.workflow_stage)}`}>
                      {student.workflow_stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">View</button>
                    <button className="text-green-600 hover:text-green-900">Message</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-4">👨‍🎓</div>
          <h3 className="text-lg font-medium mb-2">No students assigned</h3>
          <p className="text-gray-600">You don't have any students under your supervision yet.</p>
        </div>
      )}
    </div>
  );

  const renderGEC = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">GEC Committee Activities</h2>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {dashboardData.gecCommittees
          .filter(committee => committee.members?.some(m => m.faculty_id === user.id))
          .map(committee => (
            <GECCommitteeCard key={committee.id} committee={committee} />
          ))}
        
        {dashboardData.gecCommittees.filter(committee => 
          committee.members?.some(m => m.faculty_id === user.id)
        ).length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium mb-2">No GEC committees</h3>
            <p className="text-gray-600">You're not currently assigned to any GEC committees.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading faculty dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Faculty Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome, {user.first_name} {user.last_name} • {user.designation || 'Faculty Member'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.department_name}
              </span>
              {user.roles && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {user.roles.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'approvals', name: 'Approvals', icon: '✓', count: dashboardData.pendingApprovals.length },
              { id: 'students', name: 'Students', icon: '👨‍🎓', count: dashboardData.myStudents.length },
              ...(dashboardData.isDPRCMember ? [{ id: 'dprc', name: 'DPRC', icon: '🏛️', count: dashboardData.dprcData?.pending_forms?.length || 0 }] : []),
              { id: 'gec', name: 'GEC', icon: '👥' },
              { id: 'reports', name: 'Reports', icon: '📈' }
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
                  <span className="ml-2 bg-red-100 text-red-800 text-xs rounded-full px-2 py-1">
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
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'dprc' && dashboardData.isDPRCMember && (
          <FacultyDPRCDashboard />
        )}
        {activeTab === 'gec' && renderGEC()}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-lg font-medium mb-2">Reports Coming Soon</h3>
            <p className="text-gray-600">Advanced reporting features will be available soon.</p>
          </div>
        )}
      </div>

      {/* Form Viewer Modal */}
      {showFormViewer && selectedSubmission && (
        <FormViewer
          submission={selectedSubmission}
          onClose={handleCloseFormViewer}
          onApprove={(submissionId) => handleApproval(submissionId, 'approve')}
          onReject={(submissionId) => handleApproval(submissionId, 'reject')}
          userType="faculty"
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, description, icon, color = 'blue', onClick }) => (
  <div 
    className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  </div>
);

const QuickAction = ({ title, description, onClick, color = 'blue' }) => (
  <button
    onClick={onClick}
    className={`p-4 text-left border-2 border-dashed border-${color}-200 rounded-lg hover:border-${color}-300 hover:bg-${color}-50 transition-colors`}
  >
    <div className={`font-medium text-${color}-600 mb-1`}>{title}</div>
    <div className="text-xs text-gray-500">{description}</div>
  </button>
);

const ApprovalCard = ({ approval, onApprove, onReject, onViewDetails }) => {
  const [comments, setComments] = useState('');
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{approval.form_name}</h3>
          <p className="text-gray-600">
            Submitted by: {approval.student_name} ({approval.student_id})
          </p>
          <p className="text-sm text-gray-500">
            {formatDate(approval.submitted_at)} • Stage: {approval.approval_stage === 'supervisor_consent' ? 'Supervisor Consent' : approval.approval_stage}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(approval.status)}`}>
          {approval.status}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => onViewDetails(approval.id)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          📄 View Full Details
        </button>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showComments ? 'Hide' : 'Add'} Comments
        </button>
        
        <div className="space-x-3">
          <button
            onClick={() => onReject(comments)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={() => onApprove(comments)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Approve
          </button>
        </div>
      </div>

      {showComments && (
        <div className="mt-4">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add your comments..."
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};

const GECCommitteeCard = ({ committee }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold">
          Committee for {committee.student_name}
        </h3>
        <p className="text-gray-600">
          Formed: {formatDate(committee.committee_formed_date)}
        </p>
        <p className="text-sm text-gray-500">
          Type: {committee.committee_type}
        </p>
      </div>
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
        Active
      </span>
    </div>

    <div className="mb-4">
      <h4 className="font-medium mb-2">Committee Members</h4>
      <div className="space-y-2">
        {committee.members?.map((member, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>{member.name}</span>
            <span className="text-xs text-gray-500">{member.role}</span>
          </div>
        ))}
      </div>
    </div>

    <button className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      View Details
    </button>
  </div>
);

export default EnhancedFacultyDashboard; 