// Enhanced API utilities for PhD Research Tracking System
// Complete integration with backend endpoints

const API_BASE_URL = 'http://localhost:5000/api';

// Get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data: data.data || data };
    } else {
      return { success: false, message: data.message || 'Request failed' };
    }
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { success: false, message: 'Network error' };
  }
};

// ==================== AUTHENTICATION APIs ====================

// User login
export const login = async (email, password) => {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

// User signup
export const signup = async (userData) => {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

// Admin create user (for adding supervisors/GEC members)
export const createUser = async (userData) => {
  return apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (userId, isActive) => {
  return apiRequest(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive })
  });
};

// Fetch user profile data
export const fetchUserProfile = async () => {
  return apiRequest('/auth/profile');
};

// Fetch extended user profile (with workflow progress and complete student data)
export const fetchExtendedUserProfile = async () => {
  const result = await apiRequest('/auth/profile/extended');
  if (!result.success) {
    // Fallback to regular profile
    return await fetchUserProfile();
  }
  return result;
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  return apiRequest('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  return apiRequest('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });
};

// Verify token
export const verifyToken = async () => {
  return apiRequest('/auth/verify');
};

// Get users by role (admin only)
export const getUsersByRole = async (role) => {
  return apiRequest(`/auth/users/${role}`);
};

// ==================== FORM MANAGEMENT APIs ====================

// Get all form types
export const getFormTypes = async () => {
  return apiRequest('/forms/types');
};

// Get available forms for user
export const getAvailableForms = async () => {
  const result = await apiRequest('/forms/available');
  
  if (!result.success) {
    return {
      success: false,
      message: result.message || 'Failed to fetch available forms'
    };
  }

  // Return the data in the expected format
  return {
    success: true,
    data: {
      forms: result.data?.available_forms || [],
      current_stage: result.data?.current_stage,
      current_semester: result.data?.current_semester
    }
  };
};

// Get form schema
export const getFormSchema = async (formCode) => {
  const result = await apiRequest(`/forms/schema/${formCode}`);
  if (result.success) {
    return result;
  }
  
  // Fallback schema for unknown forms
  return {
    success: true,
    data: {
      form_schema: {
        fields: [
          {
            name: 'studentName',
            type: 'text',
            label: 'Student Name',
            required: true
          },
          {
            name: 'studentId',
            type: 'text',
            label: 'Student ID',
            required: true
          }
        ]
      }
    }
  };
};

// Save form progress (auto-save)
export const saveFormProgress = async (formCode, formData, stepNumber = 0, totalSteps = 1) => {
  return apiRequest('/forms/progress', {
    method: 'POST',
    body: JSON.stringify({
      formCode,
      formData,
      stepNumber,
      totalSteps
    })
  });
};

// Load form progress
export const loadFormProgress = async (formCode) => {
  return apiRequest(`/forms/progress/${formCode}`);
};

// Submit form
export const submitForm = async (formCode, formData, semester = null, academicYear = null) => {
  return apiRequest('/forms/submit', {
    method: 'POST',
    body: JSON.stringify({
      formCode,
      formData,
      semester,
      academicYear
    })
  });
};

// Submit form data (alternative format for special cases like onboarding)
export const submitFormData = async (formData) => {
  return apiRequest('/forms/submit-data', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
};

// Get form submissions
export const getFormSubmissions = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/forms/submissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest(endpoint);
};

// Get submission by ID
export const getSubmissionById = async (submissionId) => {
  return apiRequest(`/forms/submissions/${submissionId}`);
};

// Get form submission details for faculty/admin viewing
export const getFormSubmissionDetails = async (submissionId, userType = 'admin') => {
  if (userType === 'faculty') {
    return await apiRequest(`/faculty/forms/submissions/${submissionId}`);
  } else {
    return await apiRequest(`/admin/forms/submissions/${submissionId}`);
  }
};

// Approve/reject form submission
export const approveFormSubmission = async (submissionId, action, comments = '', type = 'admin') => {
  // Use different routes based on the type
  if (type === 'faculty' || type === 'supervisor') {
    return apiRequest(`/faculty/forms/submissions/${submissionId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ comments, type })
    });
  } else {
    return apiRequest(`/forms/submissions/${submissionId}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ comments, type })
    });
  }
};

// Upload form attachment
export const uploadFormAttachment = async (submissionId, file, uploadType = 'supporting_document') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadType', uploadType);

  return apiRequest(`/forms/submissions/${submissionId}/upload`, {
    method: 'POST',
    body: formData,
    headers: {} // Remove content-type to let browser set it for FormData
  });
};

// Get workflow status
export const getWorkflowStatus = async () => {
  return apiRequest('/forms/workflow/status');
};

// Get form analytics
export const getFormAnalytics = async () => {
  return apiRequest('/forms/analytics');
};

// Get dashboard summary for students
export const getDashboardSummary = async () => {
  const result = await apiRequest('/forms/dashboard/summary');
  if (!result.success) {
    // Return fallback data if API call fails
    return {
      success: true,
      data: {
        currentSemester: '1st',
        workflowStage: 'supervision_consent',
        totalFormsSubmitted: 0,
        pendingForms: [],
        recentSubmissions: [],
        unreadNotifications: 0
      }
    };
  }
  return result;
};

// ==================== NOTIFICATION APIs ====================

// Get user notifications
export const getNotifications = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/forms/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return apiRequest(endpoint);
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  return apiRequest(`/forms/notifications/${notificationId}/read`, {
    method: 'POST'
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  return apiRequest('/forms/notifications/read-all', {
    method: 'POST'
  });
};

// ==================== ADMIN APIs ====================

// Get admin dashboard overview
export const getAdminDashboardOverview = async () => {
  return await apiRequest('/admin/dashboard/overview');
};

// Get workflow analytics
export const getWorkflowAnalytics = async () => {
  return await apiRequest('/admin/analytics/workflow');
};

// Get all students
export const getAllStudents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/admin/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiRequest(endpoint);
};

// Get student details
export const getStudentDetails = async (studentId) => {
  return apiRequest(`/admin/students/${studentId}`);
};

// Update student workflow stage
export const updateStudentWorkflowStage = async (studentId, stage, semester = null, academicYear = null) => {
  return apiRequest(`/admin/students/${studentId}/workflow`, {
    method: 'PUT',
    body: JSON.stringify({ stage, semester, academicYear })
  });
};

// Get all users
export const getAllUsers = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/admin/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiRequest(endpoint);
};

// Get pending approvals (for admin)
export const getPendingApprovals = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const endpoint = `/admin/approvals${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiRequest(endpoint);
};

// Get pending approvals for faculty
export const getFacultyPendingApprovals = async (facultyId) => {
  return await apiRequest(`/faculty/${facultyId}/pending-approvals`);
};

// Get comprehensive exams
export const getComprehensiveExams = async () => {
  return await apiRequest('/admin/exams');
};

// Get thesis defenses
export const getThesisDefenses = async () => {
  return await apiRequest('/admin/defenses');
};

// Get notification stats
export const getNotificationStats = async () => {
  return await apiRequest('/admin/notifications/stats');
};

// Get system settings
export const getSystemSettings = async () => {
  return apiRequest('/admin/settings');
};

// Get system logs
export const getSystemLogs = async () => {
  return await apiRequest('/admin/logs');
};

// ==================== UTILITY FUNCTIONS ====================

// Auto-fill form data based on user profile
export const getAutoFillData = (userProfile) => {
  if (!userProfile) return {};

  const autoFillData = {};

  // Common fields that can be auto-filled from user profile
  if (userProfile.first_name && userProfile.last_name) {
    autoFillData.studentName = `${userProfile.first_name} ${userProfile.last_name}`;
  } else if (userProfile.firstName && userProfile.lastName) {
    autoFillData.studentName = `${userProfile.firstName} ${userProfile.lastName}`;
  }

  if (userProfile.email) {
    autoFillData.studentEmail = userProfile.email;
  }

  if (userProfile.student_id || userProfile.studentId) {
    autoFillData.studentId = userProfile.student_id || userProfile.studentId;
  }

  if (userProfile.enrollment_year || userProfile.enrollmentYear) {
    autoFillData.year = userProfile.enrollment_year || userProfile.enrollmentYear;
  }

  if (userProfile.research_area || userProfile.researchArea) {
    autoFillData.program = userProfile.research_area || userProfile.researchArea;
  }

  // Department information
  if (userProfile.department) {
    autoFillData.department = userProfile.department;
  }

  if (userProfile.department_code) {
    autoFillData.departmentCode = userProfile.department_code;
  }

  // Supervisor information
  if (userProfile.primary_supervisor_name) {
    autoFillData.supervisorName = userProfile.primary_supervisor_name;
  }

  if (userProfile.primary_supervisor_email) {
    autoFillData.supervisorEmail = userProfile.primary_supervisor_email;
  }

  if (userProfile.primary_supervisor_designation) {
    autoFillData.supervisorTitle = userProfile.primary_supervisor_designation;
  }

  // Current semester and academic year
  if (userProfile.current_semester) {
    autoFillData.currentSemester = userProfile.current_semester;
  }

  if (userProfile.academic_year) {
    autoFillData.academicYear = userProfile.academic_year;
  }

  // If user is a supervisor, they might be filling for their students
  if (userProfile.role === 'supervisor') {
    if (userProfile.first_name && userProfile.last_name) {
      autoFillData.supervisorName = `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile.firstName && userProfile.lastName) {
      autoFillData.supervisorName = `${userProfile.firstName} ${userProfile.lastName}`;
    }

    if (userProfile.title) {
      autoFillData.supervisorTitle = userProfile.title;
    }

    if (userProfile.department) {
      autoFillData.supervisorDepartment = userProfile.department;
    }

    if (userProfile.email) {
      autoFillData.supervisorEmail = userProfile.email;
    }
  }

  return autoFillData;
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date and time for display
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get status color class
export const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'text-status-pending bg-yellow-50',
    'approved': 'text-status-approved bg-green-50',
    'rejected': 'text-status-rejected bg-red-50',
    'under_review': 'text-status-under_review bg-blue-50',
    'draft': 'text-status-draft bg-gray-50',
    'submitted': 'text-blue-600 bg-blue-50'
  };
  return statusColors[status] || 'text-gray-600 bg-gray-50';
};

// Get workflow stage display name
export const getWorkflowStageDisplayName = (stage) => {
  const stageNames = {
    'admission': 'Admission',
    'supervision_consent': 'Supervision Consent',
    'course_registration': 'Course Registration',
    'gec_formation': 'GEC Formation',
    'comprehensive_exam': 'Comprehensive Exam',
    'synopsis_defense': 'Synopsis Defense',
    'research_candidacy': 'Research Candidacy',
    'thesis_writing': 'Thesis Writing',
    'thesis_evaluation': 'Thesis Evaluation',
    'thesis_defense': 'Thesis Defense',
    'graduation': 'Graduation'
  };
  return stageNames[stage] || stage;
};

// Check if user has permission for action
export const checkPermission = (userRole, action) => {
  const permissions = {
    'admin': ['*'], // Admin can do everything
    'supervisor': ['view_student_forms', 'approve_supervisor_forms', 'view_notifications'],
    'student': ['submit_forms', 'view_own_forms', 'view_notifications']
  };
  
  const userPermissions = permissions[userRole] || [];
  return userPermissions.includes('*') || userPermissions.includes(action);
};

// ==================== FACULTY MANAGEMENT APIs ====================

// Get all faculty members
export const getAllFaculty = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/faculty${queryParams ? `?${queryParams}` : ''}`);
};

// Get faculty by ID
export const getFacultyById = async (id) => {
  return apiRequest(`/faculty/${id}`);
};

// Get faculty by role
export const getFacultyByRole = async (role) => {
  return apiRequest(`/faculty/role/${role}`);
};

// Add new faculty member (Admin only)
export const addFaculty = async (facultyData) => {
  return apiRequest('/faculty', {
    method: 'POST',
    body: JSON.stringify(facultyData)
  });
};

// Update faculty member (Admin only)
export const updateFaculty = async (id, updateData) => {
  return apiRequest(`/faculty/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

// ==================== GEC COMMITTEE APIs ====================

// Get student's GEC committee
export const getMyGECCommittee = async () => {
  const result = await apiRequest('/gec/my-committee');
  if (!result.success) {
    // Return null data if no committee found
    return {
      success: true,
      data: null
    };
  }
  return result;
};

// Get all GEC committees (Admin only)
export const getAllGECCommittees = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/gec${queryParams ? `?${queryParams}` : ''}`);
};

// Get GEC committee by ID
export const getGECCommitteeById = async (id) => {
  return apiRequest(`/gec/${id}`);
};

// Create new GEC committee (Admin only)
export const createGECCommittee = async (committeeData) => {
  return apiRequest('/gec', {
    method: 'POST',
    body: JSON.stringify(committeeData)
  });
};

// Update GEC committee (Admin only)
export const updateGECCommittee = async (id, updateData) => {
  return apiRequest(`/gec/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

// Add member to GEC committee (Admin only)
export const addGECMember = async (committeeId, memberData) => {
  return apiRequest(`/gec/${committeeId}/members`, {
    method: 'POST',
    body: JSON.stringify(memberData)
  });
};

// Remove member from GEC committee (Admin only)
export const removeGECMember = async (committeeId, memberId) => {
  return apiRequest(`/gec/${committeeId}/members/${memberId}`, {
    method: 'DELETE'
  });
};

// Student request for GEC committee change
export const createGECChangeRequest = async (requestData) => {
  return apiRequest('/gec/change-request', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

// Get GEC change requests
export const getGECChangeRequests = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/gec/change-requests/all${queryParams ? `?${queryParams}` : ''}`);
};

// Get student's GEC change requests
export const getMyGECChangeRequests = async () => {
  const result = await apiRequest('/gec/change-requests/my-requests');
  if (!result.success) {
    // Return empty array if no change requests found
    return {
      success: true,
      data: []
    };
  }
  return result;
};

// Approve/Reject GEC change request
export const approveGECChangeRequest = async (requestId, approvalData) => {
  return apiRequest(`/gec/change-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify(approvalData)
  });
};

// Get GEC statistics (Admin only)
export const getGECStatistics = async () => {
  return apiRequest('/gec/reports/statistics');
};

// ==================== DEPARTMENT MANAGEMENT APIs ====================

// Get all departments
export const getAllDepartments = async () => {
  const result = await apiRequest('/admin/departments');
  if (!result.success) {
    // Return fallback departments if API fails
    return {
      success: true,
      data: [
        { id: 1, dept_code: 'CS', dept_name: 'Computer Science', dept_full_name: 'Department of Computer Science' },
        { id: 2, dept_code: 'EE', dept_name: 'Electrical Engineering', dept_full_name: 'Department of Electrical Engineering' },
        { id: 3, dept_code: 'SE', dept_name: 'Software Engineering', dept_full_name: 'Department of Software Engineering' }
      ]
    };
  }
  return result;
};

// Add new department (Admin only)
export const addDepartment = async (deptData) => {
  return apiRequest('/admin/departments', {
    method: 'POST',
    body: JSON.stringify(deptData)
  });
};

// ==================== STUDENT MANAGEMENT APIs ====================

// Get student by ID (Admin only)
export const getStudentById = async (id) => {
  return apiRequest(`/admin/students/${id}`);
};

// Add new student (Admin only)
export const addStudent = async (studentData) => {
  return apiRequest('/admin/students', {
    method: 'POST',
    body: JSON.stringify(studentData)
  });
};

// Update student (Admin only)
export const updateStudent = async (id, updateData) => {
  return apiRequest(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
};

// Assign supervisor to student (Admin only)
export const assignSupervisor = async (assignmentData) => {
  return apiRequest('/admin/students/assign-supervisor', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  });
};

// Assign supervisor during student onboarding (Student only)
export const assignSupervisorOnboarding = async (assignmentData) => {
  return apiRequest('/auth/onboarding/assign-supervisor', {
    method: 'POST',
    body: JSON.stringify(assignmentData)
  });
};

// Update student semester (Admin only)
export const updateStudentSemester = async (updateData) => {
  return apiRequest('/admin/students/update-semester', {
    method: 'POST',
    body: JSON.stringify(updateData)
  });
};

// ==================== FORM APPROVAL APIs ====================

// Reject form submission (Admin only)
export const rejectFormSubmission = async (submissionId, rejectionData) => {
  return apiRequest(`/admin/forms/submissions/${submissionId}/reject`, {
    method: 'POST',
    body: JSON.stringify(rejectionData)
  });
};

// Delete form submission (Admin only)
export const deleteFormSubmission = async (submissionId) => {
  return apiRequest(`/admin/forms/submissions/${submissionId}`, {
    method: 'DELETE'
  });
};

// ==================== ADMIN DASHBOARD APIs ====================

// Get admin dashboard data
export const getAdminDashboard = async () => {
  return apiRequest('/admin/dashboard');
};

// Get detailed statistics (Admin only)
export const getDetailedStatistics = async () => {
  return apiRequest('/admin/stats/detailed');
};

// Process approval (Admin only)
export const processApproval = async (approvalId, actionData) => {
  return apiRequest(`/admin/approvals/${approvalId}/process`, {
    method: 'POST',
    body: JSON.stringify(actionData)
  });
};

// ==================== WORKFLOW & PROGRESS TRACKING APIs ====================

// Get progress report (Admin only)
export const getProgressReport = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return apiRequest(`/admin/reports/progress${queryParams ? `?${queryParams}` : ''}`);
};

// Get workflow statistics
export const getWorkflowStatistics = async () => {
  return apiRequest('/admin/stats/workflow');
};

// ==================== ENHANCED UTILITY FUNCTIONS ====================

// Get available supervisors for assignment
export const getAvailableSupervisors = async (department = null) => {
  const params = department ? { department } : {};
  return getAllFaculty({ ...params, role: 'supervisor' });
};

// Get student's current workflow stage
export const getCurrentWorkflowStage = async (studentId = null) => {
  const endpoint = studentId ? `/workflow/stage/${studentId}` : '/workflow/stage';
  const result = await apiRequest(endpoint);
  if (!result.success) {
    // Return fallback data
    return {
      success: true,
      data: {
        stage: 'supervision_consent',
        progress: 10
      }
    };
  }
  return result;
};

// Check form availability based on workflow stage
export const checkFormAvailability = async (formCode) => {
  return apiRequest(`/forms/availability/${formCode}`);
};

// Get department-wise statistics
export const getDepartmentStatistics = async (departmentId = null) => {
  const endpoint = departmentId 
    ? `/admin/reports/department/${departmentId}` 
    : '/admin/reports/department-summary';
  return apiRequest(endpoint);
}; 