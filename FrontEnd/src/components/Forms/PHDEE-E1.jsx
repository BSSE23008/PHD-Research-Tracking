import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E1 = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    majorExamCourses: ['', '', '', ''],
    minorExamCourses: ['', '', '', ''],
    majorFormulatingFaculty: ['', '', '', ''],
    minorFormulatingFaculty: ['', '', '', ''],
    majorTotalMarks: ['', '', '', ''],
    minorTotalMarks: ['', '', '', ''],
    majorMarksObtained: ['', '', '', ''],
    minorMarksObtained: ['', '', '', ''],
    majorDateConducted: ['', '', '', ''],
    minorDateConducted: ['', '', '', ''],
    majorPercentageTotal: '',
    minorPercentageTotal: '',
    finalResult: '',
    questionPapersAttached: false,
    gecMember1Name: '',
    gecMember1Signature: '',
    gecMember2Name: '',
    gecMember2Signature: '',
    gecMember3Name: '',
    gecMember3Signature: '',
    supervisorName: '',
    supervisorSignature: '',
    recommended: '',
    remarks: '',
    gradProgramAdvisor: '',
    chairpersonEE: ''
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
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  // Calculate percentage when marks change
  useEffect(() => {
    // Calculate major percentage
    const majorTotal = formData.majorTotalMarks.reduce((sum, mark) => sum + (parseFloat(mark) || 0), 0);
    const majorObtained = formData.majorMarksObtained.reduce((sum, mark) => sum + (parseFloat(mark) || 0), 0);
    const majorPercentage = majorTotal > 0 ? ((majorObtained / majorTotal) * 100).toFixed(2) : '';
    
    // Calculate minor percentage
    const minorTotal = formData.minorTotalMarks.reduce((sum, mark) => sum + (parseFloat(mark) || 0), 0);
    const minorObtained = formData.minorMarksObtained.reduce((sum, mark) => sum + (parseFloat(mark) || 0), 0);
    const minorPercentage = minorTotal > 0 ? ((minorObtained / minorTotal) * 100).toFixed(2) : '';
    
    setFormData(prev => ({
      ...prev,
      majorPercentageTotal: majorPercentage,
      minorPercentageTotal: minorPercentage
    }));
  }, [formData.majorTotalMarks, formData.majorMarksObtained, formData.minorTotalMarks, formData.minorMarksObtained]);

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
        <p className="text-lg">Your Comprehensive Exam Evaluation Form has been submitted for review.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white relative">
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
        <div className="logo-placeholder"></div>
        <h1 className="text-lg font-bold mb-2">INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB</h1>
        <h2 className="text-base font-bold">COMPREHENSIVE EXAM EVALUATION FORM</h2>
      </div>

      {/* Student Information */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="inline-block w-20">Degree</label>
            <input
              readOnly
              disabled
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

        <div className="mb-6">
          <label className="inline-block w-32">Student Name:</label>
          <input
            readOnly
            disabled
            type="text"
            value={formData.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            className="border-b border-black inline-block w-96 focus:outline-none"
          />
        </div>
      </div>

      {/* Exam Details */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Major Exam */}
          <div>
            <h3 className="font-bold text-center mb-4">Major Exam</h3>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Courses</h4>
              {formData.majorExamCourses.map((course, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => handleArrayChange('majorExamCourses', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Formulating Faculty</h4>
              {formData.majorFormulatingFaculty.map((faculty, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => handleArrayChange('majorFormulatingFaculty', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Total Marks</h4>
              {formData.majorTotalMarks.map((marks, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => handleArrayChange('majorTotalMarks', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Marks Obtained</h4>
              {formData.majorMarksObtained.map((marks, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => handleArrayChange('majorMarksObtained', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Date Conducted</h4>
              {formData.majorDateConducted.map((date, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => handleArrayChange('majorDateConducted', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Percentage Total</h4>
              <input
                type="text"
                value={formData.majorPercentageTotal}
                readOnly
                className="border-b border-black w-full focus:outline-none bg-gray-100"
              />
            </div>
          </div>

          {/* Minor Exam */}
          <div>
            <h3 className="font-bold text-center mb-4">Minor Exam</h3>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Courses</h4>
              {formData.minorExamCourses.map((course, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => handleArrayChange('minorExamCourses', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Formulating Faculty</h4>
              {formData.minorFormulatingFaculty.map((faculty, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => handleArrayChange('minorFormulatingFaculty', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Total Marks</h4>
              {formData.minorTotalMarks.map((marks, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => handleArrayChange('minorTotalMarks', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Marks Obtained</h4>
              {formData.minorMarksObtained.map((marks, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => handleArrayChange('minorMarksObtained', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Date Conducted</h4>
              {formData.minorDateConducted.map((date, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => handleArrayChange('minorDateConducted', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Percentage Total</h4>
              <input
                type="text"
                value={formData.minorPercentageTotal}
                readOnly
                className="border-b border-black w-full focus:outline-none bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <label className="font-bold">Final Result:</label>
          <label className="inline-block mr-4">
            <input
              type="radio"
              name="finalResult"
              value="pass"
              checked={formData.finalResult === 'pass'}
              onChange={(e) => handleInputChange('finalResult', e.target.value)}
              className="mr-1"
            />
            PASS
          </label>
          <label className="inline-block">
            <input
              type="radio"
              name="finalResult"
              value="fail"
              checked={formData.finalResult === 'fail'}
              onChange={(e) => handleInputChange('finalResult', e.target.value)}
              className="mr-1"
            />
            FAIL
          </label>
        </div>
      </div>

      {/* GEC Members and Supervisor */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2 text-left">Name</th>
              <th className="border border-black p-2 text-left">Signature with date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">
                <div className="mb-1 font-semibold">Supervisor</div>
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.supervisorSignature}
                  onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <div className="mb-1 font-semibold">GEC Member 1:</div>
                <input
                  type="text"
                  value={formData.gecMember1Name}
                  onChange={(e) => handleInputChange('gecMember1Name', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember1Signature}
                  onChange={(e) => handleInputChange('gecMember1Signature', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <div className="mb-1 font-semibold">GEC Member 2:</div>
                <input
                  type="text"
                  value={formData.gecMember2Name}
                  onChange={(e) => handleInputChange('gecMember2Name', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember2Signature}
                  onChange={(e) => handleInputChange('gecMember2Signature', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">
                <div className="mb-1 font-semibold">GEC Member 3:</div>
                <input
                  type="text"
                  value={formData.gecMember3Name}
                  onChange={(e) => handleInputChange('gecMember3Name', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.gecMember3Signature}
                  onChange={(e) => handleInputChange('gecMember3Signature', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Question Papers Checkbox */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.questionPapersAttached}
            onChange={(e) => handleInputChange('questionPapersAttached', e.target.checked)}
            className="mr-2"
          />
          Question papers & Answer Sheets attached
        </label>
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
              <div className="mb-2">Graduate Program Advisor</div>
              <div className="text-sm">(Signature & Date)</div>
              <input
                type="text"
                value={formData.gradProgramAdvisor}
                onChange={(e) => handleInputChange('gradProgramAdvisor', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>
          </div>

          <div>
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
        <strong>PHDEE-E1 Form</strong>
      </div>
    </div>
  );
};

export default PHDEE_E1; 