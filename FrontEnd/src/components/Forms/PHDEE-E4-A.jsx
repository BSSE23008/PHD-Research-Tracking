// FrontEnd/src/components/Forms/PHDEE-E4-A.jsx
// PHD Thesis Submission Form (For DPRC)
import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEEE4A = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    // Part I - Student Information
    studentName: '',
    studentRollNumber: '',
    supervisorName: '',
    studentSignature: '',
    
    // Part II - Supervisor & GEC Review
    supervisorProgress: '',
    supervisorRemarks: '',
    supervisorSignature: '',
    coSupervisorProgress: '',
    coSupervisorRemarks: '',
    coSupervisorSignature: '',
    gecMember1Progress: '',
    gecMember1Remarks: '',
    gecMember1Signature: '',
    gecMember2Progress: '',
    gecMember2Remarks: '',
    gecMember2Signature: '',
    gecMember3Progress: '',
    gecMember3Remarks: '',
    gecMember3Signature: '',
    plagiarismConfirmationSignature: '',
    
    // Official Use Only
    secretaryDPRC: '',
    chairpersonRemarks: '',
    chairpersonSignature: '',
    deanRemarks: '',
    deanSignature: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill form fields from user prop
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        studentName: (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : prev.studentName || '',
        studentRollNumber: user.student_id || user.studentId || prev.studentRollNumber || '',
        supervisorName: user.supervisor || prev.supervisorName || '',
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
        <p className="text-lg">Your PhD Thesis Submission Form has been submitted for DPRC review.</p>
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
        <h2 className="text-base font-bold">PHD THESIS SUBMISSION FORM (For DPRC)</h2>
      </div>

      {/* Part I - Student Information */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold mb-4 text-lg">Part-I: To be filled by student</h3>
        
        <div className="border border-black">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border-b border-black p-3 font-bold w-1/4">Student Name</td>
                <td className="border-b border-black p-3 w-1/4">
                  <input
                    readOnly
                    disabled
                    type="text"
                    value={formData.studentName}
                    className="w-full focus:outline-none bg-gray-100"
                  />
                </td>
                <td className="border-b border-black p-3 font-bold w-1/4">Student Roll Number</td>
                <td className="border-b border-black p-3 w-1/4">
                  <input
                    readOnly
                    disabled
                    type="text"
                    value={formData.studentRollNumber}
                    className="w-full focus:outline-none bg-gray-100"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-3 font-bold">Supervisor Name</td>
                <td colSpan="3" className="border-b border-black p-3">
                  <input
                    type="text"
                    value={formData.supervisorName}
                    onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                    className="w-full focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan="4" className="p-4">
                  <p className="text-sm leading-relaxed">
                    I <strong>confirm</strong> that I have incorporated the feedback into my PhD thesis received from my External Thesis Evaluators (Local & Foreign) and is ready for In-House Defense.
                  </p>
                  <br />
                  <p className="text-sm leading-relaxed mb-4">
                    The following items are also attached as annexure with this form including my signatures:
                  </p>
                  <ul className="text-sm space-y-2 mb-4">
                    <li><strong>a)</strong> A point-by-point response document to all the comments that are received from External Thesis Evaluators (Local & Foreign).</li>
                    <li><strong>b)</strong> Updated plagiarism report generated by Quality Enhancement Cell (QEC) with sign & stamp of chief librarian.</li>
                  </ul>
                  <p className="text-sm leading-relaxed mb-4">
                    The soft copy of following items has been emailed to Secretary DPRC & Graduate Office EE:
                  </p>
                  <ul className="text-sm space-y-2">
                    <li><strong>a)</strong> Point-by-point response to all the comments that are received from External Thesis Evaluators (Local & Foreign)</li>
                    <li><strong>b)</strong> Revised PhD thesis document with all the changes highlighted in yellow/different color font</li>
                    <li><strong>c)</strong> Revised PhD thesis document without highlighted text</li>
                  </ul>
                </td>
              </tr>
              <tr>
                <td className="p-3 font-bold">Student's Signature with Date</td>
                <td colSpan="3" className="p-3">
                  <input
                    type="text"
                    value={formData.studentSignature}
                    onChange={(e) => handleInputChange('studentSignature', e.target.value)}
                    className="w-full border-b border-black focus:outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Part II - Supervisor & GEC Review */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold mb-4 text-lg">Part-II: To be filled by Supervisor, Co-Supervisor & GEC Members after reviewing the updated highlighted PhD thesis and point by point reply on feedback by External Thesis Evaluators (Local & Foreign)</h3>
        
        <div className="border border-black">
          <table className="w-full">
            <thead>
              <tr>
                <th className="border-b border-black p-3 font-bold w-1/4">Name</th>
                <th className="border-b border-black p-3 font-bold w-1/6">Progress (Satisfactory/Unsatisfactory)</th>
                <th className="border-b border-black p-3 font-bold w-1/3">Remarks</th>
                <th className="border-b border-black p-3 font-bold w-1/4">Signature with date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-black p-3 font-medium">Supervisor:</td>
                <td className="border-b border-black p-3">
                  <select
                    value={formData.supervisorProgress}
                    onChange={(e) => handleInputChange('supervisorProgress', e.target.value)}
                    className="w-full p-1 border border-gray-300 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                  </select>
                </td>
                <td className="border-b border-black p-3">
                  <textarea
                    value={formData.supervisorRemarks}
                    onChange={(e) => handleInputChange('supervisorRemarks', e.target.value)}
                    className="w-full h-12 p-1 border border-gray-300 focus:outline-none resize-none"
                  />
                </td>
                <td className="border-b border-black p-3">
                  <input
                    type="text"
                    value={formData.supervisorSignature}
                    onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
                    className="w-full border-b border-gray-400 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-3 font-medium">Co-Supervisor:</td>
                <td className="border-b border-black p-3">
                  <select
                    value={formData.coSupervisorProgress}
                    onChange={(e) => handleInputChange('coSupervisorProgress', e.target.value)}
                    className="w-full p-1 border border-gray-300 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                  </select>
                </td>
                <td className="border-b border-black p-3">
                  <textarea
                    value={formData.coSupervisorRemarks}
                    onChange={(e) => handleInputChange('coSupervisorRemarks', e.target.value)}
                    className="w-full h-12 p-1 border border-gray-300 focus:outline-none resize-none"
                  />
                </td>
                <td className="border-b border-black p-3">
                  <input
                    type="text"
                    value={formData.coSupervisorSignature}
                    onChange={(e) => handleInputChange('coSupervisorSignature', e.target.value)}
                    className="w-full border-b border-gray-400 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-3 font-medium">GEC Member 1:</td>
                <td className="border-b border-black p-3">
                  <select
                    value={formData.gecMember1Progress}
                    onChange={(e) => handleInputChange('gecMember1Progress', e.target.value)}
                    className="w-full p-1 border border-gray-300 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                  </select>
                </td>
                <td className="border-b border-black p-3">
                  <textarea
                    value={formData.gecMember1Remarks}
                    onChange={(e) => handleInputChange('gecMember1Remarks', e.target.value)}
                    className="w-full h-12 p-1 border border-gray-300 focus:outline-none resize-none"
                  />
                </td>
                <td className="border-b border-black p-3">
                  <input
                    type="text"
                    value={formData.gecMember1Signature}
                    onChange={(e) => handleInputChange('gecMember1Signature', e.target.value)}
                    className="w-full border-b border-gray-400 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-3 font-medium">GEC Member 2:</td>
                <td className="border-b border-black p-3">
                  <select
                    value={formData.gecMember2Progress}
                    onChange={(e) => handleInputChange('gecMember2Progress', e.target.value)}
                    className="w-full p-1 border border-gray-300 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                  </select>
                </td>
                <td className="border-b border-black p-3">
                  <textarea
                    value={formData.gecMember2Remarks}
                    onChange={(e) => handleInputChange('gecMember2Remarks', e.target.value)}
                    className="w-full h-12 p-1 border border-gray-300 focus:outline-none resize-none"
                  />
                </td>
                <td className="border-b border-black p-3">
                  <input
                    type="text"
                    value={formData.gecMember2Signature}
                    onChange={(e) => handleInputChange('gecMember2Signature', e.target.value)}
                    className="w-full border-b border-gray-400 focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="p-3 font-medium">GEC Member 3:</td>
                <td className="p-3">
                  <select
                    value={formData.gecMember3Progress}
                    onChange={(e) => handleInputChange('gecMember3Progress', e.target.value)}
                    className="w-full p-1 border border-gray-300 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="satisfactory">Satisfactory</option>
                    <option value="unsatisfactory">Unsatisfactory</option>
                  </select>
                </td>
                <td className="p-3">
                  <textarea
                    value={formData.gecMember3Remarks}
                    onChange={(e) => handleInputChange('gecMember3Remarks', e.target.value)}
                    className="w-full h-12 p-1 border border-gray-300 focus:outline-none resize-none"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={formData.gecMember3Signature}
                    onChange={(e) => handleInputChange('gecMember3Signature', e.target.value)}
                    className="w-full border-b border-gray-400 focus:outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 border border-gray-300 bg-gray-50">
          <p className="text-sm mb-4">
            I confirm that the plagiarism has been checked by Quality Enhancement Cell (QEC) and similarity index is <strong>less than 19% (not exceeding 5% from a single source)</strong>, after incorporating the feedback from GEC Members, External Thesis Evaluators (Local & Foreign).
          </p>
          <div>
            <label className="block font-bold mb-2">Supervisor (Signature with Date)</label>
            <input
              type="text"
              value={formData.plagiarismConfirmationSignature}
              onChange={(e) => handleInputChange('plagiarismConfirmationSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 border-black my-6"></div>

      {/* Official Use Only */}
      <div className="mb-6">
        <h3 className="font-bold mb-4 text-lg">(FOR OFFICIAL USE ONLY)</h3>
        
        <div className="border border-black">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border-b border-black p-4 font-bold w-1/3">Secretary DPRC<br/>(Signature)</td>
                <td className="border-b border-black p-4">
                  <input
                    type="text"
                    value={formData.secretaryDPRC}
                    onChange={(e) => handleInputChange('secretaryDPRC', e.target.value)}
                    className="w-full focus:outline-none"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-b border-black p-4 font-bold">
                  Recommended By<br/><br/>
                  <strong>Chairperson, Electrical Engineering Department</strong><br/><br/>
                  (Remarks, if any, and Signature)
                </td>
                <td className="border-b border-black p-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Remarks:</label>
                    <textarea
                      value={formData.chairpersonRemarks}
                      onChange={(e) => handleInputChange('chairpersonRemarks', e.target.value)}
                      className="w-full h-16 p-2 border border-gray-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Signature:</label>
                    <input
                      type="text"
                      value={formData.chairpersonSignature}
                      onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold">
                  Approved By<br/><br/>
                  <strong>Dean, Faculty of Engineering</strong><br/><br/>
                  (Remarks, if any, and Signature)
                </td>
                <td className="p-4">
                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Remarks:</label>
                    <textarea
                      value={formData.deanRemarks}
                      onChange={(e) => handleInputChange('deanRemarks', e.target.value)}
                      className="w-full h-16 p-2 border border-gray-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Signature:</label>
                    <input
                      type="text"
                      value={formData.deanSignature}
                      onChange={(e) => handleInputChange('deanSignature', e.target.value)}
                      className="w-full border-b border-black focus:outline-none"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
        <strong>PHDEE-E4-A Form</strong>
      </div>
    </div>
  );
};

export default PHDEEE4A;