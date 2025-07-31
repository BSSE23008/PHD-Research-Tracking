// FrontEnd/src/components/Forms/PHDEE02-A.jsx
// Supervisor Consent Form

// FrontEnd/src/components/Forms/PHDEE02-A.jsx
import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE02A = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    // Student Information
    degree: '',
    session: '',
    studentID: '',
    studentName: '',
    researchArea: '',
    contactNo: '',
    studentSignature: '',
    
    // Supervisor Information
    title: 'Mr',
    supervisorName: '',
    supervisorRefNo: '',
    designation: '',
    existingPhD: '',
    existingMS: '',
    asSupervisorPhD: '',
    asCoSupervisorPhD: '',
    asSupervisorMS: '',
    asCoSupervisorMS: '',
    email: '',
    supervisorContact: '',
    supervisorSignature: '',
    
    // Official Use
    graduateCoordinator: '',
    secretaryDPRC: '',
    chairpersonEE: '',
    recommendation: '' // Added for recommendation
  });

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill form fields from user prop
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        studentName: (user.first_name && user.last_name) 
          ? `${user.first_name} ${user.last_name}` 
          : prev.studentName || '',
        studentID: user.student_id || user.studentId || prev.studentID || '',
        email: user.email || prev.email || '',
        contactNo: user.phone || prev.contactNo || '',
        supervisorName: user.supervisor || prev.supervisorName || '',
        researchArea: user.research_area || prev.researchArea || '',
        session: user.enrollment_year || prev.enrollmentYear || ''
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const handleSubmit = async () => {
  //   setSubmitting(true);
  //   try {
  //     // Simulate API call
  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //     setShowSuccess(true);
  //     setTimeout(() => {
  //       setShowSuccess(false);
  //       if (onSubmissionComplete) onSubmissionComplete(formData);
  //     }, 2000);
  //   } catch (error) {
  //     console.error("Submission error:", error);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };


  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/supervisor-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          formType: 'PHDEE02-A',
          ...formData
        })
      });
  
      if (!response.ok) {
        throw new Error('Submission failed');
      }
  
      const result = await response.json();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (onSubmissionComplete) onSubmissionComplete(result);
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      // Show error to user
    } finally {
      setSubmitting(false);
    }
  };

  
  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
        <p className="text-lg">Supervisor Consent Form has been submitted.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white relative">
      {/* Close Button */}
      {onClose && (
        <button
          className="absolute right-0 top-0 m-4 text-2xl text-gray-500 hover:text-black"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div className="logo-placeholder mb-2"></div>
        <h1 className="text-lg font-bold uppercase">
          Information Technology University of the Punjab
        </h1>
        <h2 className="text-base font-bold mt-2">PhD Supervisor Consent Form</h2>
      </div>

      {/* Form Content */}
      <div className="border border-black p-4 mb-4">
        <div className="flex mb-4">
          <div className="w-1/2 pr-2">
            <label className="block font-bold">Degree</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => handleInputChange('degree', e.target.value)}
              className="w-full border-b border-black focus:outline-none"
            />
          </div>
          <div className="w-1/2 pl-2">
            <label className="block font-bold">Session</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.session}
              onChange={(e) => handleInputChange('session', e.target.value)}
              className="w-full border-b border-black focus:outline-none"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block font-bold">Student ID</label>
          <input
            readOnly
            disabled
            type="text"
            value={formData.studentID}
            onChange={(e) => handleInputChange('studentID', e.target.value)}
            className="w-full border-b border-black focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block font-bold">Student Name</label>
          <input
            readOnly
            disabled
            type="text"
            value={formData.studentName}
            onChange={(e) => handleInputChange('studentName', e.target.value)}
            className="w-full border-b border-black focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label className="block font-bold">Area of Research</label>
          <input
            disabled
            readOnly
            value={formData.researchArea}
            onChange={(e) => handleInputChange('researchArea', e.target.value)}
            className="w-full border border-black p-2 focus:outline-none"
            rows="3"
          />
        </div>

        <div className="flex mb-4">
          <div className="w-1/2 pr-2">
            <label className="block font-bold">Contact No</label>
            <input
              type="text"
              value={formData.contactNo}
              onChange={(e) => handleInputChange('contactNo', e.target.value)}
              className="w-full border-b border-black focus:outline-none"
            />
          </div>
          <div className="w-1/2 pl-2">
            <label className="block font-bold">Student Signature with date</label>
            <input
              type="text"
              value={formData.studentSignature}
              onChange={(e) => handleInputChange('studentSignature', e.target.value)}
              className="w-full border-b border-black focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Supervisor Consent Section */}
      <div className="border border-black p-4 mb-4">
        <h3 className="font-bold mb-4">Supervisor Consent</h3>
        <p className="mb-4">
          I am willing to take {formData.title} / Ms / Mrs
          <input
            type="text"
            value={formData.supervisorName}
            onChange={(e) => handleInputChange('supervisorName', e.target.value)}
            className="w-2/3 mx-2 border-b border-black focus:outline-none"
          />
          of PhD program batch
          <input
            type="text"
            className="w-1/4 mx-2 border-b border-black focus:outline-none"
          />
          under my supervision as a PhD student at the Department of Electrical Engineering, Information Technology University of the Punjab.
        </p>

        {/* Supervisor Table */}
        <table className="w-full border-collapse border border-black mb-4">
          <tbody>
            <tr>
              <td className="border border-black p-2 font-bold w-1/4">Supervisor</td>
              <td className="border border-black p-2 w-1/4">
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2 font-bold w-1/4">Designation</td>
              <td className="border border-black p-2 w-1/4">
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">HEC Approved Supervisor Ref. No.</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.supervisorRefNo}
                  onChange={(e) => handleInputChange('supervisorRefNo', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2 font-bold">No. of existing PhD students</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.existingPhD}
                  onChange={(e) => handleInputChange('existingPhD', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">Email</td>
              <td className="border border-black p-2">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2 font-bold">No. of existing MS students</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.existingMS}
                  onChange={(e) => handleInputChange('existingMS', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2 font-bold">Contact #</td>
              <td className="border border-black p-2">
                <input
                  type="text"
                  value={formData.supervisorContact}
                  onChange={(e) => handleInputChange('supervisorContact', e.target.value)}
                  className="w-full focus:outline-none"
                />
              </td>
              <td className="border border-black p-2 font-bold" colSpan="2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block">As Supervisor:</span>
                    <input
                      type="text"
                      value={formData.asSupervisorPhD}
                      onChange={(e) => handleInputChange('asSupervisorPhD', e.target.value)}
                      className="w-full border-b border-black focus:outline-none"
                      placeholder="PhD"
                    />
                    <input
                      type="text"
                      value={formData.asSupervisorMS}
                      onChange={(e) => handleInputChange('asSupervisorMS', e.target.value)}
                      className="w-full border-b border-black focus:outline-none mt-1"
                      placeholder="MS"
                    />
                  </div>
                  <div>
                    <span className="block">As Co-Supervisor:</span>
                    <input
                      type="text"
                      value={formData.asCoSupervisorPhD}
                      onChange={(e) => handleInputChange('asCoSupervisorPhD', e.target.value)}
                      className="w-full border-b border-black focus:outline-none"
                      placeholder="PhD"
                    />
                    <input
                      type="text"
                      value={formData.asCoSupervisorMS}
                      onChange={(e) => handleInputChange('asCoSupervisorMS', e.target.value)}
                      className="w-full border-b border-black focus:outline-none mt-1"
                      placeholder="MS"
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-4">
          <label className="block font-bold">Supervisor's Signature with date:</label>
          <input
            type="text"
            value={formData.supervisorSignature}
            onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
            className="w-full border-b border-black focus:outline-none"
          />
        </div>

        <div className="text-xs italic mt-4">
          <strong>Note:</strong> A supervisor can supervise no more than 12 graduate students (of which maximum 5 can be PhD students) at a time, as per HEC policy.
        </div>
      </div>

      {/* Horizontal Line */}
      <div className="border-t-2 border-black border-dashed my-6"></div>

      {/* Official Use Only */}
      <div className="border border-black p-4">
        <h3 className="font-bold text-center mb-4">(FOR OFFICIAL USE ONLY)</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <label className="font-bold mb-2 block">
              <input
                type="radio"
                name="recommendation"
                value="Recommended"
                checked={formData.recommendation === 'Recommended'}
                onChange={() => handleInputChange('recommendation', 'Recommended')}
                className="mr-2"
              />
              Recommended
            </label>
          </div>
          <div className="text-center">
            <label className="font-bold mb-2 block">
              <input
                type="radio"
                name="recommendation"
                value="Not-Recommended"
                checked={formData.recommendation === 'Not-Recommended'}
                onChange={() => handleInputChange('recommendation', 'Not-Recommended')}
                className="mr-2"
              />
              Not-Recommended
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Remarks:</label>
          <textarea
            className="w-full border border-black p-2 focus:outline-none"
            rows="2"
          ></textarea>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-bold">Graduate Program Coordinator</label>
            <div className="mt-1">(Signature & Date)</div>
            <input
              type="text"
              value={formData.graduateCoordinator}
              onChange={(e) => handleInputChange('graduateCoordinator', e.target.value)}
              className="w-full border-b border-black focus:outline-none mt-2"
            />
          </div>
          
          <div>
            <label className="block font-bold">Graduate Program Advisor / Secretary DPRC</label>
            <div className="mt-1">(Signature & Date)</div>
            <input
              type="text"
              value={formData.secretaryDPRC}
              onChange={(e) => handleInputChange('secretaryDPRC', e.target.value)}
              className="w-full border-b border-black focus:outline-none mt-2"
            />
          </div>
          
          <div>
            <label className="block font-bold">Chairperson EE</label>
            <div className="mt-1">(Signature & Date)</div>
            <input
              type="text"
              value={formData.chairpersonEE}
              onChange={(e) => handleInputChange('chairpersonEE', e.target.value)}
              className="w-full border-b border-black focus:outline-none mt-2"
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
        <strong>PHDEE02-A Form</strong>
      </div>
    </div>
  );
};

export default PHDEE02A;