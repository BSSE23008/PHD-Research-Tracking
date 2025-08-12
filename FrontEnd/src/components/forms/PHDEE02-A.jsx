// FrontEnd/src/components/Forms/PHDEE02-A.jsx
// Supervisor Consent Form

import React, { useState, useEffect, useRef } from 'react';
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
    recommendation: ''
  });

  // Ref for printing - this will reference the printable content
  const printableRef = useRef();

  // Simple print function using browser's native print
  const handlePrint = () => {
    if (!printableRef.current) {
      console.error('Printable content not found');
      return;
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    const printContent = printableRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PHDEE02-A Supervisor Consent Form</title>
          <style>
            @page {
              size: A4;
              margin: 0.5in;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            /* Copy Tailwind classes that might be needed */
            .text-center { text-align: center; }
            .text-lg { font-size: 1.125rem; }
            .text-base { font-size: 1rem; }
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-1 { margin-top: 0.25rem; }
            .mt-2 { margin-top: 0.5rem; }
            .mt-4 { margin-top: 1rem; }
            .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
            .p-2 { padding: 0.5rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .pr-2 { padding-right: 0.5rem; }
            .pl-2 { padding-left: 0.5rem; }
            .w-full { width: 100%; }
            .w-1/2 { width: 50%; }
            .w-1/4 { width: 25%; }
            .w-2/3 { width: 66.666667%; }
            .border { border-width: 1px; }
            .border-black { border-color: black; }
            .border-b { border-bottom-width: 1px; }
            .border-t-2 { border-top-width: 2px; }
            .border-collapse { border-collapse: collapse; }
            .border-dashed { border-style: dashed; }
            .flex { display: flex; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .block { display: block; }
            .relative { position: relative; }
            input, textarea {
              border: none;
              outline: none;
              background: transparent;
              padding: 2px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            td {
              border: 1px solid black;
              padding: 0.5rem;
              vertical-align: top;
            }
            .logo-placeholder {
              height: 50px;
              background-color: #f0f0f0;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons - Hidden in print */}
      <div className="flex justify-between items-center mb-4 no-print">
        <div>
          {onClose && (
            <button
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={onClose}
              disabled={showSuccess}
            >
              Close
            </button>
          )}
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={showSuccess || submitting}
        >
          Save as PDF
        </button>
      </div>

      {/* Printable Form Content */}
      <div ref={printableRef} className="bg-white">
        <div className="p-6 relative">
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

          <div className="text-right text-sm mt-4">
            <strong>PHDEE02-A Form</strong>
          </div>
        </div>
      </div>

      {/* Form Footer - Hidden in print */}
      <div className="flex justify-end items-center mt-8 gap-4 no-print">
        {onClose && (
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            onClick={onClose}
            disabled={showSuccess}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitting || showSuccess}
        >
          {submitting ? 'Submitting...' : 'Submit Form'}
        </button>
      </div>

      {/* Overlay success message if needed */}
      {showSuccess && (
        <div className="fixed inset-0 bg-white bg-opacity-95 flex flex-col items-center justify-center z-50 no-print">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
          <p className="text-lg">Supervisor Consent Form has been submitted.</p>
        </div>
      )}
    </div>
  );
};

export default PHDEE02A;