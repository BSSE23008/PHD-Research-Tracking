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

// Fetch extended user profile (with all fields)
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
  
  // If backend returns empty or no forms, provide default forms
  if (!result.success || !result.data || result.data.length === 0) {
    return {
      success: true,
      data: [
        {
          id: 1,
          form_code: 'PHDEE02-A',
          form_name: 'Supervisor Consent Form',
          description: 'Form for obtaining supervisor consent for PhD research',
          workflow_stage: 'supervision_consent',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          form_code: 'PHDEE02-C',
          form_name: 'GEC Formation Form',
          description: 'Form for Graduate Examination Committee formation',
          workflow_stage: 'gec_formation',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          form_code: 'PHDEE03',
          form_name: 'Comprehensive Examination Request Form',
          description: 'Form to request comprehensive examination',
          workflow_stage: 'comprehensive_exam',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          form_code: 'PHDEE04-A',
          form_name: 'Synopsis Defense Request Form',
          description: 'Form to request synopsis defense',
          workflow_stage: 'synopsis_defense',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 5,
          form_code: 'PHDEE05-A',
          form_name: 'Thesis Defense Request Form',
          description: 'Form to request thesis defense',
          workflow_stage: 'thesis_defense',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]
    };
  }
  
  return result;
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

// Approve/reject form submission
export const approveFormSubmission = async (submissionId, action, comments = '', type = 'admin') => {
  return apiRequest(`/forms/submissions/${submissionId}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ comments, type })
  });
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

// Get dashboard summary
export const getDashboardSummary = async () => {
  return apiRequest('/forms/dashboard/summary');
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

// Get pending approvals
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

  if (userProfile.advisor_email || userProfile.advisorEmail) {
    autoFillData.supervisorEmail = userProfile.advisor_email || userProfile.advisorEmail;
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