import React, { useState, useEffect } from 'react';
import { InputField } from './PHDEE02-A_InputFields';
import './Forms.css';

export const SupervisorConsentForm = ({ user, formSubmission, onClose, onSubmissionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [consentData, setConsentData] = useState({
    // Student Information (auto-filled from submission)
    studentName: '',
    areaOfResearch: '',
    contactNo: '',
    studentSignatureDate: '',
    
    // Supervisor Information
    supervisorName: '',
    hecApprovedSupervisorRef: '',
    numExistingPhdStudents: 0,
    numExistingMsStudents: 0,
    
    // Designation
    designation: '',
    asSupervisor: '',
    asCoSupervisor: '',
    
    // Contact Information
    email: '',
    contactNumber: '',
    supervisorSignatureDate: '',
    
    // Consent status
    isApproved: false,
    comments: ''
  });

  // Auto-fill data from form submission and user profile
  useEffect(() => {
    if (formSubmission && user) {
      const studentFormData = formSubmission.form_data;
      
      setConsentData(prev => ({
        ...prev,
        // Student info from submission
        studentName: studentFormData.studentName || '',
        areaOfResearch: studentFormData.projectDescription || '',
        contactNo: '', // Would need to add this to student form
        
        // Supervisor info from user profile
        supervisorName: `${user.first_name} ${user.last_name}`,
        designation: user.title || '',
        email: user.email || '',
        contactNumber: '', // Would need to add this to supervisor profile
        
        // Current date for signature
        supervisorSignatureDate: new Date().toISOString().split('T')[0]
      }));
    }
  }, [formSubmission, user]);

  const handleInputChange = (field, value) => {
    setConsentData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!consentData.supervisorName.trim()) newErrors.supervisorName = 'Supervisor name is required';
    if (!consentData.areaOfResearch.trim()) newErrors.areaOfResearch = 'Area of research is required';
    if (!consentData.email.trim()) newErrors.email = 'Email is required';
    if (!consentData.supervisorSignatureDate) newErrors.supervisorSignatureDate = 'Signature date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/supervisor/consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formSubmissionId: formSubmission.id,
          consentData,
          approved: consentData.isApproved
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (onSubmissionComplete) {
          onSubmissionComplete(result.data);
        }
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Failed to submit consent form' });
      }
    } catch (error) {
      console.error('Error submitting consent form:', error);
      setErrors({ submit: 'Network error during submission' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="form-loading">
          <div className="form-spinner"></div>
          <span>Loading consent form...</span>
        </div>
      </div>
    );
  }

  const studentFormData = formSubmission?.form_data || {};

  return (
    <div className="form-container">
      <div className="consent-form-header" style={{ 
        background: 'linear-gradient(135deg, var(--color-brown) 0%, var(--color-black) 100%)',
        color: 'white',
        padding: '2.5rem 3rem',
        borderRadius: '12px 12px 0 0',
        marginBottom: '0'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Supervisor Consent Form</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>
          PHDEE02-A Form - Student: {studentFormData.studentName}
        </p>
      </div>

      <div style={{ background: 'white', padding: '2.5rem 3rem', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        {/* Form Header with University Info */}
        <div className="consent-form-university-header" style={{ 
          textAlign: 'center',
          borderBottom: '2px solid var(--color-brown)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0', fontSize: '1.2rem', color: 'var(--color-black)' }}>
            INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB
          </h3>
          <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: 'var(--color-black)' }}>
            PHD SUPERVISOR CONSENT FORM
          </h4>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Degree _________ Session _________ Student ID _________
          </p>
        </div>

        {/* Student Information Section */}
        <div className="form-section">
          <h3 className="form-section-title">Student Information</h3>
          
          <InputField
            label="Student Name"
            value={consentData.studentName}
            onChange={(value) => handleInputChange('studentName', value)}
            disabled={true}
          />
          
          <InputField
            label="Area of Research"
            type="textarea"
            value={consentData.areaOfResearch}
            onChange={(value) => handleInputChange('areaOfResearch', value)}
            placeholder="Describe the area of research"
            required
            error={errors.areaOfResearch}
          />
          
          <div className="form-grid form-grid-2">
            <InputField
              label="Contact No"
              value={consentData.contactNo}
              onChange={(value) => handleInputChange('contactNo', value)}
              placeholder="Student contact number"
            />
            
            <InputField
              label="Student Signature with Date"
              type="date"
              value={consentData.studentSignatureDate}
              onChange={(value) => handleInputChange('studentSignatureDate', value)}
            />
          </div>
        </div>

        {/* Supervisor Consent Section */}
        <div className="form-section">
          <h3 className="form-section-title">Supervisor Consent</h3>
          
          <div style={{ 
            padding: '1.5rem',
            background: 'var(--color-cream)',
            borderRadius: '8px',
            marginBottom: '2rem',
            fontStyle: 'italic'
          }}>
            <p>I am willing to take Mr / Ms / Mrs _________________________ of PHD program / batch ________________ under my supervision as a PhD student at the Department of Electrical Engineering, Information Technology University of the Punjab.</p>
          </div>

          <div className="supervisor-details-table" style={{
            border: '2px solid var(--color-black)',
            marginBottom: '2rem'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-cream)' }}>
                  <th style={{ border: '1px solid var(--color-black)', padding: '0.75rem', textAlign: 'left' }}>Supervisor</th>
                  <th style={{ border: '1px solid var(--color-black)', padding: '0.75rem', textAlign: 'left' }}>Designation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      value={consentData.supervisorName}
                      onChange={(value) => handleInputChange('supervisorName', value)}
                      required
                      error={errors.supervisorName}
                    />
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      value={consentData.designation}
                      onChange={(value) => handleInputChange('designation', value)}
                      placeholder="e.g., Professor, Associate Professor"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>HEC Approved Supervisor Ref. No.</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      value={consentData.hecApprovedSupervisorRef}
                      onChange={(value) => handleInputChange('hecApprovedSupervisorRef', value)}
                      placeholder="Enter HEC reference number"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>No. of existing PhD students</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span>As Supervisor:</span>
                      <InputField
                        type="number"
                        value={consentData.numExistingPhdStudents}
                        onChange={(value) => handleInputChange('numExistingPhdStudents', parseInt(value) || 0)}
                        style={{ width: '80px' }}
                      />
                      <span>As Co-Supervisor:</span>
                      <InputField
                        type="number"
                        value={consentData.numExistingMsStudents}
                        onChange={(value) => handleInputChange('numExistingMsStudents', parseInt(value) || 0)}
                        style={{ width: '80px' }}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>No. of existing MS students</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span>As Supervisor:</span>
                      <InputField
                        value={consentData.asSupervisor}
                        onChange={(value) => handleInputChange('asSupervisor', value)}
                        style={{ width: '80px' }}
                      />
                      <span>As Co-Supervisor:</span>
                      <InputField
                        value={consentData.asCoSupervisor}
                        onChange={(value) => handleInputChange('asCoSupervisor', value)}
                        style={{ width: '80px' }}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>Email</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      type="email"
                      value={consentData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      required
                      error={errors.email}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>Contact #</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      value={consentData.contactNumber}
                      onChange={(value) => handleInputChange('contactNumber', value)}
                      placeholder="Contact number"
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <strong>Supervisor's Signature with date:</strong>
                  </td>
                  <td style={{ border: '1px solid var(--color-black)', padding: '0.75rem' }}>
                    <InputField
                      type="date"
                      value={consentData.supervisorSignatureDate}
                      onChange={(value) => handleInputChange('supervisorSignatureDate', value)}
                      required
                      error={errors.supervisorSignatureDate}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
              <strong>Note:</strong> A supervisor can supervise no more than 12 graduate students (of which maximum 5 can be PhD students) at a time, as per HEC policy.
            </p>
          </div>
        </div>

        {/* Approval Section */}
        <div className="form-section">
          <h3 className="form-section-title">Approval Decision</h3>
          
          <InputField
            label="I approve this student to proceed with the research under my supervision"
            type="checkbox"
            value={consentData.isApproved}
            onChange={(value) => handleInputChange('isApproved', value)}
          />
          
          <InputField
            label="Additional Comments (Optional)"
            type="textarea"
            value={consentData.comments}
            onChange={(value) => handleInputChange('comments', value)}
            placeholder="Any additional comments or requirements..."
          />
        </div>

        {errors.submit && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="form-step-navigation">
          <div>
            <button 
              type="button" 
              onClick={onClose}
              className="form-button form-button-secondary"
            >
              Cancel
            </button>
          </div>

          <div>
            <button 
              type="button" 
              onClick={handleSubmit}
              disabled={submitting}
              className="form-button form-button-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Consent Form'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 