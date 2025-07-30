// PHD Thesis Plagiarism Check Form


import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E2_C = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    // Part-I: Student Section
    studentName: '',
    studentRollNumber: '',
    thesisTitle: '',
    studentSignature: '',
    
    // Part-II: Supervisor Section
    supervisorName: '',
    supervisorSignature: '',
    
    // Part-III: QEC Section
    officerName: '',
    officerDesignation: '',
    similarityIndex: '',
    maxSingleSource: '',
    plagiarismCheckDate: '',
    officerSignature: '',
    
    // Official Use Only
    dprcSignature: '',
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
        <p className="text-lg">Plagiarism Check Form has been submitted.</p>
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
        <h2 className="text-base font-bold">PHD THESIS PLAGIARISM CHECK FORM</h2>
      </div>

      {/* Part-I: Student Section */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-2">Part-I: To be filled by student</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-semibold">Student Name</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Student Roll Number</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentRollNumber}
              onChange={(e) => handleInputChange('studentRollNumber', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Thesis Title</label>
          <input
            type="text"
            value={formData.thesisTitle}
            onChange={(e) => handleInputChange('thesisTitle', e.target.value)}
            className="border-b border-black w-full focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <p className="text-sm italic mb-4">
            I am submitting herewith a softcopy of my PhD thesis to my supervisor for checking 
            plagiarism & issue me a report. I undertake the follows: "I am aware of ITU's and HEC's 
            plagiarism policy. No sentence, equation, diagram, table, paragraph, or section has been 
            copied verbatim from previous work unless it is placed under quotation marks and duly 
            referenced. The work presented is my original and own work. No ideas, processes, results, 
            or words of others have been presented as my own work. There is no fabrication of data or 
            results which have been compiled or analyzed. There is no falsification by manipulating 
            result materials, equipment, or processes, or changing or omitting data or results such 
            that the research is not accurately represented in the research record. If I am I am found 
            guilty of any formal plagiarism in the above titled thesis even after award of degree, the 
            university reserves the right to withdraw or revoke my PhD degree. If plagiarism found 
            (major or minor) in the thesis after the award of degree I will be penalized as per 
            provisions of HEC's plagiarism policy."
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block mb-1 font-semibold">Student's Signature with Date</label>
            <input
              type="text"
              value={formData.studentSignature}
              onChange={(e) => handleInputChange('studentSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div></div> {/* Empty cell for alignment */}
        </div>
      </div>

      {/* Part-II: Supervisor Section */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-2">Part-II: To be filled by supervisor</h3>
        
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Supervisor Name</label>
          <input
            type="text"
            value={formData.supervisorName}
            onChange={(e) => handleInputChange('supervisorName', e.target.value)}
            className="border-b border-black w-full focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <p className="text-sm italic mb-4">
            I am forwarding herewith a softcopy of PhD thesis of student under my supervision. I 
            undertake the follows: "I am aware of ITU's and HEC's plagiarism policy. If plagiarism found 
            (major or minor) in the thesis after the award of degree I will be penalized as per 
            provisions of HEC's plagiarism policy."
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block mb-1 font-semibold">Supervisor's Signature with Date</label>
            <input
              type="text"
              value={formData.supervisorSignature}
              onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div></div> {/* Empty cell for alignment */}
        </div>
      </div>

      {/* Part-III: QEC Section */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold text-lg mb-4 border-b border-black pb-2">Part-III: To be filled by Quality Enhancement Cell (QEC)</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-semibold">Name of authorized officer</label>
            <input
              type="text"
              value={formData.officerName}
              onChange={(e) => handleInputChange('officerName', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Designation</label>
            <input
              type="text"
              value={formData.officerDesignation}
              onChange={(e) => handleInputChange('officerDesignation', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm italic mb-4">
            I have received herewith a softcopy of PhD thesis of student mentioned above from supervisor. I 
            undertake the follows: "I am aware of ITU's and HEC's plagiarism policy. The thesis has been checked 
            using TURNITIN. Copy of originality report is attached and is also duly signed and stamped. 
            Similarity index is found within limits as per HEC's plagiarism policy and instruction issued from 
            time to time. Similarity index is <strong>less than 19% (not exceeding 5% from a single source)</strong>."
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-semibold">Similarity index of the originality report</label>
            <input
              type="text"
              value={formData.similarityIndex}
              onChange={(e) => handleInputChange('similarityIndex', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Maximum similarity index from a single source</label>
            <input
              type="text"
              value={formData.maxSingleSource}
              onChange={(e) => handleInputChange('maxSingleSource', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Plagiarism Checked on (Date)</label>
            <input
              type="text"
              value={formData.plagiarismCheckDate}
              onChange={(e) => handleInputChange('plagiarismCheckDate', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Signature and Stamp of authorized officer with Date</label>
            <input
              type="text"
              value={formData.officerSignature}
              onChange={(e) => handleInputChange('officerSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Official Use Only */}
      <div className="mb-6 border-t-2 border-black pt-4">
        <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-black p-2">
            <label className="block mb-1 font-semibold">Secretary DPRC (Signature)</label>
            <input
              type="text"
              value={formData.dprcSignature}
              onChange={(e) => handleInputChange('dprcSignature', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div className="border border-black p-2">
            <label className="block mb-1 font-semibold">Recommended By</label>
            <div className="mt-2">
              <label className="block mb-1">Chairperson, Electrical Engineering Department</label>
              <label className="block mb-1">Remarks, if any:</label>
              <textarea
                value={formData.chairpersonRemarks}
                onChange={(e) => handleInputChange('chairpersonRemarks', e.target.value)}
                className="border border-black w-full h-16 p-1 focus:outline-none"
              />
              <label className="block mb-1 mt-2">Signature:</label>
              <input
                type="text"
                value={formData.chairpersonSignature}
                onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
                className="border-b border-black w-full focus:outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="border border-black p-2">
          <label className="block mb-1 font-semibold">Approved By</label>
          <div className="mt-2">
            <label className="block mb-1">Dean, Faculty of Engineering</label>
            <label className="block mb-1">Remarks, if any:</label>
            <textarea
              value={formData.deanRemarks}
              onChange={(e) => handleInputChange('deanRemarks', e.target.value)}
              className="border border-black w-full h-16 p-1 focus:outline-none"
            />
            <label className="block mb-1 mt-2">Signature:</label>
            <input
              type="text"
              value={formData.deanSignature}
              onChange={(e) => handleInputChange('deanSignature', e.target.value)}
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
        <strong>PHDEE-E2-C Form</strong>
      </div>
    </div>
  );
};

export default PHDEE_E2_C;






