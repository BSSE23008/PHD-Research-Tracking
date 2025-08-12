// FrontEnd/src/components/Forms/PHDEE-E3-B.jsx 
// PHD Thesis External Evaluation Request Form

import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEEE3B = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    // Part I - Student Information
    studentName: '',
    studentRollNumber: '',
    supervisorName: '',
    studentSignature: '',
    
    // Part II - Supervisor Evaluation
    novelProblemRating: '',
    relatedWorkRating: '',
    stateOfArtRating: '',
    writingQualityRating: '',
    contributionsRating: '',
    feedbackIncorporated: '',
    plagiarismChecked: '',
    supervisorSignature: '',
    
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
        <p className="text-lg">Your PhD Thesis External Evaluation Request has been submitted.</p>
      </div>
    );
  }

  const RatingScale = ({ name, value, onChange }) => {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm">strongly disagree</span>
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="flex flex-col items-center">
              <span className="text-sm mb-1">{rating}</span>
              <input
                type="radio"
                name={name}
                value={rating}
                checked={value === rating.toString()}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4"
              />
            </label>
          ))}
        </div>
        <span className="text-sm">strongly agree</span>
      </div>
    );
  };

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
        <h2 className="text-base font-bold">PHD THESIS EXTERNAL EVALUATION REQUEST FORM</h2>
      </div>

      {/* Part I - Student Information */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold mb-4 text-lg">Part-I: To be filled by student</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-bold mb-2">Name</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className="border-b border-black w-full focus:outline-none bg-gray-100"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">Student Roll Number</label>
            <input
              readOnly
              disabled
              type="text"
              value={formData.studentRollNumber}
              onChange={(e) => handleInputChange('studentRollNumber', e.target.value)}
              className="border-b border-black w-full focus:outline-none bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-bold mb-2">Supervisor Name</label>
            <input
              type="text"
              value={formData.supervisorName}
              onChange={(e) => handleInputChange('supervisorName', e.target.value)}
              className="border-b border-black w-full focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold mb-2">Declaration</label>
            <div className="text-sm p-2 border border-gray-300 bg-gray-50">
              I <strong>confirm</strong> that I have incorporated the feedback into my PhD thesis received from my supervisor, co-supervisor (if any) and other GEC members and is ready for evaluation by the external evaluators. Point by point reply and actions taken are attached as annexure with my signature.
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Student's Signature with Date</label>
          <input
            type="text"
            value={formData.studentSignature}
            onChange={(e) => handleInputChange('studentSignature', e.target.value)}
            className="border-b border-black w-full focus:outline-none"
          />
        </div>
      </div>

      {/* Part II - Supervisor Evaluation */}
      <div className="mb-8 border border-black p-4">
        <h3 className="font-bold mb-4 text-lg">Part-II: To be filled by supervisor</h3>
        <p className="mb-6 text-sm">
          <strong>Please rate the PhD thesis under consideration on a scale of 1-5 (with 1 being the lowest score and 5 being the highest score) for the following questions.</strong>
        </p>

        <div className="space-y-6">
          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">1. The thesis addresses a novel and challenging problem in the said domain.</p>
            <RatingScale 
              name="novelProblem"
              value={formData.novelProblemRating}
              onChange={(value) => handleInputChange('novelProblemRating', value)}
            />
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">2. The thesis describes the related work/prior art in a comprehensive manner.</p>
            <RatingScale 
              name="relatedWork"
              value={formData.relatedWorkRating}
              onChange={(value) => handleInputChange('relatedWorkRating', value)}
            />
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">3. The thesis research advances the state of the art significantly.</p>
            <RatingScale 
              name="stateOfArt"
              value={formData.stateOfArtRating}
              onChange={(value) => handleInputChange('stateOfArtRating', value)}
            />
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">4. The thesis is well written, diagrams/figures are clear, tables are well presented, and thesis chapters are well organized.</p>
            <RatingScale 
              name="writingQuality"
              value={formData.writingQualityRating}
              onChange={(value) => handleInputChange('writingQualityRating', value)}
            />
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">5. The research contributions made in the thesis are strong enough to warrant a PhD degree.</p>
            <RatingScale 
              name="contributions"
              value={formData.contributionsRating}
              onChange={(value) => handleInputChange('contributionsRating', value)}
            />
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">6. I confirm that the student has incorporated the feedback (if any) into his PhD thesis received from co-supervisor (if any) and other GEC members and the thesis is ready for evaluation by the external evaluators.</p>
            <div className="flex gap-8">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="feedbackIncorporated"
                  value="yes"
                  checked={formData.feedbackIncorporated === 'yes'}
                  onChange={(e) => handleInputChange('feedbackIncorporated', e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="feedbackIncorporated"
                  value="no"
                  checked={formData.feedbackIncorporated === 'no'}
                  onChange={(e) => handleInputChange('feedbackIncorporated', e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          <div className="border border-gray-300 p-4">
            <p className="mb-4 font-medium">7. I confirm that the plagiarism has been checked, after incorporating the feedback from GEC, by Quality Enhancement Cell (QEC) and similarity index is <strong>less than 19% (not exceeding 5% from a single source)</strong>.</p>
            <div className="flex gap-8">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plagiarismChecked"
                  value="yes"
                  checked={formData.plagiarismChecked === 'yes'}
                  onChange={(e) => handleInputChange('plagiarismChecked', e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plagiarismChecked"
                  value="no"
                  checked={formData.plagiarismChecked === 'no'}
                  onChange={(e) => handleInputChange('plagiarismChecked', e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block font-bold mb-2">Supervisor (Signature with Date)</label>
          <input
            type="text"
            value={formData.supervisorSignature}
            onChange={(e) => handleInputChange('supervisorSignature', e.target.value)}
            className="border-b border-black w-full focus:outline-none"
          />
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
        <strong>PHDEE-E3-B Form</strong>
      </div>
    </div>
  );
};

export default PHDEEE3B;
