import React, { useState, useEffect } from 'react';
import { getFormAutoFillData, saveFormProgress, loadFormProgress, submitForm } from '../../utils/api';
import './logo.css';

export const PHDEE02AForm = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    // Student Information
    studentId: '',
    studentName: '',
    studentEmail: '',
    department: '',
    departmentCode: '',
    currentSemester: '',
    academicYear: '',
    researchArea: '',
    
    // Supervisor Information
    supervisorId: '',
    supervisorName: '',
    supervisorEmail: '',
    supervisorDesignation: '',
    
    // Research Details
    researchTopic: '',
    researchObjectives: '',
    methodology: '',
    expectedOutcomes: '',
    
    // Consent Details
    consentDate: '',
    agreementTerms: false,
    primarySupervisorConsent: false,
    studentAgreement: false,
    termsAccepted: false,
    
    // Additional Information
    comments: '',
    studentSignature: '',
    supervisorSignature: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());

  // Load auto-fill data and saved progress on component mount
  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      
      try {
        // Try to load saved progress first
        const progressResult = await loadFormProgress('PHDEE02-A');
        if (progressResult.success && progressResult.data) {
          setFormData(prevData => ({ ...prevData, ...progressResult.data.formData }));
          console.log('Loaded saved form progress');
        }

        // Fetch auto-fill data from backend
        const autoFillResult = await getFormAutoFillData('PHDEE02-A');
        if (autoFillResult.success) {
          const autoFillData = autoFillResult.data;
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

  // Save progress automatically when form data changes
  useEffect(() => {
    if (!loading) {
      const saveProgress = async () => {
        await saveFormProgress('PHDEE02-A', formData, 0);
      };
      
      const debounceTimer = setTimeout(saveProgress, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData, loading]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitForm('PHDEE02-A', formData);
      if (result.success) {
        console.log('Form submitted successfully');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          if (onSubmissionComplete) {
            onSubmissionComplete(result.data);
          }
        }, 2000);
      } else {
        alert(result.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Network error during submission');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <div className="text-blue-600 text-5xl mb-4">⏳</div>
        <h3 className="text-2xl font-bold mb-2">Loading Form...</h3>
        <p className="text-lg">Please wait while we load your information.</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
        <p className="text-lg">Your Supervisor Consent Form has been submitted for review.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white relative">
      {/* Header */}
      <div className="relative text-center mb-6">
        {/* Close Button */}
        {onClose && (
          <button
            className="absolute left-0 top-0 m-2 text-2xl text-gray-500 hover:text-black focus:outline-none"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
        )}
        {/* ITU Logo Placeholder */}
        <div className="logo-placeholder"></div>
        <h1 className="text-lg font-bold mb-2">INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB</h1>
        <h2 className="text-base font-bold">SUPERVISOR CONSENT FORM</h2>
      </div>

      {/* Student Information */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-center">STUDENT INFORMATION</h3>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="inline-block w-24">Student ID:</label>
            <input
              type="text"
              value={formData.studentId}
              readOnly
              disabled
              className="border-b border-black inline-block w-32 focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-20">Session:</label>
            <input
              type="text"
              value={formData.academicYear}
              readOnly
              disabled
              className="border-b border-black inline-block w-32 focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-20">Semester:</label>
            <input
              type="text"
              value={formData.currentSemester}
              readOnly
              disabled
              className="border-b border-black inline-block w-32 focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Student Name:</label>
          <input
            type="text"
            value={formData.studentName}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Student Email:</label>
          <input
            type="email"
            value={formData.studentEmail}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Department:</label>
          <input
            type="text"
            value={formData.department}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Research Area:</label>
          <input
            type="text"
            value={formData.researchArea}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Supervisor Information */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-center">SUPERVISOR INFORMATION</h3>
        
        <div className="mb-4">
          <label className="inline-block w-32">Supervisor Name:</label>
          <input
            type="text"
            value={formData.supervisorName}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Supervisor Email:</label>
          <input
            type="email"
            value={formData.supervisorEmail}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Designation:</label>
          <input
            type="text"
            value={formData.supervisorDesignation}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Research Details */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-center">RESEARCH PROJECT DETAILS</h3>
        
        <div className="mb-4">
          <label className="inline-block w-32">Research Topic:</label>
          <input
            type="text"
            value={formData.researchTopic}
            onChange={(e) => handleInputChange('researchTopic', e.target.value)}
            className="border-b border-black inline-block w-96 focus:outline-none"
            placeholder="Enter your research topic"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Research Objectives:</label>
          <textarea
            value={formData.researchObjectives}
            onChange={(e) => handleInputChange('researchObjectives', e.target.value)}
            className="border border-black w-full h-20 p-2 focus:outline-none mt-2"
            placeholder="Describe the main objectives of your research"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Methodology:</label>
          <textarea
            value={formData.methodology}
            onChange={(e) => handleInputChange('methodology', e.target.value)}
            className="border border-black w-full h-20 p-2 focus:outline-none mt-2"
            placeholder="Describe the methodology you plan to use"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Expected Outcomes:</label>
          <textarea
            value={formData.expectedOutcomes}
            onChange={(e) => handleInputChange('expectedOutcomes', e.target.value)}
            className="border border-black w-full h-20 p-2 focus:outline-none mt-2"
            placeholder="Describe the expected outcomes of your research"
          />
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 border-black my-6"></div>

      {/* Consent Section */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-center">CONSENT AND AGREEMENT</h3>
        
        <div className="mb-4">
          <label className="inline-block w-32">Consent Date:</label>
          <input
            type="date"
            value={formData.consentDate}
            onChange={(e) => handleInputChange('consentDate', e.target.value)}
            className="border-b border-black inline-block w-48 focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="inline-block w-32">Comments:</label>
          <textarea
            value={formData.comments}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            className="border border-black w-full h-16 p-2 focus:outline-none mt-2"
            placeholder="Any additional comments or special conditions"
          />
        </div>

        <div className="mb-6">
          <label className="inline-block w-48">Student Signature with date:</label>
          <input
            type="text"
            value={formData.studentSignature}
            onChange={(e) => handleInputChange('studentSignature', e.target.value)}
            className="border-b border-black inline-block w-80 focus:outline-none"
            placeholder="Student signature and date"
          />
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 border-black my-6"></div>

      {/* Official Use Only */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">(FOR OFFICIAL USE ONLY)</h3>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <div className="mb-2">Student Agreement</div>
              <div className="text-sm">(Check if student agrees to terms)</div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.studentAgreement}
                  onChange={(e) => handleInputChange('studentAgreement', e.target.checked)}
                  className="mr-2"
                />
                I agree to the terms and conditions of supervision
              </label>
            </div>

            <div className="mb-6">
              <div className="mb-2">Terms Accepted</div>
              <div className="text-sm">(Check if terms are accepted)</div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                  className="mr-2"
                />
                I accept all terms and conditions
              </label>
            </div>
          </div>

          <div>
            <div className="mb-6">
              <div className="mb-2">Supervisor Consent</div>
              <div className="text-sm">(Check if supervisor consents)</div>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.primarySupervisorConsent}
                  onChange={(e) => handleInputChange('primarySupervisorConsent', e.target.checked)}
                  className="mr-2"
                />
                I consent to supervise this student
              </label>
            </div>

            <div className="mb-6">
              <div className="mb-2">Supervisor</div>
              <div className="text-sm">Supervisor's Signature with date:</div>
              <input
                type="text"
                value={formData.supervisorSignature}
                onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
                placeholder="Supervisor signature and date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form Footer */}
      <div className="flex justify-end items-center mt-8 gap-4">
        {onClose && (
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Form'}
        </button>
      </div>
      
      <div className="text-right text-sm mt-4">
        <strong>PHDEE02-A Form</strong>
      </div>

      {autoFilledFields.size > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          ✓ {autoFilledFields.size} field(s) auto-filled from your profile
        </div>
      )}
    </div>
  );
};

export default PHDEE02AForm;