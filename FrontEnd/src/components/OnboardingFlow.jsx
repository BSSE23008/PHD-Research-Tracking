import { useState, useEffect } from 'react';
import { 
  getAllFaculty, 
  getAllDepartments, 
  assignSupervisorOnboarding,
  createGECCommittee,
  submitFormData
} from '../utils/api';

const OnboardingFlow = ({ user, onComplete, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  
  // Form data
  const [onboardingData, setOnboardingData] = useState({
    // Step 1: Personal Information (pre-filled from user)
    studentInfo: {
      student_id: user?.student_id || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      department_id: user?.department_id || '',
      enrollment_date: user?.enrollment_date || '',
      research_area: user?.research_area || ''
    },
    
    // Step 2: Supervisor Selection
    supervisors: {
      primary_supervisor_id: '',
      co_supervisor_id: '',
      supervisor_consent: false
    },
    
    // Step 3: GEC Committee Preferences
    gecPreferences: {
      suggested_members: [],
      research_focus: '',
      special_requirements: ''
    },
    
    // Step 4: Initial Forms
    initialForms: {
      thesis_title_proposal: '',
      research_methodology: '',
      preliminary_literature_review: ''
    }
  });

  const totalSteps = 4;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [deptResult, facultyResult] = await Promise.all([
        getAllDepartments(),
        getAllFaculty()
      ]);

      if (deptResult.success) {
        setDepartments(deptResult.data);
      }

      if (facultyResult.success) {
        setFacultyMembers(facultyResult.data);
        // Filter supervisors
        const supervisors = facultyResult.data.filter(
          faculty => faculty.can_supervise && faculty.is_active
        );
        setAvailableSupervisors(supervisors);
      }
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOnboardingData = (section, field, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        const { student_id, first_name, last_name, email, department_id } = onboardingData.studentInfo;
        return student_id && first_name && last_name && email && department_id;
        
      case 2:
        return onboardingData.supervisors.primary_supervisor_id && 
               onboardingData.supervisors.supervisor_consent;
        
      case 3:
        return onboardingData.gecPreferences.research_focus;
        
      case 4:
        return onboardingData.initialForms.thesis_title_proposal;
        
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setError(null);
    } else {
      setError('Please complete all required fields before proceeding.');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Assign Supervisor
      const supervisorResult = await assignSupervisorOnboarding({
        supervisor_id: onboardingData.supervisors.primary_supervisor_id,
        supervisor_type: 'primary'
      });

      if (!supervisorResult.success) {
        throw new Error('Failed to assign primary supervisor');
      }

      // Step 2: Assign Co-supervisor if selected
      if (onboardingData.supervisors.co_supervisor_id) {
        const coSupervisorResult = await assignSupervisorOnboarding({
          supervisor_id: onboardingData.supervisors.co_supervisor_id,
          supervisor_type: 'co'
        });

        if (!coSupervisorResult.success) {
          throw new Error('Failed to assign co-supervisor');
        }
      }

      // Step 3: Submit Initial Form Data
      const formData = {
        form_type: 'initial_onboarding',
        student_id: user.id,
        data: {
          thesis_title_proposal: onboardingData.initialForms.thesis_title_proposal,
          research_methodology: onboardingData.initialForms.research_methodology,
          research_area: onboardingData.studentInfo.research_area,
          gec_preferences: onboardingData.gecPreferences
        }
      };

      const formResult = await submitFormData(formData);
      
      if (!formResult.success) {
        throw new Error('Failed to submit initial forms');
      }

      // Step 4: Create GEC Committee Request
      const gecData = {
        student_user_id: user.id,
        committee_formed_date: new Date().toISOString().split('T')[0],
        committee_type: 'initial',
        suggested_members: onboardingData.gecPreferences.suggested_members
      };

      const gecResult = await createGECCommittee(gecData);
      
      if (!gecResult.success) {
        console.warn('GEC committee creation will be handled by admin');
      }

      // Complete onboarding
      if (onComplete) {
        onComplete({
          message: 'Onboarding completed successfully! Your supervisors and admin will be notified.',
          nextSteps: [
            'Wait for supervisor confirmation',
            'GEC committee will be formed by admin',
            'You will receive notifications for next required forms'
          ]
        });
      }

    } catch (error) {
      setError(error.message || 'Failed to complete onboarding process');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep 
          data={onboardingData.studentInfo}
          departments={departments}
          onChange={(field, value) => updateOnboardingData('studentInfo', field, value)}
        />;
        
      case 2:
        return <SupervisorSelectionStep 
          data={onboardingData.supervisors}
          supervisors={availableSupervisors}
          departmentId={onboardingData.studentInfo.department_id}
          onChange={(field, value) => updateOnboardingData('supervisors', field, value)}
        />;
        
      case 3:
        return <GECPreferencesStep 
          data={onboardingData.gecPreferences}
          facultyMembers={facultyMembers}
          departmentId={onboardingData.studentInfo.department_id}
          onChange={(field, value) => updateOnboardingData('gecPreferences', field, value)}
        />;
        
      case 4:
        return <InitialFormsStep 
          data={onboardingData.initialForms}
          onChange={(field, value) => updateOnboardingData('initialForms', field, value)}
        />;
        
      default:
        return null;
    }
  };

  if (loading && currentStep === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Student Onboarding</h1>
          <p className="text-gray-600 mt-1">Complete your PhD program setup</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }
              `}>
                {step < currentStep ? '✓' : step}
              </div>
              {step < totalSteps && (
                <div className={`h-1 w-16 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep === totalSteps ? (
              <button
                onClick={handleComplete}
                disabled={loading || !validateStep(currentStep)}
                className={`px-6 py-2 rounded-lg font-medium ${
                  loading || !validateStep(currentStep)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Completing...' : 'Complete Onboarding'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className={`px-6 py-2 rounded-lg font-medium ${
                  !validateStep(currentStep)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const PersonalInfoStep = ({ data, departments, onChange }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Student ID *
        </label>
        <input
          type="text"
          value={data.student_id}
          onChange={(e) => onChange('student_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department *
        </label>
        <select
          value={data.department_id}
          onChange={(e) => onChange('department_id', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select Department</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>
              {dept.dept_name} ({dept.dept_code})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name *
        </label>
        <input
          type="text"
          value={data.first_name}
          onChange={(e) => onChange('first_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name *
        </label>
        <input
          type="text"
          value={data.last_name}
          onChange={(e) => onChange('last_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => onChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enrollment Date
        </label>
        <input
          type="date"
          value={data.enrollment_date}
          onChange={(e) => onChange('enrollment_date', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Research Area
        </label>
        <textarea
          value={data.research_area}
          onChange={(e) => onChange('research_area', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Briefly describe your intended research area..."
        />
      </div>
    </div>
  </div>
);

const SupervisorSelectionStep = ({ data, supervisors, departmentId, onChange }) => {
  const departmentSupervisors = supervisors.filter(
    sup => !departmentId || sup.department_id === parseInt(departmentId)
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Supervisor Selection</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Supervisor *
          </label>
          <select
            value={data.primary_supervisor_id}
            onChange={(e) => onChange('primary_supervisor_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Primary Supervisor</option>
            {departmentSupervisors.map(supervisor => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.first_name} {supervisor.last_name} - {supervisor.designation}
                {supervisor.current_phd_students >= supervisor.max_phd_students && ' (Full Capacity)'}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Your primary supervisor will guide your research and thesis work
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Co-supervisor (Optional)
          </label>
          <select
            value={data.co_supervisor_id}
            onChange={(e) => onChange('co_supervisor_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Co-supervisor (Optional)</option>
            {departmentSupervisors
              .filter(sup => sup.id !== data.primary_supervisor_id)
              .map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.first_name} {supervisor.last_name} - {supervisor.designation}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Co-supervisor can provide additional expertise in your research area
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="supervisor_consent"
              checked={data.supervisor_consent}
              onChange={(e) => onChange('supervisor_consent', e.target.checked)}
              className="mt-1"
              required
            />
            <div>
              <label htmlFor="supervisor_consent" className="text-sm font-medium text-blue-900">
                I understand that supervisor consent is required *
              </label>
              <p className="text-xs text-blue-700 mt-1">
                Your selected supervisors will receive a notification to confirm their agreement to supervise your PhD research.
                The onboarding process will be completed only after supervisor confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GECPreferencesStep = ({ data, facultyMembers, departmentId, onChange }) => {
  const availableFaculty = facultyMembers.filter(faculty => 
    faculty.is_active && (!departmentId || faculty.department_id !== parseInt(departmentId))
  );

  const handleMemberToggle = (facultyId) => {
    const currentMembers = data.suggested_members || [];
    const isSelected = currentMembers.includes(facultyId);
    
    if (isSelected) {
      onChange('suggested_members', currentMembers.filter(id => id !== facultyId));
    } else if (currentMembers.length < 5) {
      onChange('suggested_members', [...currentMembers, facultyId]);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">GEC Committee Preferences</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Focus *
          </label>
          <textarea
            value={data.research_focus}
            onChange={(e) => onChange('research_focus', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your research focus and methodology..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suggested GEC Members (Optional)
          </label>
          <p className="text-sm text-gray-600 mb-4">
            You can suggest up to 5 faculty members for your GEC committee. The final committee will be formed by the administration.
          </p>
          
          <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
            {availableFaculty.map(faculty => (
              <div key={faculty.id} className="flex items-center space-x-3 p-3 border-b border-gray-100 last:border-b-0">
                <input
                  type="checkbox"
                  checked={(data.suggested_members || []).includes(faculty.id)}
                  onChange={() => handleMemberToggle(faculty.id)}
                  disabled={(data.suggested_members || []).length >= 5 && !(data.suggested_members || []).includes(faculty.id)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {faculty.first_name} {faculty.last_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {faculty.designation} - {faculty.department_name}
                  </p>
                  {faculty.specialization && (
                    <p className="text-xs text-gray-500">
                      Specialization: {faculty.specialization}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {(data.suggested_members || []).length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {(data.suggested_members || []).length}/5 members
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requirements
          </label>
          <textarea
            value={data.special_requirements}
            onChange={(e) => onChange('special_requirements', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Any special requirements or considerations for your GEC committee..."
          />
        </div>
      </div>
    </div>
  );
};

const InitialFormsStep = ({ data, onChange }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-900 mb-6">Initial Research Proposal</h2>
    
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thesis Title Proposal *
        </label>
        <input
          type="text"
          value={data.thesis_title_proposal}
          onChange={(e) => onChange('thesis_title_proposal', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Proposed title for your PhD thesis"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Research Methodology
        </label>
        <textarea
          value={data.research_methodology}
          onChange={(e) => onChange('research_methodology', e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe your proposed research methodology and approach..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preliminary Literature Review
        </label>
        <textarea
          value={data.preliminary_literature_review}
          onChange={(e) => onChange('preliminary_literature_review', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Provide a brief overview of relevant literature and research gaps..."
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Next Steps After Onboarding</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your supervisors will be notified for confirmation</li>
          <li>• GEC committee will be formed by the administration</li>
          <li>• You'll receive notifications for required semester forms</li>
          <li>• Access to form submission will be enabled based on your progress</li>
        </ul>
      </div>
    </div>
  </div>
);

export default OnboardingFlow; 