import { useState, useEffect } from 'react';
import { 
  getFormSubmissions,
  submitFormData,
  checkFormAvailability,
  getCurrentWorkflowStage,
  getMyGECCommittee,
  getAllDepartments,
  formatDate,
  getStatusColor
} from '../utils/api';

// Import existing form components
import PHDEE_E1 from './forms/PHDEE-E1';
import PHDEE_E2_A from './forms/PHDEE-E2-A';
import PHDEE_E2_B from './forms/PHDEE-E2-B';
import PHDEE_E3 from './forms/PHDEE-E3';
import PHDEE_E4 from './forms/PHDEE-E4';
import PHDEE_E5 from './forms/PHDEE-E5';
import PHDEE02_A from './forms/PHDEE02-A';
import PHDEE02_B from './forms/PHDEE02-B';
import PHDEE02_C from './forms/PHDEE02-C';
import PHDEE03 from './forms/PHDEE03';
import PHDEE04_A from './forms/PHDEE04-A';
import PHDEE04_B from './forms/PHDEE04-B';
import PHDEE04_C from './forms/PHDEE04-C';
import PHDEE05_A from './forms/PHDEE05-A';
import SupervisorConsentForm from './forms/SupervisorConsentForm';
import ResearchProposal from './forms/ResearchProposal';

const DynamicFormRenderer = ({ user, selectedFormCode, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);
  const [currentStage, setCurrentStage] = useState('');
  const [formData, setFormData] = useState({});
  const [submissions, setSubmissions] = useState([]);
  const [gecCommittee, setGecCommittee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);

  // Form component mapping
  const formComponents = {
    'PHDEE-E1': PHDEE_E1,
    'PHDEE-E2-A': PHDEE_E2_A,
    'PHDEE-E2-B': PHDEE_E2_B,
    'PHDEE-E3': PHDEE_E3,
    'PHDEE-E4': PHDEE_E4,
    'PHDEE-E5': PHDEE_E5,
    'PHDEE02-A': PHDEE02_A,
    'PHDEE02-B': PHDEE02_B,
    'PHDEE02-C': PHDEE02_C,
    'PHDEE03': PHDEE03,
    'PHDEE04-A': PHDEE04_A,
    'PHDEE04-B': PHDEE04_B,
    'PHDEE04-C': PHDEE04_C,
    'PHDEE05-A': PHDEE05_A,
    'SupervisorConsent': SupervisorConsentForm,
    'RESEARCH_PROPOSAL': ResearchProposal
  };

  // Form metadata with workflow stage requirements
  const formMetadata = {
    'PHDEE-E1': {
      name: 'PhD Application Form (E1)',
      description: 'Initial application for PhD program',
      stage: 'admission',
      semester: ['1st'],
      category: 'admission',
      required: true,
      deadline: null
    },
    'PHDEE-E2-A': {
      name: 'Course Registration Form (E2-A)',
      description: 'Register for courses in current semester',
      stage: 'course_registration',
      semester: ['1st', '2nd', '3rd', '4th'],
      category: 'academic',
      required: true,
      deadline: 'semester_start'
    },
    'PHDEE-E2-B': {
      name: 'Research Progress Report (E2-B)',
      description: 'Semester research progress report',
      stage: 'research_candidacy',
      semester: ['2nd', '3rd', '4th', '5th', '6th'],
      category: 'research',
      required: true,
      deadline: 'semester_end'
    },
    'PHDEE-E3': {
      name: 'Comprehensive Exam Application (E3)',
      description: 'Apply for comprehensive examination',
      stage: 'comprehensive_exam',
      semester: ['4th', '5th'],
      category: 'examination',
      required: true,
      deadline: null
    },
    'PHDEE-E4': {
      name: 'Synopsis Defense Form (E4)',
      description: 'Apply for synopsis defense',
      stage: 'synopsis_defense',
      semester: ['5th', '6th'],
      category: 'defense',
      required: true,
      deadline: null
    },
    'PHDEE-E5': {
      name: 'Thesis Defense Application (E5)',
      description: 'Apply for final thesis defense',
      stage: 'thesis_defense',
      semester: ['6th', '7th', '8th'],
      category: 'defense',
      required: true,
      deadline: null
    },
    'PHDEE02-A': {
      name: 'Supervisor Assignment Request',
      description: 'Request supervisor assignment or change',
      stage: 'supervision_consent',
      semester: ['1st'],
      category: 'supervision',
      required: false,
      deadline: null
    },
    'PHDEE02-B': {
      name: 'Research Proposal Submission',
      description: 'Submit detailed research proposal',
      stage: 'gec_formation',
      semester: ['2nd', '3rd'],
      category: 'research',
      required: true,
      deadline: null
    },
    'PHDEE02-C': {
      name: 'GEC Committee Formation Request',
      description: 'Request GEC committee formation',
      stage: 'gec_formation',
      semester: ['2nd'],
      category: 'committee',
      required: true,
      deadline: null
    },
    'SupervisorConsent': {
      name: 'Supervisor Consent Form',
      description: 'Supervisor consent for PhD supervision',
      stage: 'supervision_consent',
      semester: ['1st'],
      category: 'supervision',
      required: true,
      deadline: null
    },
    'RESEARCH_PROPOSAL': {
      name: 'Research Proposal',
      description: 'Submit your initial research proposal for admin and supervisor approval',
      stage: 'research_candidacy',
      semester: ['1st', '2nd'],
      category: 'research',
      required: true,
      deadline: null
    }
  };

  useEffect(() => {
    loadFormData();
  }, [user]);

  useEffect(() => {
    if (selectedFormCode && formComponents[selectedFormCode]) {
      setSelectedForm(selectedFormCode);
    }
  }, [selectedFormCode]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      const [
        stageResult,
        submissionsResult,
        gecResult,
        departmentsResult
      ] = await Promise.all([
        getCurrentWorkflowStage(),
        getFormSubmissions(),
        getMyGECCommittee(),
        getAllDepartments()
      ]);

      if (stageResult.success) {
        setCurrentStage(stageResult.data.stage);
      }

      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data.submissions || []);
      }

      if (gecResult.success) {
        setGecCommittee(gecResult.data);
      }

      if (departmentsResult.success) {
        setDepartments(departmentsResult.data || []);
      }

      // Determine available forms based on current stage and semester
      const available = await determineAvailableForms();
      setAvailableForms(available);

      // Pre-fill form data
      const prefilledData = preparePrefilledData();
      setFormData(prefilledData);

    } catch (error) {
      setError('Failed to load form data');
      console.error('Form loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineAvailableForms = async () => {
    const userSemester = user?.current_semester || '1st';
    const userStage = currentStage || 'admission';
    const available = [];

    for (const [formCode, metadata] of Object.entries(formMetadata)) {
      // Check if form is available for current semester
      const semesterMatch = metadata.semester.includes(userSemester) || 
                           metadata.semester.includes(userSemester.replace(' Year', ''));
      
      // Check if form is available for current stage
      const stageMatch = metadata.stage === userStage || 
                        (userStage === 'admission' && metadata.stage === 'supervision_consent') ||
                        (userStage === 'supervision_consent' && metadata.stage === 'gec_formation');

      // Check if form was already submitted
      const alreadySubmitted = submissions.some(sub => 
        sub.form_code === formCode && sub.status !== 'rejected'
      );

      // Special logic for different forms
      let isAvailable = false;
      
      if (formCode === 'SupervisorConsent' && !user?.primary_supervisor_id) {
        isAvailable = true; // Always available if no supervisor assigned
      } else if (formCode === 'PHDEE02-C' && !gecCommittee) {
        isAvailable = semesterMatch; // Available if no GEC committee formed
      } else if (semesterMatch && (stageMatch || metadata.required)) {
        isAvailable = !alreadySubmitted;
      }

      if (isAvailable) {
        try {
          const availabilityResult = await checkFormAvailability(formCode);
          if (availabilityResult.success && availabilityResult.data.available) {
            available.push({
              code: formCode,
              ...metadata,
              component: formComponents[formCode],
              submissionStatus: getFormSubmissionStatus(formCode)
            });
          }
        } catch (error) {
          // If check fails, assume available
          available.push({
            code: formCode,
            ...metadata,
            component: formComponents[formCode],
            submissionStatus: getFormSubmissionStatus(formCode)
          });
        }
      }
    }

    return available.sort((a, b) => {
      // Sort by required first, then by category
      if (a.required !== b.required) return b.required - a.required;
      return a.category.localeCompare(b.category);
    });
  };

  const getFormSubmissionStatus = (formCode) => {
    const submission = submissions.find(sub => sub.form_code === formCode);
    if (!submission) return null;
    
    return {
      status: submission.status,
      submitted_at: submission.submitted_at,
      comments: submission.comments,
      approval_stage: submission.current_approval_stage
    };
  };

  const preparePrefilledData = () => {
    const department = departments.find(d => d.id === user?.department_id);
    
    return {
      // Student Information
      student_id: user?.student_id || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      
      // Academic Information
      department_id: user?.department_id || '',
      department_name: department?.dept_name || '',
      department_code: department?.dept_code || '',
      current_semester: user?.current_semester || '',
      academic_year: user?.academic_year || new Date().getFullYear(),
      enrollment_date: user?.enrollment_date || '',
      enrollment_year: user?.enrollment_year || new Date().getFullYear(),
      
      // Research Information
      research_area: user?.research_area || '',
      primary_supervisor_id: user?.primary_supervisor_id || '',
      co_supervisor_id: user?.co_supervisor_id || '',
      
      // GEC Information
      gec_committee: gecCommittee || null,
      
      // System Information
      submission_date: new Date().toISOString().split('T')[0],
      workflow_stage: currentStage
    };
  };

  const handleFormSubmission = async (formCode, data) => {
    setLoading(true);
    try {
      const submissionData = {
        form_code: formCode,
        form_data: {
          ...formData,
          ...data,
          digital_signature: {
            student_name: `${user?.first_name} ${user?.last_name}`,
            student_id: user?.student_id,
            timestamp: new Date().toISOString(),
            ip_address: 'client_ip' // This would be captured from the client
          }
        }
      };

      const result = await submitFormData(submissionData);
      
      if (result.success) {
        alert('Form submitted successfully!');
        await loadFormData(); // Refresh data
        setSelectedForm(null); // Return to form list
      } else {
        throw new Error(result.message || 'Form submission failed');
      }
    } catch (error) {
      alert('Error submitting form: ' + error.message);
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (selectedForm && formComponents[selectedForm]) {
    const FormComponent = formComponents[selectedForm];
    const formMeta = formMetadata[selectedForm];
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Form Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setSelectedForm(null)}
                  className="text-blue-600 hover:text-blue-800 font-medium mb-2"
                >
                  ← Back to Forms
                </button>
                <h1 className="text-2xl font-bold text-gray-900">{formMeta.name}</h1>
                <p className="text-gray-600">{formMeta.description}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600">Current Semester: {user?.current_semester}</span>
                <br />
                <span className="text-sm text-gray-600">Stage: {currentStage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Component */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <FormComponent
            user={user}
            prefilledData={formData}
            gecCommittee={gecCommittee}
            onSubmit={(data) => handleFormSubmission(selectedForm, data)}
            onCancel={() => setSelectedForm(null)}
            readOnly={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Academic Forms</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-gray-600">
                  Current Semester: <span className="font-medium">{user?.current_semester}</span>
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  Workflow Stage: <span className="font-medium">{currentStage}</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Forms Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Forms */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Forms</h2>
            
            {availableForms.length > 0 ? (
              <div className="space-y-4">
                {availableForms.map(form => (
                  <FormCard
                    key={form.code}
                    form={form}
                    onSelect={() => setSelectedForm(form.code)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms Available</h3>
                <p className="text-gray-600 mb-4">
                  No forms are currently available for your semester and workflow stage.
                </p>
                <p className="text-sm text-gray-500">
                  New forms will become available as you progress through the program.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Summary</h3>
              <div className="space-y-3">
                <ProgressItem
                  label="Total Forms Submitted"
                  value={submissions.length}
                  icon="📝"
                />
                <ProgressItem
                  label="Approved Forms"
                  value={submissions.filter(s => s.status === 'approved').length}
                  icon="✅"
                />
                <ProgressItem
                  label="Pending Approvals"
                  value={submissions.filter(s => s.status === 'under_review').length}
                  icon="⏳"
                />
                <ProgressItem
                  label="GEC Committee"
                  value={gecCommittee ? 'Formed' : 'Pending'}
                  icon="👥"
                />
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Submissions</h3>
              {submissions.slice(0, 5).map(submission => (
                <RecentSubmissionItem
                  key={submission.id}
                  submission={submission}
                />
              ))}
              {submissions.length === 0 && (
                <p className="text-gray-500 text-sm">No submissions yet</p>
              )}
            </div>

            {/* Help & Support */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-4">
                Contact your supervisor or the graduate office for assistance with form submissions.
              </p>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const FormCard = ({ form, onSelect }) => {
  const statusColor = form.submissionStatus 
    ? getStatusColor(form.submissionStatus.status)
    : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
            {form.required && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                Required
              </span>
            )}
          </div>
          <p className="text-gray-600 mb-3">{form.description}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Category: {form.category}</span>
            <span>Stage: {form.stage}</span>
            {form.deadline && <span>Deadline: {form.deadline}</span>}
          </div>
        </div>
        
        {form.submissionStatus && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor}`}>
            {form.submissionStatus.status}
          </span>
        )}
      </div>

      {form.submissionStatus ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Last submitted: {formatDate(form.submissionStatus.submitted_at)}
          </p>
          {form.submissionStatus.comments && (
            <p className="text-sm text-gray-500 italic">
              "{form.submissionStatus.comments}"
            </p>
          )}
          {form.submissionStatus.status === 'rejected' && (
            <button
              onClick={onSelect}
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Resubmit Form
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={onSelect}
          className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Submit Form
        </button>
      )}
    </div>
  );
};

const ProgressItem = ({ label, value, icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <span>{icon}</span>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
);

const RecentSubmissionItem = ({ submission }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
    <div>
      <p className="text-sm font-medium text-gray-900">{submission.form_name}</p>
      <p className="text-xs text-gray-500">{formatDate(submission.submitted_at)}</p>
    </div>
    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(submission.status)}`}>
      {submission.status}
    </span>
  </div>
);

export default DynamicFormRenderer; 