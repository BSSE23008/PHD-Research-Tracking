import React, { useState, useEffect } from 'react';
import { InputField } from './PHDEE02-A_InputFields';
import { fetchExtendedUserProfile, getAutoFillData, saveFormProgress, loadFormProgress, submitForm } from '../../utils/api';
import './Forms.css';

const FORM_STEPS = [
  { id: 0, title: 'Student Information', description: 'Basic student details and contact information' },
  { id: 1, title: 'Supervisor Information', description: 'Academic supervisor details and contact' },
  { id: 2, title: 'Project Details', description: 'Research project information and timeline' },
  { id: 3, title: 'Additional Information', description: 'Supplementary details and declarations' }
];

export const PHDEE02AForm = ({ onClose, onSubmissionComplete, autoFillData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());
  
  const [formData, setFormData] = useState({
    // Student Information
    studentName: '',
    studentId: '',
    studentEmail: '',
    program: '',
    year: '',
    // Supervisor Information
    supervisorName: '',
    supervisorEmail: '',
    supervisorTitle: '',
    supervisorDepartment: '',
    // Project Details
    projectTitle: '',
    projectType: '',
    estimatedHours: '',
    startDate: '',
    endDate: '',
    projectDescription: '',
    // Additional Information
    previousExperience: '',
    specialRequirements: '',
    ethicsApproval: false,
    dataProtection: false,
    agreementTerms: false
  });

  // Load user profile and auto-fill data on component mount
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      
      try {
        // Try to load saved progress first
        const progressResult = await loadFormProgress('PHDEE02-A');
        if (progressResult.success && progressResult.data) {
          setFormData(prevData => ({ ...prevData, ...progressResult.data.formData }));
          setCurrentStep(progressResult.data.stepNumber || 0);
          console.log('Loaded saved form progress');
        }

        // Fetch user profile for auto-fill
        const profileResult = await fetchExtendedUserProfile();
        if (profileResult.success) {
          const autoFillData = getAutoFillData(profileResult.user);
          const autoFilledFieldNames = new Set();
          
          // Only auto-fill if the field is currently empty
          const updatedFormData = { ...formData };
          Object.entries(autoFillData).forEach(([key, value]) => {
            if (value && (!updatedFormData[key] || updatedFormData[key] === '')) {
              updatedFormData[key] = value;
              autoFilledFieldNames.add(key);
            }
          });
          
          setFormData(updatedFormData);
          setAutoFilledFields(autoFilledFieldNames);
          console.log('Auto-filled fields:', Array.from(autoFilledFieldNames));
        }
      } catch (error) {
        console.error('Error initializing form:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeForm();
  }, []);

  useEffect(() => {
    if (autoFillData) {
      setFormData(prev => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(autoFillData).filter(([key, value]) => value && (!prev[key] || prev[key] === ''))
        )
      }));
    }
  }, [autoFillData]);

  // Save progress automatically when form data changes
  useEffect(() => {
    if (!loading) {
      const saveProgress = async () => {
        await saveFormProgress('PHDEE02-A', formData, currentStep);
      };
      
      const debounceTimer = setTimeout(saveProgress, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData, currentStep, loading]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Student Information
        if (!formData.studentName.trim()) newErrors.studentName = 'Full name is required';
        if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
        if (!formData.studentEmail.trim()) newErrors.studentEmail = 'Email is required';
        if (!formData.program) newErrors.program = 'Program selection is required';
        if (!formData.year) newErrors.year = 'Academic year is required';
        break;

      case 1: // Supervisor Information
        if (!formData.supervisorName.trim()) newErrors.supervisorName = 'Supervisor name is required';
        if (!formData.supervisorEmail.trim()) newErrors.supervisorEmail = 'Supervisor email is required';
        if (!formData.supervisorTitle.trim()) newErrors.supervisorTitle = 'Supervisor title is required';
        if (!formData.supervisorDepartment.trim()) newErrors.supervisorDepartment = 'Department is required';
        break;

      case 2: // Project Details
        if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Project title is required';
        if (!formData.projectType) newErrors.projectType = 'Project type is required';
        if (!formData.estimatedHours) newErrors.estimatedHours = 'Estimated hours is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';
        if (!formData.projectDescription.trim()) newErrors.projectDescription = 'Project description is required';
        break;

      case 3: // Additional Information
        if (!formData.agreementTerms) newErrors.agreementTerms = 'You must agree to the terms and conditions';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, FORM_STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSubmitting(true);
    try {
      const result = await submitForm('PHDEE02-A', formData);
      if (result.success) {
        console.log('Form submitted successfully');
        if (onSubmissionComplete) {
          onSubmissionComplete(result.data);
        }
      } else {
        setErrors({ submit: result.message || 'Failed to submit form' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Network error during submission' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Student Information
        return (
          <div className="form-section">
            <h3 className="form-section-title">Student Information</h3>
            
            <InputField
              label="Full Name"
              value={formData.studentName}
              onChange={(value) => handleInputChange('studentName', value)}
              placeholder="Enter your full name"
              required
              error={errors.studentName}
              disabled={autoFilledFields.has('studentName')}
            />
            
            <div className="form-grid form-grid-2">
              <InputField
                label="Student ID"
                value={formData.studentId}
                onChange={(value) => handleInputChange('studentId', value)}
                placeholder="e.g., S12345678"
                required
                error={errors.studentId}
                disabled={autoFilledFields.has('studentId')}
              />
              
              <InputField
                label="Email Address"
                type="email"
                value={formData.studentEmail}
                onChange={(value) => handleInputChange('studentEmail', value)}
                placeholder="your.email@university.edu"
                required
                error={errors.studentEmail}
                disabled={autoFilledFields.has('studentEmail')}
              />
            </div>
            
            <div className="form-grid form-grid-2">
              <InputField
                label="Program/Course"
                type="select"
                value={formData.program}
                onChange={(value) => handleInputChange('program', value)}
                options={[
                  'Computer Science',
                  'Engineering',
                  'Business Administration',
                  'Psychology',
                  'Biology',
                  'Mathematics',
                  'Physics',
                  'Chemistry',
                  'Other'
                ]}
                required
                error={errors.program}
              />
              
              <InputField
                label="Academic Year"
                type="select"
                value={formData.year}
                onChange={(value) => handleInputChange('year', value)}
                options={['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'PhD']}
                required
                error={errors.year}
              />
            </div>
          </div>
        );

      case 1: // Supervisor Information
        return (
          <div className="form-section">
            <h3 className="form-section-title">Supervisor Information</h3>
            
            <InputField
              label="Supervisor Name"
              value={formData.supervisorName}
              onChange={(value) => handleInputChange('supervisorName', value)}
              placeholder="Enter supervisor's full name"
              required
              error={errors.supervisorName}
              disabled={autoFilledFields.has('supervisorName')}
            />
            
            <div className="form-grid form-grid-2">
              <InputField
                label="Supervisor Email"
                type="email"
                value={formData.supervisorEmail}
                onChange={(value) => handleInputChange('supervisorEmail', value)}
                placeholder="supervisor@university.edu"
                required
                error={errors.supervisorEmail}
                disabled={autoFilledFields.has('supervisorEmail')}
              />
              
              <InputField
                label="Title/Position"
                value={formData.supervisorTitle}
                onChange={(value) => handleInputChange('supervisorTitle', value)}
                placeholder="e.g., Professor, Dr., Associate Professor"
                required
                error={errors.supervisorTitle}
                disabled={autoFilledFields.has('supervisorTitle')}
              />
            </div>
            
            <InputField
              label="Department/Faculty"
              value={formData.supervisorDepartment}
              onChange={(value) => handleInputChange('supervisorDepartment', value)}
              placeholder="Department or Faculty name"
              required
              error={errors.supervisorDepartment}
              disabled={autoFilledFields.has('supervisorDepartment')}
            />
          </div>
        );

      case 2: // Project Details
        return (
          <div className="form-section">
            <h3 className="form-section-title">Project Details</h3>
            
            <InputField
              label="Project Title"
              value={formData.projectTitle}
              onChange={(value) => handleInputChange('projectTitle', value)}
              placeholder="Enter the project title"
              required
              error={errors.projectTitle}
            />
            
            <div className="form-grid form-grid-2">
              <InputField
                label="Project Type"
                type="select"
                value={formData.projectType}
                onChange={(value) => handleInputChange('projectType', value)}
                options={[
                  'Research Project',
                  'Thesis',
                  'Dissertation',
                  'Independent Study',
                  'Capstone Project',
                  'Internship',
                  'Other'
                ]}
                required
                error={errors.projectType}
              />
              
              <InputField
                label="Estimated Hours per Week"
                type="number"
                value={formData.estimatedHours}
                onChange={(value) => handleInputChange('estimatedHours', value)}
                placeholder="e.g., 10"
                required
                error={errors.estimatedHours}
              />
            </div>
            
            <div className="form-grid form-grid-2">
              <InputField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(value) => handleInputChange('startDate', value)}
                required
                error={errors.startDate}
              />
              
              <InputField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(value) => handleInputChange('endDate', value)}
                required
                error={errors.endDate}
              />
            </div>
            
            <InputField
              label="Project Description"
              type="textarea"
              value={formData.projectDescription}
              onChange={(value) => handleInputChange('projectDescription', value)}
              placeholder="Provide a detailed description of the project objectives, methodology, and expected outcomes..."
              required
              error={errors.projectDescription}
            />
          </div>
        );

      case 3: // Additional Information
        return (
          <div className="form-section">
            <h3 className="form-section-title">Additional Information</h3>
            
            <InputField
              label="Previous Research Experience"
              type="textarea"
              value={formData.previousExperience}
              onChange={(value) => handleInputChange('previousExperience', value)}
              placeholder="Describe any previous research experience or relevant background..."
            />
            
            <InputField
              label="Special Requirements or Accommodations"
              type="textarea"
              value={formData.specialRequirements}
              onChange={(value) => handleInputChange('specialRequirements', value)}
              placeholder="Describe any special requirements, equipment needs, or accommodations..."
            />
            
            <div className="form-field">
              <h4 style={{ margin: '1.5rem 0 1rem 0', color: 'var(--color-black)' }}>Declarations</h4>
              
              <InputField
                label="I confirm that this research project has received appropriate ethics approval (if required)"
                type="checkbox"
                value={formData.ethicsApproval}
                onChange={(value) => handleInputChange('ethicsApproval', value)}
              />
              
              <InputField
                label="I understand and agree to comply with data protection and confidentiality requirements"
                type="checkbox"
                value={formData.dataProtection}
                onChange={(value) => handleInputChange('dataProtection', value)}
              />
              
              <InputField
                label="I agree to the terms and conditions of this research project"
                type="checkbox"
                value={formData.agreementTerms}
                onChange={(value) => handleInputChange('agreementTerms', value)}
                required
                error={errors.agreementTerms}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="form-loading">
          <div className="form-spinner"></div>
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-header" style={{ 
        background: 'linear-gradient(135deg, var(--color-brown) 0%, var(--color-black) 100%)',
        color: 'white',
        padding: '2.5rem 3rem',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>PHDEE02-A Form</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Step {currentStep + 1} of {FORM_STEPS.length}: {FORM_STEPS[currentStep].title}
        </p>
        <div className="form-step-indicator" style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.8)' }}>
          <span>{FORM_STEPS[currentStep].description}</span>
        </div>
      </div>

      <div style={{ background: 'white', padding: '2.5rem 3rem', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {renderStepContent()}

        {errors.submit && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-step-navigation">
          <div>
            {currentStep > 0 && (
              <button 
                type="button" 
                onClick={handlePrevious}
                className="form-button form-button-secondary"
              >
                Previous
              </button>
            )}
          </div>

          <div className="form-step-indicator">
            <span>Page {currentStep + 1} of {FORM_STEPS.length}</span>
          </div>

          <div>
            {currentStep < FORM_STEPS.length - 1 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="form-button form-button-primary"
              >
                Next
              </button>
            ) : (
              <button 
                type="button" 
                onClick={handleSubmit}
                disabled={submitting}
                className="form-button form-button-primary"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            )}
          </div>
        </div>

        {autoFilledFields.size > 0 && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem', 
            background: 'rgba(40, 167, 69, 0.1)', 
            borderRadius: '6px',
            fontSize: '0.875rem',
            color: 'var(--color-success)'
          }}>
            ✓ {autoFilledFields.size} field(s) auto-filled from your profile
          </div>
        )}
      </div>
    </div>
  );
};