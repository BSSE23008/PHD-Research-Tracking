import { useState, useEffect } from 'react';
import { 
  getDashboardSummary, 
  getFormSubmissions,
  getMyGECCommittee,
  getMyGECChangeRequests,
  createGECChangeRequest,
  getCurrentWorkflowStage,
  formatDate,
  getStatusColor,
  fetchExtendedUserProfile
} from '../utils/api';

const EnhancedStudentDashboard = ({ user, onNavigate, onFormSelect }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [dashboardData, setDashboardData] = useState({
    currentSemester: user?.current_semester || '1st',
    workflowStage: 'supervision_consent',
    totalFormsSubmitted: 0,
    pendingForms: [],
    recentSubmissions: [],
    unreadNotifications: 0
  });
  
  const [userProfile, setUserProfile] = useState(user);
  const [gecCommittee, setGecCommittee] = useState(null);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load extended user profile first to get complete data
      const profileResult = await fetchExtendedUserProfile();
      if (profileResult.success && profileResult.data.user) {
        setUserProfile(profileResult.data.user);
      }

      // Load all dashboard data in parallel with error handling
      const [
        summaryResult,
        submissionsResult, 
        gecResult,
        changeRequestsResult,
        workflowResult
      ] = await Promise.allSettled([
        getDashboardSummary(),
        getFormSubmissions({ limit: 10 }),
        getMyGECCommittee().catch(err => ({ success: false, error: err.message })),
        getMyGECChangeRequests().catch(err => ({ success: false, error: err.message })),
        getCurrentWorkflowStage().catch(err => ({ success: false, error: err.message }))
      ]);

      // Process dashboard summary
      if (summaryResult.status === 'fulfilled' && summaryResult.value.success) {
        const data = summaryResult.value.data;
        console.log('Dashboard summary data:', data); // Debug log
        
        setDashboardData(prev => ({
          ...prev,
          ...data,
          currentSemester: data.user?.current_semester || userProfile?.current_semester || user?.current_semester || '1st',
          workflowStage: (workflowResult.status === 'fulfilled' && workflowResult.value.success) ? workflowResult.value.data.stage : 'supervision_consent',
          pendingForms: data.pendingForms || [],
          recentSubmissions: data.recentSubmissions || [],
          totalFormsSubmitted: data.totalFormsSubmitted || 0,
          unreadNotifications: data.unreadNotifications || 0
        }));
        
        // Update user profile with the latest data from backend
        if (data.user) {
          setUserProfile(data.user);
        }
      }

      // Process form submissions
      if (submissionsResult.status === 'fulfilled' && submissionsResult.value.success) {
        setFormSubmissions(submissionsResult.value.data.submissions || []);
      }

      // Process GEC committee (handle 403 errors gracefully)
      if (gecResult.status === 'fulfilled' && gecResult.value.success && gecResult.value.data) {
        setGecCommittee(gecResult.value.data);
      } else if (gecResult.status === 'fulfilled' && !gecResult.value.success) {
        console.log('GEC committee not available:', gecResult.value.error);
        setGecCommittee(null);
      }

      // Process change requests (handle 403 errors gracefully)
      if (changeRequestsResult.status === 'fulfilled' && changeRequestsResult.value.success) {
        setChangeRequests(changeRequestsResult.value.data || []);
      } else if (changeRequestsResult.status === 'fulfilled' && !changeRequestsResult.value.success) {
        console.log('GEC change requests not available:', changeRequestsResult.value.error);
        setChangeRequests([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormNavigation = (formCode) => {
    if (onFormSelect) {
      onFormSelect(formCode);
    }
    if (onNavigate) {
      onNavigate('forms');
    }
  };

  const handleGECChangeRequest = async (requestData) => {
    try {
      const result = await createGECChangeRequest(requestData);
      if (result.success) {
        setShowChangeRequestModal(false);
        // Reload change requests
        const updatedRequests = await getMyGECChangeRequests();
        if (updatedRequests.success) {
          setChangeRequests(updatedRequests.data || []);
        }
        alert('GEC change request submitted successfully!');
      } else {
        alert(`Failed to submit change request: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting GEC change request:', error);
      alert('Error submitting change request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <p className="text-lg text-gray-900 mb-2">Failed to load dashboard</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAllDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userProfile?.first_name || user?.first_name}!
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600">
                  <span className="font-medium">Current Semester:</span> {userProfile?.current_semester || user?.current_semester || '1st'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  <span className="font-medium">Department:</span> {userProfile?.dept_name || userProfile?.department || 'Not assigned'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  <span className="font-medium">Stage:</span> {dashboardData.workflowStage}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Student ID: {userProfile?.student_id || user?.student_id}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {dashboardData.unreadNotifications > 0 && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                  <span className="font-medium">{dashboardData.unreadNotifications}</span> new notifications
                </div>
              )}
              <button
                onClick={loadAllDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                disabled={loading}
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Forms"
            value={dashboardData.totalFormsSubmitted}
            description="Forms submitted"
            color="blue"
            icon="📋"
          />
          <StatCard
            title="Pending Forms"
            value={dashboardData.pendingForms?.length || 0}
            description="Require your action"
            color="yellow"
            icon="⏰"
            onClick={() => setActiveTab('pending')}
          />
          <StatCard
            title="Approved Forms"
            value={formSubmissions.filter(f => 
              f.status === 'approved' || 
              f.final_approval_status === 'approved'
            ).length}
            description="Successfully approved"
            color="green"
            icon="✅"
          />
          <StatCard
            title="GEC Status"
            value={gecCommittee ? 'Formed' : 'Pending'}
            description={gecCommittee ? `${gecCommittee.members?.length || 0} members` : 'Committee formation'}
            color={gecCommittee ? 'green' : 'yellow'}
            icon="👥"
            onClick={() => setActiveTab('gec')}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'pending', label: 'Pending Forms', icon: '📝' },
                { id: 'submissions', label: 'Form History', icon: '📄' },
                { id: 'gec', label: 'GEC Committee', icon: '👥' }
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
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab 
                user={userProfile || user}
                dashboardData={dashboardData}
                recentSubmissions={formSubmissions.slice(0, 5)}
                gecCommittee={gecCommittee}
                onFormSelect={handleFormNavigation}
              />
            )}

            {activeTab === 'pending' && (
              <PendingFormsTab 
                pendingForms={dashboardData.pendingForms}
                onFormSelect={handleFormNavigation}
              />
            )}

            {activeTab === 'submissions' && (
              <FormHistoryTab 
                submissions={formSubmissions}
                onFormSelect={handleFormNavigation}
              />
            )}

            {activeTab === 'gec' && (
              <GECCommitteeTab 
                committee={gecCommittee}
                changeRequests={changeRequests}
                onRequestChange={() => setShowChangeRequestModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* GEC Change Request Modal */}
      {showChangeRequestModal && (
        <GECChangeRequestModal
          onClose={() => setShowChangeRequestModal(false)}
          onSubmit={handleGECChangeRequest}
          currentCommittee={gecCommittee}
        />
      )}
    </div>
  );
};

// Component Parts
const StatCard = ({ title, value, description, color, icon, onClick }) => (
  <div 
    className={`bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
      onClick ? 'cursor-pointer' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600 mt-1`}>{value}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  </div>
);

const OverviewTab = ({ user, dashboardData, recentSubmissions, gecCommittee, onFormSelect }) => (
  <div className="space-y-6">
    {/* Student Information Card */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Full Name</p>
          <p className="text-lg text-gray-900">{user?.first_name} {user?.last_name}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Student ID</p>
          <p className="text-lg text-gray-900">{user?.student_id || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Department</p>
          <p className="text-lg text-gray-900">{user?.dept_name || user?.department || 'Not assigned'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Current Semester</p>
          <p className="text-lg text-gray-900">{user?.current_semester || '1st'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Academic Year</p>
          <p className="text-lg text-gray-900">{user?.academic_year || '2024-2025'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Research Area</p>
          <p className="text-lg text-gray-900">{user?.research_area || 'Not specified'}</p>
        </div>
        {user?.primary_supervisor_name && (
          <div>
            <p className="text-sm font-medium text-gray-600">Primary Supervisor</p>
            <p className="text-lg text-gray-900">{user.primary_supervisor_name}</p>
            {user.primary_supervisor_designation && (
              <p className="text-sm text-gray-600">{user.primary_supervisor_designation}</p>
            )}
          </div>
        )}
        {user?.co_supervisor_name && (
          <div>
            <p className="text-sm font-medium text-gray-600">Co-Supervisor</p>
            <p className="text-lg text-gray-900">{user.co_supervisor_name}</p>
            {user.co_supervisor_designation && (
              <p className="text-sm text-gray-600">{user.co_supervisor_designation}</p>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Quick Actions & Recent Submissions */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            title="Submit New Form"
            description="Access available forms for your current semester"
            icon="📝"
            action={() => onFormSelect && onFormSelect(null)}
          />
          <ActionCard
            title="View Notifications"
            description="Check updates on your form submissions"
            icon="🔔"
            action={() => {}} // Navigate to notifications
          />
          <ActionCard
            title="Progress Timeline"
            description="Track your PhD program milestones"
            icon="📈"
            action={() => {}} // Navigate to timeline
          />
          <ActionCard
            title="Help & Support"
            description="Get assistance with forms and processes"
            icon="❓"
            action={() => {}} // Navigate to help
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Program Progress</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-3">
            <ProgressItem label="Admission" completed={true} />
            <ProgressItem 
              label="Initial Onboarding" 
              completed={dashboardData.recentSubmissions?.some(sub => 
                sub.form_code === 'ONBOARDING-001' && 
                (sub.status === 'approved_by_dprc' || sub.status === 'approved')
              )} 
            />
            <ProgressItem 
              label="Supervisor Assignment" 
              completed={dashboardData.recentSubmissions?.some(sub => 
                sub.form_code === 'PHDEE02-A' && 
                (sub.status === 'approved' || sub.final_approval_status === 'approved')
              )} 
            />
            <ProgressItem 
              label="GEC Formation" 
              completed={!!gecCommittee} 
            />
            <ProgressItem label="Course Registration" completed={false} />
            <ProgressItem label="Comprehensive Exam" completed={false} />
          </div>
        </div>
      </div>
    </div>

    {/* Recent Submissions */}
    {recentSubmissions.length > 0 && (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
        <div className="space-y-3">
          {recentSubmissions.map(submission => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      </div>
    )}
  </div>
);

const PendingFormsTab = ({ pendingForms, onFormSelect }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-6">Pending Forms</h3>
    {pendingForms.length === 0 ? (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📝</div>
        <p className="text-gray-500">No pending forms at this time</p>
        <p className="text-sm text-gray-400 mt-2">Complete forms will appear here when available</p>
      </div>
    ) : (
      <div className="space-y-4">
        {pendingForms.map(form => (
          <PendingFormCard key={form.id} form={form} onSelect={onFormSelect} />
        ))}
      </div>
    )}
  </div>
);

const FormHistoryTab = ({ submissions, onFormSelect }) => (
  <div>
    <h3 className="text-lg font-medium text-gray-900 mb-6">Form Submission History</h3>
    {submissions.length === 0 ? (
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">📄</div>
        <p className="text-gray-500">No form submissions yet</p>
        <p className="text-sm text-gray-400 mt-2">Your submitted forms will appear here</p>
      </div>
    ) : (
      <div className="space-y-4">
        {submissions.map(submission => (
          <SubmissionHistoryCard key={submission.id} submission={submission} onSelect={onFormSelect} />
        ))}
      </div>
    )}
  </div>
);

const GECCommitteeTab = ({ committee, changeRequests, onRequestChange }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900">GEC Committee</h3>
      {committee && (
        <button
          onClick={onRequestChange}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Request Changes
        </button>
      )}
    </div>

    {/* Committee Information */}
    <div>
      {committee ? (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              Committee formed on {formatDate(committee.committee.committee_formed_date)}
            </p>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">Committee Members</h4>
              {committee.members?.length > 0 ? (
                <div className="space-y-3">
                  {committee.members.map(member => (
                    <CommitteeMemberCard key={member.id} member={member} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No committee members assigned yet</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-4xl mb-4">⏳</div>
          <h4 className="text-lg font-medium text-yellow-900 mb-2">Committee Formation Pending</h4>
          <p className="text-yellow-700">
            Your GEC committee is being formed by the administration. You will be notified once it's ready.
          </p>
        </div>
      )}
    </div>

    {/* Change Requests History */}
    {changeRequests.length > 0 && (
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Change Requests</h4>
        <div className="space-y-3">
          {changeRequests.slice(0, 5).map(request => (
            <ChangeRequestCard key={request.id} request={request} />
          ))}
        </div>
      </div>
    )}
  </div>
);

// Helper Components
const ActionCard = ({ title, description, icon, action }) => (
  <div 
    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
    onClick={action}
  >
    <div className="text-2xl mb-2">{icon}</div>
    <h4 className="font-medium text-gray-900">{title}</h4>
    <p className="text-sm text-gray-600 mt-1">{description}</p>
  </div>
);

const ProgressItem = ({ label, completed }) => (
  <div className="flex items-center space-x-3">
    <div className={`w-4 h-4 rounded-full ${completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
    <span className={`text-sm ${completed ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
      {label}
    </span>
  </div>
);

const SubmissionCard = ({ submission }) => (
  <div className="p-4 border border-gray-200 rounded-lg">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-medium text-gray-900">{submission.form_name}</h4>
        <p className="text-sm text-gray-600 mt-1">
          Submitted {formatDate(submission.submitted_at)}
        </p>
        {submission.status_message && (
          <p className="text-sm text-blue-600 mt-1 font-medium">
            {submission.status_message}
          </p>
        )}
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.display_status || submission.status)}`}>
        {submission.display_status || submission.status}
      </span>
    </div>
  </div>
);

const PendingFormCard = ({ form, onSelect }) => (
  <div className={`p-4 border rounded-lg ${
    form.isResubmission 
      ? 'border-red-200 bg-red-50' 
      : form.priority === 'high' 
        ? 'border-yellow-200 bg-yellow-50' 
        : 'border-blue-200 bg-blue-50'
  }`}>
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">{form.form_name}</h4>
          {form.isResubmission && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Resubmission Required
            </span>
          )}
          {form.priority === 'high' && !form.isResubmission && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              High Priority
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">{form.description}</p>
        {form.rejectionReason && (
          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm">
            <p className="text-red-800 font-medium">Previous rejection reason:</p>
            <p className="text-red-700">{form.rejectionReason}</p>
          </div>
        )}
        {form.workflow_stage && (
          <p className="text-xs text-gray-500 mt-2">Stage: {form.workflow_stage.replace('_', ' ')}</p>
        )}
      </div>
      <button 
        onClick={() => onSelect(form.form_code)}
        className={`px-4 py-2 text-white rounded-lg transition-colors ${
          form.isResubmission 
            ? 'bg-red-600 hover:bg-red-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {form.isResubmission ? 'Resubmit' : 'Complete'}
      </button>
    </div>
  </div>
);

const SubmissionHistoryCard = ({ submission, onSelect }) => (
  <div className="p-4 border border-gray-200 rounded-lg">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{submission.form_name}</h4>
        <p className="text-sm text-gray-600 mt-1">
          Submitted {formatDate(submission.submitted_at)}
        </p>
        {submission.status_message && (
          <p className="text-sm text-blue-600 mt-1 font-medium">
            {submission.status_message}
          </p>
        )}
        <div className="mt-2 flex items-center space-x-4">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.display_status || submission.status)}`}>
            {submission.display_status || submission.status}
          </span>
          {submission.dprc_approval_status && (
            <span className="text-xs text-gray-500">
              DPRC: {submission.dprc_approval_status}
            </span>
          )}
          {submission.supervisor_approval_status && (
            <span className="text-xs text-gray-500">
              Supervisor: {submission.supervisor_approval_status}
            </span>
          )}
        </div>
      </div>
      <button 
        onClick={() => onSelect(submission.form_code)}
        className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View
      </button>
    </div>
  </div>
);

const CommitteeMemberCard = ({ member }) => (
  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
    <div>
      <h5 className="font-medium text-gray-900">{member.member_name}</h5>
      <p className="text-sm text-gray-600">{member.designation}</p>
      <p className="text-xs text-gray-500">{member.institution}</p>
    </div>
    <div className="text-right">
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
        {member.member_role.replace('_', ' ')}
      </span>
      {member.is_external && (
        <span className="block text-xs text-gray-500 mt-1">External</span>
      )}
    </div>
  </div>
);

const ChangeRequestCard = ({ request }) => (
  <div className="p-3 border border-gray-200 rounded-lg">
    <div className="flex justify-between items-start">
      <div>
        <h5 className="font-medium text-gray-900">{request.request_type.replace('_', ' ')}</h5>
        <p className="text-sm text-gray-600 mt-1">{request.justification}</p>
        <p className="text-xs text-gray-500">
          Requested {formatDate(request.created_at)}
        </p>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.request_status)}`}>
        {request.request_status}
      </span>
    </div>
  </div>
);

// Simple modal for GEC change requests
const GECChangeRequestModal = ({ onClose, onSubmit, currentCommittee }) => {
  const [requestType, setRequestType] = useState('add_member');
  const [justification, setJustification] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      request_type: requestType,
      justification,
      current_committee_id: currentCommittee?.committee?.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Request GEC Committee Change</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Type
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="add_member">Add Member</option>
              <option value="remove_member">Remove Member</option>
              <option value="replace_member">Replace Member</option>
              <option value="change_chairperson">Change Chairperson</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide a detailed justification for this change..."
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard; 