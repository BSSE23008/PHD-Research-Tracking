// FrontEnd/src/components/Forms/PHDEE04-C.jsx
// Research Candidacy Form

import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE04C = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    registrationNumber: '',
    thesisTitle: '',
    attempt: '', // 'first' or 'second'
    supervisorSignature: '',
    coSupervisorSignature: '',
    gecMember1Signature: '',
    gecMember2Signature: '',
    gecMember3Signature: '',
    recommendation: '', // 'recommended' or 'not-recommended'
    graduateAdvisorSignature: '',
    chairpersonSignature: '',
    remarks: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill form fields from user prop
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        session: user.enrollment_year || prev.session || '',
        studentId: user.student_id || user.studentId || prev.studentId || '',
        studentName: (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : prev.studentName || '',
        registrationNumber: user.registration_number ? user.registration_number.replace('PHDEE', '') : prev.registrationNumber || '',
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Simulate form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Simulate API call delay
      await new Promise(res => setTimeout(res, 1000));
      // Simulate success
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSubmissionComplete) onSubmissionComplete(formData);
      }, 2000);
    } catch (error) {
      // Handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
        <p className="text-lg">Research Candidacy Request has been submitted.</p>
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
        <h2 className="text-base font-bold">RESEARCH CANDIDACY REQUEST FORM</h2>
      </div>

      {/* Student Information */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="inline-block w-20">Degree</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => handleInputChange('degree', e.target.value)}
              className="border-b border-black inline-block w-32 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-20">Session</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.session}
              onChange={(e) => handleInputChange('session', e.target.value)}
              className="border-b border-black inline-block w-32 focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-24">Student ID</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentId}
              onChange={(e) => handleInputChange('studentId', e.target.value)}
              className="border-b border-black inline-block w-32 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Certification Statement */}
      <div className="mb-6">
        <p className="mb-4">
          It is certified that Mr./Ms. 
          <input
            type="text"
            value={formData.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            className="border-b border-black mx-2 w-48 focus:outline-none"
            placeholder="Student Name"
          />, 
          Registration No PHDEE
          <input
            type="text"
            value={formData.registrationNumber}
            onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
            className="border-b border-black mx-2 w-24 focus:outline-none"
            placeholder="Number"
          />, 
          has successfully defended thesis synopsis titled 
          <input
            type="text"
            value={formData.thesisTitle}
            onChange={(e) => handleInputChange('thesisTitle', e.target.value)}
            className="border-b border-black mx-2 w-full mt-2 focus:outline-none"
            placeholder="Thesis Title"
          />
          after:
        </p>
        
        <div className="flex gap-6 mb-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="attempt"
              value="first"
              checked={formData.attempt === 'first'}
              onChange={(e) => handleInputChange('attempt', e.target.value)}
              className="mr-2"
            />
            <span>1st Try</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="attempt"
              value="second"
              checked={formData.attempt === 'second'}
              onChange={(e) => handleInputChange('attempt', e.target.value)}
              className="mr-2"
            />
            <span>2nd Try</span>
          </label>
        </div>
        
        <p className="mb-6">
          Student is permitted to proceed with PhD research.
        </p>
      </div>

      {/* Committee Signatures */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">Committee Member</th>
              <th className="border border-black p-2">Signature</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">Supervisor</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.supervisorSignature}
                  onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                  placeholder="Supervisor's Signature"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Co-Supervisor (if any)</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.coSupervisorSignature}
                  onChange={(e) => handleInputChange('coSupervisorSignature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                  placeholder="Co-Supervisor's Signature"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Committee Member 1</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember1Signature}
                  onChange={(e) => handleInputChange('gecMember1Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                  placeholder="Signature"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Committee Member 2</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember2Signature}
                  onChange={(e) => handleInputChange('gecMember2Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                  placeholder="Signature"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Committee Member 3</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember3Signature}
                  onChange={(e) => handleInputChange('gecMember3Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                  placeholder="Signature"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Use Only Section */}
      <div className="mb-6 border-t-2 border-black pt-4">
        <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
        <div className="mb-4">
          <div className="flex gap-6 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="recommended"
                checked={formData.recommendation === 'recommended'}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                className="mr-2"
              />
              <span>Recommended</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="recommendation"
                value="not-recommended"
                checked={formData.recommendation === 'not-recommended'}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                className="mr-2"
              />
              <span>Not-Recommended</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Remarks:</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            className="border border-black w-full h-20 p-2 focus:outline-none"
          />
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="w-1/2 pr-2">
            <label className="block mb-2">Graduate Program Advisor (Signature & Date Received)</label>
            <input
              type="text"
              value={formData.graduateAdvisorSignature}
              onChange={(e) => handleInputChange('graduateAdvisorSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div className="w-1/2 pl-2">
            <label className="block mb-2">Chairperson EE (Signature & Date)</label>
            <input
              type="text"
              value={formData.chairpersonSignature}
              onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
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
        <strong>PHDEE04-C Form</strong>
      </div>
    </div>
  );
};

export default PHDEE04C