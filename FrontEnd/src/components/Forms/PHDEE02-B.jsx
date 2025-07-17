// PHDEE02-B.jsx
// This file is for the GEC Formation Form (PHDEE02-B)

import React, { useState, useEffect } from 'react';
import { fetchExtendedUserProfile, getAutoFillData, saveFormProgress, loadFormProgress, submitForm } from '../../utils/api';
import './PHDEE02-B.css';

const FORM_STEPS = [
  { id: 0, title: 'Student Information', description: 'Basic student and degree information' },
  { id: 1, title: 'Supervisor Information', description: 'Supervisor and co-supervisor details' },
  { id: 2, title: 'Committee Members', description: 'Graduate Examination Committee members' },
  { id: 3, title: 'Review & Submit', description: 'Review all information and submit' }
];

// A reusable component for the text fields with an underline
const FormInputRow = ({ label, value, onChange, name, fullWidth = false, error, autoFilled = false }) => (
  <div className={`form-input-row ${fullWidth ? 'full-width' : ''}`}>
    <label>{label}</label>
    <input 
      type="text" 
      className={`text-input ${error ? 'error' : ''} ${autoFilled ? 'auto-filled' : ''}`}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      name={name}
    />
    {error && <span className="error-message">{error}</span>}
  </div>
);

// A reusable component for the grid-based fields (like in the tables)
const FormField = ({ label, value, onChange, name, children, colSpan = 1, error, autoFilled = false }) => (
  <div className="form-field" style={{ gridColumn: `span ${colSpan}` }}>
    <div className="field-label">{label}</div>
    {children ? (
      <div className="field-content">{children}</div>
    ) : (
      <>
        <input 
          type="text" 
          className={`text-input ${error ? 'error' : ''} ${autoFilled ? 'auto-filled' : ''}`}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          name={name}
        />
        {error && <span className="error-message">{error}</span>}
      </>
    )}
  </div>
);

// A reusable component for a single committee member block
const CommitteeMember = ({ member, onChange, memberIndex, errors, autoFilledFields }) => (
  <div className="committee-member-grid">
    <FormField 
      label="Name" 
      value={member.name}
      onChange={(name, value) => onChange(`committeeMember${memberIndex}Name`, value)}
      name={`committeeMember${memberIndex}Name`}
      error={errors[`committeeMember${memberIndex}Name`]}
      autoFilled={autoFilledFields.has(`committeeMember${memberIndex}Name`)}
    />
    <FormField 
      label="Department & Institute" 
      value={member.department}
      onChange={(name, value) => onChange(`committeeMember${memberIndex}Department`, value)}
      name={`committeeMember${memberIndex}Department`}
      error={errors[`committeeMember${memberIndex}Department`]}
      autoFilled={autoFilledFields.has(`committeeMember${memberIndex}Department`)}
    />
    <FormField 
      label="Email" 
      value={member.email}
      onChange={(name, value) => onChange(`committeeMember${memberIndex}Email`, value)}
      name={`committeeMember${memberIndex}Email`}
      error={errors[`committeeMember${memberIndex}Email`]}
      autoFilled={autoFilledFields.has(`committeeMember${memberIndex}Email`)}
    />
    <FormField 
      label="Contact #" 
      value={member.contact}
      onChange={(name, value) => onChange(`committeeMember${memberIndex}Contact`, value)}
      name={`committeeMember${memberIndex}Contact`}
      error={errors[`committeeMember${memberIndex}Contact`]}
      autoFilled={autoFilledFields.has(`committeeMember${memberIndex}Contact`)}
    />
    <FormField 
      label="Signature with date:" 
      value={member.signature}
      onChange={(name, value) => onChange(`committeeMember${memberIndex}Signature`, value)}
      name={`committeeMember${memberIndex}Signature`}
      colSpan={2}
      error={errors[`committeeMember${memberIndex}Signature`]}
      autoFilled={autoFilledFields.has(`committeeMember${memberIndex}Signature`)}
    />
  </div>
);

export const PHDEE02B = ({ onClose, onSubmissionComplete, autoFillData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    // Student Information
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    areaOfResearch: '',
    studentSignature: '',
    
    // Supervisor Information
    supervisor: '',
    supervisorSignature: '',
    coSupervisor: '',
    coSupervisorDepartment: '',
    coSupervisorEmail: '',
    coSupervisorContact: '',
    coSupervisorSignature: '',
    
    // Committee Members (3 members)
    committeeMember1Name: '',
    committeeMember1Department: '',
    committeeMember1Email: '',
    committeeMember1Contact: '',
    committeeMember1Signature: '',
    
    committeeMember2Name: '',
    committeeMember2Department: '',
    committeeMember2Email: '',
    committeeMember2Contact: '',
    committeeMember2Signature: '',
    
    committeeMember3Name: '',
    committeeMember3Department: '',
    committeeMember3Email: '',
    committeeMember3Contact: '',
    committeeMember3Signature: '',
    
    // Official Use
    recommended: false,
    notRecommended: false,
    remarks: ''
  });

  const committeeMembers = [
    {
      name: formData.committeeMember1Name,
      department: formData.committeeMember1Department,
      email: formData.committeeMember1Email,
      contact: formData.committeeMember1Contact,
      signature: formData.committeeMember1Signature
    },
    {
      name: formData.committeeMember2Name,
      department: formData.committeeMember2Department,
      email: formData.committeeMember2Email,
      contact: formData.committeeMember2Contact,
      signature: formData.committeeMember2Signature
    },
    {
      name: formData.committeeMember3Name,
      department: formData.committeeMember3Department,
      email: formData.committeeMember3Email,
      contact: formData.committeeMember3Contact,
      signature: formData.committeeMember3Signature
    }
  ];

  // Load user profile and auto-fill data on component mount
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      
      try {
        // Try to load saved progress first
        const progressResult = await loadFormProgress('PHDEE02-B');
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
          
          // Auto-fill additional fields specific to GEC form
          if (profileResult.user.role === 'student') {
            if (profileResult.user.student_id && !updatedFormData.studentId) {
              updatedFormData.studentId = profileResult.user.student_id;
              autoFilledFieldNames.add('studentId');
            }
            if (profileResult.user.research_area && !updatedFormData.areaOfResearch) {
              updatedFormData.areaOfResearch = profileResult.user.research_area;
              autoFilledFieldNames.add('areaOfResearch');
            }
            // Set current academic year/session
            const currentYear = new Date().getFullYear();
            if (!updatedFormData.session) {
              updatedFormData.session = `${currentYear}-${currentYear + 1}`;
              autoFilledFieldNames.add('session');
            }
          }
          
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
        try {
          await saveFormProgress('PHDEE02-B', formData, currentStep, FORM_STEPS.length);
        } catch (error) {
          console.error('Error saving form progress:', error);
        }
      };
      
      const debounceTimer = setTimeout(saveProgress, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData, currentStep, loading]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCheckboxChange = (name, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Handle mutual exclusivity of recommended/not recommended
    if (name === 'recommended' && checked) {
      setFormData(prev => ({
        ...prev,
        notRecommended: false
      }));
    } else if (name === 'notRecommended' && checked) {
      setFormData(prev => ({
        ...prev,
        recommended: false
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0: // Student Information
        if (!formData.degree) newErrors.degree = 'Degree is required';
        if (!formData.session) newErrors.session = 'Session is required';
        if (!formData.studentId) newErrors.studentId = 'Student ID is required';
        if (!formData.studentName) newErrors.studentName = 'Student name is required';
        if (!formData.areaOfResearch) newErrors.areaOfResearch = 'Area of research is required';
        break;
        
      case 1: // Supervisor Information
        if (!formData.supervisor) newErrors.supervisor = 'Supervisor is required';
        break;
        
      case 2: // Committee Members
        committeeMembers.forEach((member, index) => {
          if (!member.name) newErrors[`committeeMember${index + 1}Name`] = 'Name is required';
          if (!member.department) newErrors[`committeeMember${index + 1}Department`] = 'Department is required';
          if (!member.email) newErrors[`committeeMember${index + 1}Email`] = 'Email is required';
          else if (!/\S+@\S+\.\S+/.test(member.email)) {
            newErrors[`committeeMember${index + 1}Email`] = 'Invalid email format';
          }
        });
        break;
        
      case 3: // Review & Submit
        // Final validation
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
      const currentYear = new Date().getFullYear();
      const semester = Math.ceil((new Date().getMonth() + 1) / 6); // 1 for Jan-Jun, 2 for Jul-Dec
      
      const result = await submitForm('PHDEE02-B', formData, semester, `${currentYear}-${currentYear + 1}`);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onSubmissionComplete && onSubmissionComplete(result.data);
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="form-step-content">
            <section className="form-row top-info-row">
              <FormInputRow 
                label="Degree" 
                value={formData.degree}
                onChange={handleInputChange}
                name="degree"
                error={errors.degree}
                autoFilled={autoFilledFields.has('degree')}
              />
              <FormInputRow 
                label="Session" 
                value={formData.session}
                onChange={handleInputChange}
                name="session"
                error={errors.session}
                autoFilled={autoFilledFields.has('session')}
              />
              <FormInputRow 
                label="Student ID" 
                value={formData.studentId}
                onChange={handleInputChange}
                name="studentId"
                error={errors.studentId}
                autoFilled={autoFilledFields.has('studentId')}
              />
            </section>

            <section className="info-section student-info">
              <FormInputRow 
                label="Student Name:" 
                value={formData.studentName}
                onChange={handleInputChange}
                name="studentName"
                fullWidth={true}
                error={errors.studentName}
                autoFilled={autoFilledFields.has('studentName')}
              />
              <FormInputRow 
                label="Area of Research:" 
                value={formData.areaOfResearch}
                onChange={handleInputChange}
                name="areaOfResearch"
                fullWidth={true}
                error={errors.areaOfResearch}
                autoFilled={autoFilledFields.has('areaOfResearch')}
              />
              <FormInputRow 
                label="Student Signature with date:" 
                value={formData.studentSignature}
                onChange={handleInputChange}
                name="studentSignature"
                fullWidth={true}
                error={errors.studentSignature}
                autoFilled={autoFilledFields.has('studentSignature')}
              />
            </section>
          </div>
        );
        
      case 1:
        return (
          <div className="form-step-content">
            <section className="supervisor-grid">
              <FormField 
                label="Supervisor" 
                value={formData.supervisor}
                onChange={handleInputChange}
                name="supervisor"
                error={errors.supervisor}
                autoFilled={autoFilledFields.has('supervisor')}
              />
              <div className="form-field full-span">
                <label>Supervisor's Signature with date:</label>
                <input 
                  type="text" 
                  className={`text-input ${errors.supervisorSignature ? 'error' : ''} ${autoFilledFields.has('supervisorSignature') ? 'auto-filled' : ''}`}
                  value={formData.supervisorSignature}
                  onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
                  name="supervisorSignature"
                />
                {errors.supervisorSignature && <span className="error-message">{errors.supervisorSignature}</span>}
              </div>
            </section>

            <section className="co-supervisor-grid">
              <FormField 
                label="Co-Supervisor (If any)" 
                value={formData.coSupervisor}
                onChange={handleInputChange}
                name="coSupervisor"
                error={errors.coSupervisor}
                autoFilled={autoFilledFields.has('coSupervisor')}
              >
                <input 
                  type="text" 
                  className={`text-input ${autoFilledFields.has('coSupervisor') ? 'auto-filled' : ''}`}
                  placeholder="Shall also be part of GEC"
                  value={formData.coSupervisor}
                  onChange={(e) => handleInputChange('coSupervisor', e.target.value)}
                />
              </FormField>
              <FormField 
                label="Department" 
                value={formData.coSupervisorDepartment}
                onChange={handleInputChange}
                name="coSupervisorDepartment"
                error={errors.coSupervisorDepartment}
                autoFilled={autoFilledFields.has('coSupervisorDepartment')}
              />
              <FormField 
                label="Email" 
                value={formData.coSupervisorEmail}
                onChange={handleInputChange}
                name="coSupervisorEmail"
                error={errors.coSupervisorEmail}
                autoFilled={autoFilledFields.has('coSupervisorEmail')}
              />
              <FormField 
                label="Contact #" 
                value={formData.coSupervisorContact}
                onChange={handleInputChange}
                name="coSupervisorContact"
                error={errors.coSupervisorContact}
                autoFilled={autoFilledFields.has('coSupervisorContact')}
              />
              <FormField 
                label="Co-Supervisor's Signature with date:" 
                value={formData.coSupervisorSignature}
                onChange={handleInputChange}
                name="coSupervisorSignature"
                colSpan={2}
                error={errors.coSupervisorSignature}
                autoFilled={autoFilledFields.has('coSupervisorSignature')}
              />
            </section>
          </div>
        );
        
      case 2:
        return (
          <div className="form-step-content">
            <section className="committee-section">
              <h3>Graduate Examination Committee</h3>
              <div className="committee-members-container">
                {committeeMembers.map((member, index) => (
                  <CommitteeMember 
                    key={index}
                    member={member}
                    memberIndex={index + 1}
                    onChange={handleInputChange}
                    errors={errors}
                    autoFilledFields={autoFilledFields}
                  />
                ))}
              </div>
            </section>
          </div>
        );
        
      case 3:
        return (
          <div className="form-step-content">
            <section className="review-section">
              <h3>Review Information</h3>
              <div className="review-content">
                <div className="review-group">
                  <h4>Student Information</h4>
                  <p><strong>Name:</strong> {formData.studentName}</p>
                  <p><strong>Student ID:</strong> {formData.studentId}</p>
                  <p><strong>Degree:</strong> {formData.degree}</p>
                  <p><strong>Session:</strong> {formData.session}</p>
                  <p><strong>Area of Research:</strong> {formData.areaOfResearch}</p>
                </div>
                
                <div className="review-group">
                  <h4>Supervisor Information</h4>
                  <p><strong>Supervisor:</strong> {formData.supervisor}</p>
                  {formData.coSupervisor && (
                    <>
                      <p><strong>Co-Supervisor:</strong> {formData.coSupervisor}</p>
                      <p><strong>Department:</strong> {formData.coSupervisorDepartment}</p>
                      <p><strong>Email:</strong> {formData.coSupervisorEmail}</p>
                    </>
                  )}
                </div>
                
                <div className="review-group">
                  <h4>Committee Members</h4>
                  {committeeMembers.map((member, index) => (
                    member.name && (
                      <div key={index} className="committee-member-review">
                        <p><strong>Member {index + 1}:</strong> {member.name}</p>
                        <p><strong>Department:</strong> {member.department}</p>
                        <p><strong>Email:</strong> {member.email}</p>
                        <p><strong>Contact:</strong> {member.contact}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </section>

            <section className="official-use-section">
              <div className="official-use-title">(FOR OFFICIAL USE ONLY)</div>

              <div className="recommendation-row">
                <div className="checkbox-container">
                  <input 
                    type="checkbox" 
                    id="recommended" 
                    checked={formData.recommended}
                    onChange={(e) => handleCheckboxChange('recommended', e.target.checked)}
                  />
                  <label htmlFor="recommended">Recommended</label>
                </div>
                <div className="checkbox-container">
                  <input 
                    type="checkbox" 
                    id="not-recommended" 
                    checked={formData.notRecommended}
                    onChange={(e) => handleCheckboxChange('notRecommended', e.target.checked)}
                  />
                  <label htmlFor="not-recommended">Not-Recommended</label>
                </div>
              </div>

              <div className="remarks-container">
                <label>Remarks:</label>
                <textarea 
                  rows="4" 
                  className="text-area"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                ></textarea>
              </div>
            </section>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading form...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h3>Form Submitted Successfully!</h3>
        <p>Your GEC Formation Form has been submitted for review.</p>
      </div>
    );
  }

  return (
    <div className="form-overlay">
      <div className="form-modal">
        <div className="form-modal-header">
          <h2>GEC Formation Form (PHDEE02-B)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="form-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / FORM_STEPS.length) * 100}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            {FORM_STEPS.map((step, index) => (
              <div 
                key={step.id} 
                className={`progress-step ${index <= currentStep ? 'active' : ''}`}
              >
                <div className="step-number">{index + 1}</div>
                <div className="step-info">
                  <div className="step-title">{step.title}</div>
                  <div className="step-description">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-background">
          <div className="form-container">
            <header className="form-header">
              <div className="logo-container">
                <div className="logo-placeholder"></div>
              </div>
              <div className="header-text">
                <h1>INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB</h1>
                <h2>PHD GRADUATE EXAMINATION COMMITTEE - FORMATION FORM</h2>
              </div>
              <div className="form-code">PHDEE02-B Form</div>
            </header>

            {renderStepContent()}
          </div>
        </div>

        <div className="form-modal-footer">
          <div className="form-actions">
            <button 
              className="btn btn-secondary" 
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </button>
            
            {currentStep < FORM_STEPS.length - 1 ? (
              <button 
                className="btn btn-primary" 
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button 
                className="btn btn-success" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            )}
          </div>
          
          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PHDEE02B; 