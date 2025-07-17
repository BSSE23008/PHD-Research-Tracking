import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE03 = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    majorCourses: ['', '', '', ''],
    minorCourses: ['', '', '', ''],
    courseworkFinalCGPA: '',
    studentSignature: '',
    majorExamCourses: ['', '', '', ''],
    minorExamCourses: ['', '', '', ''],
    majorFormulatingFaculty: ['', '', '', ''],
    minorFormulatingFaculty: ['', '', '', ''],
    majorFormulatingFacultySignature: ['', '', '', ''],
    minorFormulatingFacultySignature: ['', '', '', ''],
    majorDateScheduled: ['', '', '', ''],
    minorDateScheduled: ['', '', '', ''],
    recommended: '',
    remarks: '',
    gradProgramCoordinator: '',
    gradProgramAdvisor: '',
    chairpersonEE: '',
    supervisor: ''
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
        <p className="text-lg">Your Comprehensive Examination Request has been submitted for review.</p>
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
        <h2 className="text-base font-bold">COMPREHENSIVE EXAMINATION REQUEST FORM</h2>
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

      {/* Courses Section */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Major Courses */}
          <div>
            <h3 className="font-bold mb-4">Major Courses Passed</h3>
            {formData.majorCourses.map((course, index) => (
              <div key={index} className="mb-3">
                <label className="inline-block w-6">{index + 1}.</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => handleArrayChange('majorCourses', index, e.target.value)}
                  className="border-b border-black inline-block w-64 focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* Minor Courses */}
          <div>
            <h3 className="font-bold mb-4">Minor Courses Passed</h3>
            {formData.minorCourses.map((course, index) => (
              <div key={index} className="mb-3">
                <label className="inline-block w-6">{index + 1}.</label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => handleArrayChange('minorCourses', index, e.target.value)}
                  className="border-b border-black inline-block w-64 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 mt-6">
          <label className="inline-block w-40">Coursework Final CGPA</label>
          <input
            type="text"
            value={formData.courseworkFinalCGPA}
            onChange={(e) => handleInputChange('courseworkFinalCGPA', e.target.value)}
            className="border-b border-black inline-block w-32 focus:outline-none"
          />
        </div>
      </div>

      {/* Declaration */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Declaration</h3>
        <div className="mb-2">
          <span className="inline-block w-6">1.</span>
          <span>I have read the Comprehensive Examination Policy</span>
        </div>
        <div className="mb-4">
          <span className="inline-block w-6">2.</span>
          <span>I have completed at least 18 CH coursework with a CGPA of greater than or equal to 3.0</span>
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
              <h4 className="font-semibold mb-2">Signature</h4>
              {formData.majorFormulatingFacultySignature.map((signature, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => handleArrayChange('majorFormulatingFacultySignature', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Date Scheduled</h4>
              {formData.majorDateScheduled.map((date, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => handleArrayChange('majorDateScheduled', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
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
              <h4 className="font-semibold mb-2">Signature</h4>
              {formData.minorFormulatingFacultySignature.map((signature, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => handleArrayChange('minorFormulatingFacultySignature', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Date Scheduled</h4>
              {formData.minorDateScheduled.map((date, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => handleArrayChange('minorDateScheduled', index, e.target.value)}
                    className="border-b border-black w-full focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm mt-4">
          <strong>Note:</strong> The Supervisor will submit sealed Major and Minor exam folders to Department chair. The department will assign exam location and invigilator.
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
              <div className="text-sm">(Signature & Date Received)</div>
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
        <strong>PhDEE03- Form</strong>
      </div>
    </div>
  );
};

export default PHDEE03;