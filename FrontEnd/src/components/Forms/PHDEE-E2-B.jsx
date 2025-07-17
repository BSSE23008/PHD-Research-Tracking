// FrontEnd/src/components/Forms/PHDEE-E2-B.jsx
import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E2_B = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    session: '',
    studentName: '',
    studentId: '',
    recommendation: '', // 'pass', 'conditional-pass', 'fail'
    backgroundModification: { recommended: false, required: false },
    scopeModification: { recommended: false, required: false },
    additionalCourses: { recommended: false, required: false },
    redoWrittenSections: { recommended: false, required: false },
    redoOralPresentation: { recommended: false, required: false },
    modificationsDetails: '',
    supervisorSignature: '',
    coSupervisorSignature: '',
    gecMember1Signature: '',
    gecMember2Signature: '',
    gecMember3Signature: '',
    completionDate: '',
    chairpersonSignature: '',
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

  const handleCheckboxChange = (field, subField, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subField]: value
      }
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
        <p className="text-lg">Synopsis Defence Full Committee Report has been submitted.</p>
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
        <h2 className="text-base font-bold">SYNOPSIS DEFENCE FULL COMMITTEE REPORT</h2>
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

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Recommendations</h3>
        <div className="flex gap-8 mb-6">
          <label className="flex items-center">
            <input
              type="radio"
              name="recommendation"
              value="pass"
              checked={formData.recommendation === 'pass'}
              onChange={(e) => handleInputChange('recommendation', e.target.value)}
              className="mr-2"
            />
            <span>Pass</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="recommendation"
              value="conditional-pass"
              checked={formData.recommendation === 'conditional-pass'}
              onChange={(e) => handleInputChange('recommendation', e.target.value)}
              className="mr-2"
            />
            <span>Conditional Pass</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="recommendation"
              value="fail"
              checked={formData.recommendation === 'fail'}
              onChange={(e) => handleInputChange('recommendation', e.target.value)}
              className="mr-2"
            />
            <span>Fail</span>
          </label>
        </div>
      </div>

      {/* Modifications Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">Modifications</th>
              <th className="border border-black p-2">Modifications</th>
              <th className="border border-black p-2">Details (Attach additional page if required)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">Modify background and/or literature search as directed</td>
              <td className="border border-black p-2">
                <div className="flex justify-around">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.backgroundModification.recommended}
                      onChange={(e) => handleCheckboxChange('backgroundModification', 'recommended', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.backgroundModification.required}
                      onChange={(e) => handleCheckboxChange('backgroundModification', 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </td>
              <td className="border border-black p-2" rowSpan="5">
                <textarea
                  value={formData.modificationsDetails}
                  onChange={(e) => handleInputChange('modificationsDetails', e.target.value)}
                  className="w-full h-full p-1 focus:outline-none"
                  rows="10"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Modify scope of proposed work/research as directed</td>
              <td className="border border-black p-2">
                <div className="flex justify-around">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.scopeModification.recommended}
                      onChange={(e) => handleCheckboxChange('scopeModification', 'recommended', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.scopeModification.required}
                      onChange={(e) => handleCheckboxChange('scopeModification', 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Enroll/audit additional course(s) as specified</td>
              <td className="border border-black p-2">
                <div className="flex justify-around">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.additionalCourses.recommended}
                      onChange={(e) => handleCheckboxChange('additionalCourses', 'recommended', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.additionalCourses.required}
                      onChange={(e) => handleCheckboxChange('additionalCourses', 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Redo written section(s) as Directed</td>
              <td className="border border-black p-2">
                <div className="flex justify-around">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.redoWrittenSections.recommended}
                      onChange={(e) => handleCheckboxChange('redoWrittenSections', 'recommended', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.redoWrittenSections.required}
                      onChange={(e) => handleCheckboxChange('redoWrittenSections', 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Redo oral presentation as Directed</td>
              <td className="border border-black p-2">
                <div className="flex justify-around">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.redoOralPresentation.recommended}
                      onChange={(e) => handleCheckboxChange('redoOralPresentation', 'recommended', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Recommended</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.redoOralPresentation.required}
                      onChange={(e) => handleCheckboxChange('redoOralPresentation', 'required', e.target.checked)}
                      className="mr-2"
                    />
                    <span>Required</span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm mt-2 italic">Required Modifications can only be given for the case of "Conditional Pass" or Fail.</p>
      </div>

      {/* Committee Signatures - Initial */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Committee Signatures</h3>
        <table className="w-full border-collapse border border-black mb-4">
          <thead>
            <tr>
              <th className="border border-black p-2">Name</th>
              <th className="border border-black p-2">Signature with date</th>
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
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Co-Supervisor</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.coSupervisorSignature}
                  onChange={(e) => handleInputChange('coSupervisorSignature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 1:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember1Signature}
                  onChange={(e) => handleInputChange('gecMember1Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 2:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember2Signature}
                  onChange={(e) => handleInputChange('gecMember2Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 3:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember3Signature}
                  onChange={(e) => handleInputChange('gecMember3Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-sm italic">GEC to please sign below once the required modifications have been made. Only applicable for "Conditional Pass".</p>
        <div className="mt-2 mb-4">
          <label className="flex items-center">
            <span className="mr-2">All required modifications have been made wef</span>
            <input
              type="text"
              value={formData.completionDate}
              onChange={(e) => handleInputChange('completionDate', e.target.value)}
              className="border-b border-black w-32 focus:outline-none"
            />
            <span className="ml-2">& the student is declared PASS</span>
          </label>
        </div>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">Name</th>
              <th className="border border-black p-2">Signature with date</th>
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
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">Co-Supervisor</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.coSupervisorSignature}
                  onChange={(e) => handleInputChange('coSupervisorSignature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 1:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember1Signature}
                  onChange={(e) => handleInputChange('gecMember1Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 2:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember2Signature}
                  onChange={(e) => handleInputChange('gecMember2Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">GEC Member 3:</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember3Signature}
                  onChange={(e) => handleInputChange('gecMember3Signature', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Official Use Only */}
      <div className="mb-6 border-t-2 border-black pt-4">
        <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">Approved by</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">
                <div className="flex justify-between">
                  <div>
                    <label className="block">Chairperson EE (Signature & Date Received)</label>
                    <input
                      type="text"
                      value={formData.chairpersonSignature}
                      onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
                      className="border-b border-black w-64 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block">Dean (Signature & Date)</label>
                    <input
                      type="text"
                      value={formData.deanSignature}
                      onChange={(e) => handleInputChange('deanSignature', e.target.value)}
                      className="border-b border-black w-64 focus:outline-none"
                    />
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <label className="block">Remarks:</label>
                <textarea
                  className="w-full h-16 p-1 focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
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
        <strong>PHDEE-E2-B Form</strong>
      </div>
    </div>
  );
};

export default PHDEE_E2_B;