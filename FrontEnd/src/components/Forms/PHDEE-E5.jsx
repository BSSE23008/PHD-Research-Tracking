// FrontEnd/src/components/Forms/PHDEE-E5.jsx
// IN HOUSE DEFENSE EVALUATION FORM 

import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E5 = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    session: '',
    studentName: '',
    studentId: '',
    thesisTitle: '',
    committeeMembers: [
      { role: 'Supervisor', recommendation: '', signature: '' },
      { role: 'Co-Supervisor', recommendation: '', signature: '' },
      { role: 'GEC Member 1', recommendation: '', signature: '' },
      { role: 'GEC Member 2', recommendation: '', signature: '' },
      { role: 'GEC Member 3', recommendation: '', signature: '' }
    ],
    remarks: '',
    deanSignature: ''
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
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCommitteeChange = (index, field, value) => {
    const updatedMembers = [...formData.committeeMembers];
    updatedMembers[index] = {
      ...updatedMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      committeeMembers: updatedMembers
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
        <p className="text-lg">In House Defense Evaluation has been submitted.</p>
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
        <h2 className="text-base font-bold">IN HOUSE DEFENSE EVALUATION FORM</h2>
      </div>

      {/* Student Information */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
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
            <label className="inline-block w-32">Student Name</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="border-b border-black inline-block w-64 focus:outline-none"
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

      {/* Thesis Title */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">Thesis Title:</h3>
        <input
          type="text"
          value={formData.thesisTitle}
          onChange={(e) => handleInputChange('thesisTitle', e.target.value)}
          className="border-b border-black w-full focus:outline-none"
        />
      </div>

      {/* Committee Evaluation Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2 w-1/4">Name</th>
              <th className="border border-black p-2 w-1/2">Recommendations</th>
              <th className="border border-black p-2 w-1/4">Signature with date</th>
            </tr>
          </thead>
          <tbody>
            {formData.committeeMembers.map((member, index) => (
              <tr key={index}>
                <td className="border border-black p-2 font-semibold">{member.role}</td>
                <td className="border border-black p-2">
                  <div className="flex justify-around">
                    {['Pass', 'Conditional Pass', 'Fail'].map(option => (
                      <label key={option} className="flex items-center">
                        <input
                          type="radio"
                          name={`recommendation-${index}`}
                          value={option}
                          checked={member.recommendation === option}
                          onChange={(e) => handleCommitteeChange(index, 'recommendation', e.target.value)}
                          className="mr-1"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="border border-black p-2">
                  <input
                    type="text"
                    value={member.signature}
                    onChange={(e) => handleCommitteeChange(index, 'signature', e.target.value)}
                    className="w-full p-1 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Official Use Only */}
      <div className="mb-6 border-t-2 border-black pt-4">
        <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Approved by</label>
          <div className="flex justify-center">
            <div className="w-full">
              <label className="block mb-1">Dean and Chairperson EE (Signature & Date)</label>
              <input
                type="text"
                value={formData.deanSignature}
                onChange={(e) => handleInputChange('deanSignature', e.target.value)}
                className="border-b border-black w-full focus:outline-none"
              />
            </div>
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
        <strong>PHDEE-E5 Form</strong>
      </div>
    </div>
  );
};

export default PHDEE_E5;







