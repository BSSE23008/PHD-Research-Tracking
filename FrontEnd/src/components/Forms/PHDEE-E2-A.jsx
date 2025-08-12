import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E2_A = ({ user, onClose, onSubmissionComplete }) => {
  const [formData, setFormData] = useState({
    session: '',
    studentName: '',
    studentId: '',
    // Technical Content Assessment
    originalityMarks: '',
    impactMarks: '',
    competenceMarks: '',
    clarityMarks: '',
    // Written Proposal Assessment
    researchContextMarks: '',
    objectivesMarks: '',
    proposedWorkMarks: '',
    grammarMarks: '',
    // Oral Presentation Assessment
    organizationMarks: '',
    contentSelectionMarks: '',
    visualAidsMarks: '',
    deliveryMarks: '',
    overallEvaluation: '',
    reasonForFailConditional: '',
    additionalComments: '',
    reviewerName: '',
    reviewerSignature: '',
    examinationDate: ''
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

  // Calculate total marks
  const calculateTotal = () => {
    const marks = [
      formData.originalityMarks,
      formData.impactMarks,
      formData.competenceMarks,
      formData.clarityMarks,
      formData.researchContextMarks,
      formData.objectivesMarks,
      formData.proposedWorkMarks,
      formData.grammarMarks,
      formData.organizationMarks,
      formData.contentSelectionMarks,
      formData.visualAidsMarks,
      formData.deliveryMarks
    ];

    const total = marks.reduce((sum, mark) => {
      const num = parseInt(mark) || 0;
      return sum + num;
    }, 0);

    return total;
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
        <p className="text-lg">Your Synopsis Defence Evaluation has been submitted.</p>
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
        <h2 className="text-base font-bold">SYNOPSIS DEFENCE EVALUATION FORM</h2>
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

      {/* Assessment Information */}
      <div className="mb-6">
        <p className="text-sm mb-4">
          Assessment of PhD Synopsis Defense is based on following three aspects evaluated over multiple metrics listed below
        </p>
      </div>

      {/* Metrics Details */}
      <div className="mb-6 text-sm">
        <h3 className="font-bold mb-3">Metrics for assessment of Technical Content</h3>
        <ul className="space-y-2 mb-4">
          <li><strong><i>Originality of the proposed research:</i></strong> The proposed research is a completely new approach to a particular/new problem or a substantive improvement over existing approaches.</li>
          <li><strong><i>Impact of the proposed research:</i></strong> The proposed research will significantly affect its direct beneficiaries, and/or it will influence other scientists or researchers in their research.</li>
          <li><strong><i>Student's technical competence:</i></strong> The student demonstrated command of the field of research and would now be considered an expert on the subject matter presented.</li>
          <li><strong><i>Clarity of Research Plan:</i></strong> The student has clearly identified the various stages of research and experiments that shall lead to completion of his/her PhD along with the timelines.</li>
        </ul>

        <h3 className="font-bold mb-3">Metrics for assessment of Written Proposal</h3>
        <ul className="space-y-2 mb-4">
          <li><strong><i>Research Context:</i></strong> Background and context of proposed research based on extensive review of published literature and other relevant sources are presented in an integrated and synthesized manner.</li>
          <li><strong><i>Statement and Presentation of Research Objectives:</i></strong> Research problem is clearly identified.
            Statement of research is effectively formulated, clearly stated and focused. Research
            objectives reflect knowledge of breadth and depth of the research topic and demonstrate
            ability to synthesize knowledge into distinct, well-structured objectives. </li>
          <li><strong><i>Description of proposed work:</i></strong> Clear articulation of proposed research work is presented with detailed treatment of relevant methods, equipment, and resources. Description of proposed
            work demonstrates understanding of potential risks and payoffs. </li>
          <li><strong><i>Grammar, Mechanics, Organization:</i></strong> Document adheres to rules of Standard English.
            Written material demonstrates proper use of punctuation, abbreviations, acronyms,
            capitalization, spelling, sentence structure, and subject-verb agreement and tense shifts.
            Correct references and citation format used throughout document. Graphs and charts used
            appropriately to present data. </li>
        </ul>

        <h3 className="font-bold mb-3">Metrics for assessment of Oral Presentation</h3>
        <ul className="space-y-2 mb-4">
          <li>
            <strong><i>Organization and Structure of Presentation:</i></strong>
            Material follows logical and systematic sequence, including clear articulation of research objectives;
            relevant methods, equipment, and resources; and risks and payoffs. Presentation culminates in convincing
            arguments for the proposed research. Appropriate and accurate use of technical concepts and details is used to
            support arguments. </li>
          <li>
            <strong><i>Selection of Content:</i></strong>
            Selected content demonstrates command of research field of proposed
            work. Systematic and convincing argument for the contribution of proposed research work
            and thorough understanding of potential obstacles and problem solving strategies is orally
            communicated. Overall ability to explain complex material and select necessary details is
            achieved.
          </li>
          <li>
            <strong><i>Use of Visual Aids:</i></strong>
            Sequence of visual aids (slides) is logical and supports and follows oral
            presentation. Slides are well organized, visually clear, consistent and understandable.
            Photographs, charts, and graphs are used to effectively illustrate main points and/or provide
            necessary details.
          </li>
          <li><strong><i>Delivery, Speaking Skills, and Length:</i></strong>
            Contact with audience is maintained throughout
            presentation. Delivery is well paced, with attention to diction and enunciation, and not read
            from notes or slides. Projection is appropriate to size of audience and room and visual aids are
            within clear view. Adequate time for questions is provided. Answers are thorough and
            command of material is conveyed.
          </li>
        </ul>
      </div>

      {/* Marking Rubric */}
      <div className="mb-6 border border-black p-4">
        <h3 className="font-bold mb-3">Marking Rubric: Each metric of evaluation has to be graded out of 20 marks</h3>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">Qualitative Standing</th>
              <th className="border border-black p-2">Marks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-2">Completely met expectation</td>
              <td className="border border-black p-2">15-20</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Mostly met expectation</td>
              <td className="border border-black p-2">10-14</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Not quite met expectation</td>
              <td className="border border-black p-2">5-9</td>
            </tr>
            <tr>
              <td className="border border-black p-2">Completely failed to meet expectation</td>
              <td className="border border-black p-2">0-4</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Assessment Table */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Assessment</h3>
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr>
              <th className="border border-black p-2">S.No.</th>
              <th className="border border-black p-2">Metric</th>
              <th className="border border-black p-2">Marks Obtained (Max 20)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="3" className="border border-black p-2 font-bold bg-gray-100">Assessment of Technical Content</td>
            </tr>
            <tr>
              <td className="border border-black p-2">1</td>
              <td className="border border-black p-2">Originality of the proposed research</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.originalityMarks}
                  onChange={(e) => handleInputChange('originalityMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">2</td>
              <td className="border border-black p-2">Impact of the proposed research</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.impactMarks}
                  onChange={(e) => handleInputChange('impactMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">3</td>
              <td className="border border-black p-2">Student's technical competence</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.competenceMarks}
                  onChange={(e) => handleInputChange('competenceMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">4</td>
              <td className="border border-black p-2">Clarity of Research Plan</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.clarityMarks}
                  onChange={(e) => handleInputChange('clarityMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td colSpan="3" className="border border-black p-2 font-bold bg-gray-100">Assessment of Written Proposal</td>
            </tr>
            <tr>
              <td className="border border-black p-2">1</td>
              <td className="border border-black p-2">Research Context</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.researchContextMarks}
                  onChange={(e) => handleInputChange('researchContextMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">2</td>
              <td className="border border-black p-2">Statement & Presentation of Research Objectives</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.objectivesMarks}
                  onChange={(e) => handleInputChange('objectivesMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">3</td>
              <td className="border border-black p-2">Description of Proposed Work</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.proposedWorkMarks}
                  onChange={(e) => handleInputChange('proposedWorkMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">4</td>
              <td className="border border-black p-2">Grammar, Mechanics, Organization</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.grammarMarks}
                  onChange={(e) => handleInputChange('grammarMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td colSpan="3" className="border border-black p-2 font-bold bg-gray-100">Assessment of Oral Presentation</td>
            </tr>
            <tr>
              <td className="border border-black p-2">1</td>
              <td className="border border-black p-2">Organization and Structure of Presentation</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.organizationMarks}
                  onChange={(e) => handleInputChange('organizationMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">2</td>
              <td className="border border-black p-2">Selection of Content</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.contentSelectionMarks}
                  onChange={(e) => handleInputChange('contentSelectionMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">3</td>
              <td className="border border-black p-2">Use of Visual Aids</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.visualAidsMarks}
                  onChange={(e) => handleInputChange('visualAidsMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-black p-2">4</td>
              <td className="border border-black p-2">Delivery, Speaking Skills and Length</td>
              <td className="border border-black p-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.deliveryMarks}
                  onChange={(e) => handleInputChange('deliveryMarks', e.target.value)}
                  className="w-full p-1 focus:outline-none"
                />
              </td>
            </tr>
            <tr>
              <td colSpan="2" className="border border-black p-2 font-bold bg-gray-100">Combined Assessment</td>
              <td className="border border-black p-2 font-bold">
                TOTAL: {calculateTotal()} (Max 240)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Overall Evaluation */}
      <div className="mb-6">
        <h3 className="font-bold mb-4">Overall Evaluation (Tick one of the below options):</h3>
        <div className="mb-4">
          <label className="flex items-center mb-2">
            <input
              type="radio"
              name="overallEvaluation"
              value="pass"
              checked={formData.overallEvaluation === 'pass'}
              onChange={(e) => handleInputChange('overallEvaluation', e.target.value)}
              className="mr-2"
            />
            <span className="font-semibold">Pass (120-240):</span> The student passes the PhD Proposal Exam. The student submits a copy of proposal report to the EE Graduate Office.
          </label>
          <label className="flex items-center mb-2">
            <input
              type="radio"
              name="overallEvaluation"
              value="conditional-pass"
              checked={formData.overallEvaluation === 'conditional-pass'}
              onChange={(e) => handleInputChange('overallEvaluation', e.target.value)}
              className="mr-2"
            />
            <span className="font-semibold">Conditional Pass (80-120):</span> The student passes the exam with some compulsory revision requirements to the title/report or presentation.
          </label>
          <label className="flex items-center mb-2">
            <input
              type="radio"
              name="overallEvaluation"
              value="fail"
              checked={formData.overallEvaluation === 'fail'}
              onChange={(e) => handleInputChange('overallEvaluation', e.target.value)}
              className="mr-2"
            />
            <span className="font-semibold">Fail (0-80):</span> The student needs to prepare and reschedule the PhD Proposal Examination
          </label>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Please write reason if you choose fail/conditional pass</label>
          <textarea
            value={formData.reasonForFailConditional}
            onChange={(e) => handleInputChange('reasonForFailConditional', e.target.value)}
            className="border border-black w-full h-24 p-2 focus:outline-none"
            rows="6"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">Additional Comments (If any)</label>
          <textarea
            value={formData.additionalComments}
            onChange={(e) => handleInputChange('additionalComments', e.target.value)}
            className="border border-black w-full h-20 p-2 focus:outline-none"
            rows="5"
          />
        </div>
      </div>

      {/* Reviewer Information */}
      <div className="mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center">
            <label className="inline-block w-40">Name of the Reviewer:</label>
            <input
              type="text"
              value={formData.reviewerName}
              onChange={(e) => handleInputChange('reviewerName', e.target.value)}
              className="border-b border-black inline-block w-64 focus:outline-none"
            />
          </div>
          <div className="flex items-center">
            <label className="inline-block w-40">Signature of the Reviewer:</label>
            <input
              type="text"
              value={formData.reviewerSignature}
              onChange={(e) => handleInputChange('reviewerSignature', e.target.value)}
              className="border-b border-black inline-block w-64 focus:outline-none"
            />
          </div>
          <div className="flex items-center">
            <label className="inline-block w-40">Date of Examination:</label>
            <input
              type="text"
              value={formData.examinationDate}
              onChange={(e) => handleInputChange('examinationDate', e.target.value)}
              className="border-b border-black inline-block w-64 focus:outline-none"
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
        <strong>PHDEE-E2-A Form</strong>
      </div>
    </div>
  );
};

export default PHDEE_E2_A;