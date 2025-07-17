// FrontEnd/src/components/Forms/PHDEE02-C.jsx
import React, { useState, useEffect } from 'react';

const PHDEE02C = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    areaOfResearch: '',
    studentSignature: '',
    removeMembers: [
      { signature: '', name: '', dept: '', email: '', contact: '' },
      { signature: '', name: '', dept: '', email: '', contact: '' }
    ],
    addMembers: [
      { signature: '', name: '', dept: '', email: '', contact: '' },
      { signature: '', name: '', dept: '', email: '', contact: '' }
    ],
    recommended: '',
    remarks: '',
    gradProgramCoordinator: '',
    gradProgramAdvisor: '',
    chairpersonEE: '',
    supervisor: '',
    coSupervisor: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill form fields from user prop
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        degree: user.degree || prev.degree || '',
        session: user.enrollment_year || prev.enrollment_year || '',
        studentId: user.student_id || user.studentId || prev.studentId || '',
        studentName: (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : prev.studentName || '',
        areaOfResearch: user.research_area || prev.areaOfResearch || '',
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMemberChange = (type, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].map((member, i) => 
        i === index ? { ...member, [field]: value } : member
      )
    }));
  };

  // Simulate form submission (replace with real API call as needed)
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
      // Handle error (show error message if needed)
    } finally {
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
        <p className="text-lg">Your Committee Member Change Form has been submitted for review.</p>
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
        <h2 className="text-base font-bold">PHD COMMITTEE MEMBER CHANGE FORM</h2>
      </div>

      {/* Student Information */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="inline-block w-20">Degree</label>
            <input
              type="text"
              value={"PHD"}
              readOnly
              disabled
              className="border-b border-black inline-block w-32 focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-20">Session</label>
            <input
              type="text"
              value={formData.session}
              readOnly
              disabled
              className="border-b border-black inline-block w-32 focus:outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex-1">
            <label className="inline-block w-24">Student ID</label>
            <input
              type="text"
              value={formData.studentId}
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
          <label className="inline-block w-32">Area of Research:</label>
          <input
            type="text"
            value={formData.areaOfResearch}
            readOnly
            disabled
            className="border-b border-black inline-block w-96 focus:outline-none bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label className="inline-block w-48">Student Signature with date:</label>
          <input
            type="text"
            value={formData.studentSignature}
            onChange={(e) => handleInputChange('studentSignature', e.target.value)}
            className="border-b border-black inline-block w-80 focus:outline-none"
          />
        </div>
      </div>

      {/* Committee Member Changes */}
      <div className="mb-6">
        <h3 className="text-center font-bold mb-4">COMMITTEE MEMBER CHANGES</h3>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Remove Column */}
          <div>
            <h4 className="font-bold text-center mb-4">Committee Member Remove</h4>
            {formData.removeMembers.map((member, index) => (
              <div key={index} className="mb-6 border-b pb-4">
                <div className="mb-2">
                  <span className="font-bold">{index + 1}.</span>
                  <label className="ml-2 inline-block w-20">Signature:</label>
                  <input
                    type="text"
                    value={member.signature}
                    onChange={(e) => handleMemberChange('removeMembers', index, 'signature', e.target.value)}
                    className="border-b border-black inline-block w-32 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Name :</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange('removeMembers', index, 'name', e.target.value)}
                    className="border-b border-black inline-block w-48 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-32">Dept/Organization:</label>
                  <input
                    type="text"
                    value={member.dept}
                    onChange={(e) => handleMemberChange('removeMembers', index, 'dept', e.target.value)}
                    className="border-b border-black inline-block w-40 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Email:</label>
                  <input
                    type="text"
                    value={member.email}
                    onChange={(e) => handleMemberChange('removeMembers', index, 'email', e.target.value)}
                    className="border-b border-black inline-block w-48 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Contact #</label>
                  <input
                    type="text"
                    value={member.contact}
                    onChange={(e) => handleMemberChange('removeMembers', index, 'contact', e.target.value)}
                    className="border-b border-black inline-block w-32 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add Column */}
          <div>
            <h4 className="font-bold text-center mb-4">Committee Member Add</h4>
            {formData.addMembers.map((member, index) => (
              <div key={index} className="mb-6 border-b pb-4">
                <div className="mb-2">
                  <label className="inline-block w-20">Signature:</label>
                  <input
                    type="text"
                    value={member.signature}
                    onChange={(e) => handleMemberChange('addMembers', index, 'signature', e.target.value)}
                    className="border-b border-black inline-block w-32 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Name :</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange('addMembers', index, 'name', e.target.value)}
                    className="border-b border-black inline-block w-48 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-32">Dept/Organization:</label>
                  <input
                    type="text"
                    value={member.dept}
                    onChange={(e) => handleMemberChange('addMembers', index, 'dept', e.target.value)}
                    className="border-b border-black inline-block w-40 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Email:</label>
                  <input
                    type="text"
                    value={member.email}
                    onChange={(e) => handleMemberChange('addMembers', index, 'email', e.target.value)}
                    className="border-b border-black inline-block w-48 focus:outline-none"
                  />
                </div>
                <div className="mb-2">
                  <label className="inline-block w-20">Contact #</label>
                  <input
                    type="text"
                    value={member.contact}
                    onChange={(e) => handleMemberChange('addMembers', index, 'contact', e.target.value)}
                    className="border-b border-black inline-block w-32 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm mt-4">
          <strong>Note:</strong> Signatures of those to be deleted and added are required.
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 border-black my-6"></div>

      {/* Official Use Only */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">(FOR OFFICIAL USE ONLY)</h3>
        
        <div className="mb-4">
          <label className="inline-block mr-4">
            <input
              type="radio"
              name="recommended"
              value="recommended"
              checked={formData.recommended === 'recommended'}
              onChange={(e) => handleInputChange('recommended', e.target.value)}
              className="mr-1"
            />
            Recommended
          </label>
          <label className="inline-block">
            <input
              type="radio"
              name="recommended"
              value="not-recommended"
              checked={formData.recommended === 'not-recommended'}
              onChange={(e) => handleInputChange('recommended', e.target.value)}
              className="mr-1"
            />
            Not-Recommended
          </label>
        </div>

        <div className="mb-4">
          <label className="inline-block w-20">Remarks:</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => handleInputChange('remarks', e.target.value)}
            className="border border-black w-full h-16 p-2 focus:outline-none"
          />
        </div>

        {/* Signature Fields */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <div className="mb-2">Graduate Program Coordinator</div>
              <div className="text-sm">(Signature & Date)</div>
              <input
                type="text"
                value={formData.gradProgramCoordinator}
                onChange={(e) => handleInputChange('gradProgramCoordinator', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="mb-2">Graduate Program Advisor</div>
              <div className="text-sm">(Signature & Date)</div>
              <input
                type="text"
                value={formData.gradProgramAdvisor}
                onChange={(e) => handleInputChange('gradProgramAdvisor', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="mb-2">Chairperson EE</div>
              <div className="text-sm">(Signature & Date)</div>
              <input
                type="text"
                value={formData.chairpersonEE}
                onChange={(e) => handleInputChange('chairpersonEE', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>
          </div>

          <div>
            <div className="mb-6">
              <div className="mb-2">Supervisor</div>
              <div className="text-sm">Supervisor's Signature with date:</div>
              <input
                type="text"
                value={formData.supervisor}
                onChange={(e) => handleInputChange('supervisor', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="mb-2">Co- Supervisor</div>
              <div className="text-sm">Co-Supervisor's Signature with date:</div>
              <input
                type="text"
                value={formData.coSupervisor}
                onChange={(e) => handleInputChange('coSupervisor', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
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
        <strong>PhDEE02-C Form</strong>
      </div>
    </div>
  );
};

export default PHDEE02C;