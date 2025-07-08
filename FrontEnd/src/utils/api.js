// API utilities for form auto-fill and user data management

const API_BASE_URL = 'http://localhost:5000/api';

// Get authorization header
const getAuthHeader = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Fetch user profile data
export const fetchUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data.user };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message };
    }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    return { success: false, message: 'Network error while fetching profile' };
  }
};

// Fetch extended user profile (with all fields)
export const fetchExtendedUserProfile = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile/extended`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data.user };
    } else {
      // If extended endpoint doesn't exist, fallback to regular profile
      return await fetchUserProfile();
    }
  } catch (error) {
    console.error('Failed to fetch extended user profile:', error);
    // Fallback to regular profile
    return await fetchUserProfile();
  }
};

// Auto-fill form data based on user profile
export const getAutoFillData = (userProfile, formType = 'PHDEE02-A') => {
  if (!userProfile) return {};

  const autoFillData = {};

  // Common fields that can be auto-filled from user profile
  if (userProfile.firstName && userProfile.lastName) {
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

// Save form progress
export const saveFormProgress = async (formType, formData, stepNumber = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forms/save-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        formType,
        formData,
        stepNumber,
        savedAt: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message };
    }
  } catch (error) {
    console.error('Failed to save form progress:', error);
    return { success: false, message: 'Network error while saving progress' };
  }
};

// Load form progress
export const loadFormProgress = async (formType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forms/load-progress?formType=${formType}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.formData };
    } else {
      return { success: false, message: 'No saved progress found' };
    }
  } catch (error) {
    console.error('Failed to load form progress:', error);
    return { success: false, message: 'Network error while loading progress' };
  }
};

// Submit completed form
export const submitForm = async (formType, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/forms/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        formType,
        formData,
        submittedAt: new Date().toISOString()
      })
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message };
    }
  } catch (error) {
    console.error('Failed to submit form:', error);
    return { success: false, message: 'Network error while submitting form' };
  }
};

// Get form submissions history
export const getFormSubmissions = async (formType = null) => {
  try {
    const url = formType 
      ? `${API_BASE_URL}/forms/submissions?formType=${formType}`
      : `${API_BASE_URL}/forms/submissions`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, submissions: data.submissions };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.message };
    }
  } catch (error) {
    console.error('Failed to fetch form submissions:', error);
    return { success: false, message: 'Network error while fetching submissions' };
  }
}; 