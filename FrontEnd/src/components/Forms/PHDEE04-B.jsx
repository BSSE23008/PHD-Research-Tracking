import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE04B = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    degree: '',
    session: '',
    studentId: '',
    studentName: '',
    specializationField: '',
    proposedTitle: '',
    examDate: '',
    examTime: '',
    examLocation: '',
    studentSignature: '',
    recommended: '',
    remarks: '',
    gradProgramCoordinator: '',
    chairpersonEE: '',
    supervisor: '',
    coSupervisor: '',
    gecMember1: '',
    gecMember2: '',
    gecMember3: ''
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
        specializationField: user.specialization || prev.specializationField || '',
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
        <p className="text-lg">Your Synopsis Defense Scheduling has been submitted for review.</p>
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
        <h2 className="text-base font-bold">SYNOPSIS DEFENSE SCHEDULING FORM</h2>
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

        <div className="mb-4">
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

        <div className="mb-4">
          <label className="inline-block w-32">Specialization Field:</label>
          <input
            type="text"
            value={formData.specializationField}
            onChange={(e) => handleInputChange('specializationField', e.target.value)}
            className="border-b border-black inline-block w-96 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="inline-block w-48">Proposed Dissertation Title:</label>
          <div className="mt-2">
            <textarea
              value={formData.proposedTitle}
              onChange={(e) => handleInputChange('proposedTitle', e.target.value)}
              className="border-b border-black w-full h-16 focus:outline-none resize-none"
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Declaration</h3>
        <div className="mb-2">
          <span className="inline-block w-6">1.</span>
          <span>I have read the ITU PhD Proposal Examination Policy</span>
        </div>
        <div className="mb-2">
          <span className="inline-block w-6">2.</span>
          <span>I shared a copy of Proposal draft with all GEC Members to seek input on proposal</span>
        </div>
        <div className="mb-2">
          <span className="inline-block w-6">3.</span>
          <span>I have incorporated the changes in the proposal in the light of recommendations received from GEC Members relatively.</span>
        </div>
        <div className="mb-2">
          <span className="inline-block w-6">4.</span>
          <span>I have confirmed availability of Lecture theater via Academics</span>
        </div>
        <div className="mb-4">
          <span className="inline-block w-6">5.</span>
          <span>I have advertised the Examination dates to students via Academics office</span>
        </div>
      </div>

      {/* Examination Schedule */}
      <div className="mb-6">
        <div className="mb-4">
          <span>Proposal examination is scheduled on </span>
          <input
            type="text"
            value={formData.examDate}
            onChange={(e) => handleInputChange('examDate', e.target.value)}
            className="border-b border-black inline-block w-48 focus:outline-none mx-2"
            placeholder="[DD, MM, YY]"
          />
          <span> at </span>
          <input
            type="text"
            value={formData.examTime}
            onChange={(e) => handleInputChange('examTime', e.target.value)}
            className="border-b border-black inline-block w-32 focus:outline-none mx-2"
            placeholder="[Time]"
          />
          <span> at </span>
          <input
            type="text"
            value={formData.examLocation}
            onChange={(e) => handleInputChange('examLocation', e.target.value)}
            className="border-b border-black inline-block w-48 focus:outline-none mx-2"
            placeholder="[Location]"
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

        <div className="mb-6">
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

            <div className="mb-6">
              <div className="mb-2">Co-Supervisor</div>
              <div className="text-sm">(If any)</div>
              <div className="text-sm">Co-Supervisor's Signature with date:</div>
              <input
                type="text"
                value={formData.coSupervisor}
                onChange={(e) => handleInputChange('coSupervisor', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>
          </div>

          <div>
            <div className="mb-6">
              <div className="mb-2">GEC Committee Members 1</div>
              <div className="text-sm">Signature</div>
              <input
                type="text"
                value={formData.gecMember1}
                onChange={(e) => handleInputChange('gecMember1', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="mb-2">GEC Committee Members 2</div>
              <div className="text-sm">Signature</div>
              <input
                type="text"
                value={formData.gecMember2}
                onChange={(e) => handleInputChange('gecMember2', e.target.value)}
                className="border-b border-black w-full focus:outline-none mt-2"
              />
            </div>

            <div className="mb-6">
              <div className="mb-2">GEC Committee Members 3</div>
              <div className="text-sm">Signature</div>
              <input
                type="text"
                value={formData.gecMember3}
                onChange={(e) => handleInputChange('gecMember3', e.target.value)}
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
        <strong>PHDEE04-B Form</strong>
      </div>
    </div>
  );
};

export default PHDEE04B;