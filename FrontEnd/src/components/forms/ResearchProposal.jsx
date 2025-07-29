import React, { useState, useEffect } from 'react';
import { submitForm, getAutoFillData } from '../../utils/api';

const ResearchProposal = ({ user, onNavigate, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Student Information (auto-filled)
    studentName: '',
    studentId: '',
    email: '',
    department: '',
    enrollmentYear: '',
    currentSemester: '',
    
    // Research Proposal Details
    proposalTitle: '',
    researchArea: '',
    problemStatement: '',
    objectives: '',
    literatureReview: '',
    methodology: '',
    expectedOutcomes: '',
    timeline: '',
    resources: '',
    
    // Supervisor Information
    proposedSupervisor: '',
    supervisorRationale: '',
    
    // Additional Information
    ethicalConsiderations: '',
    preliminaryWork: '',
    references: '',
    
    // Submission Details
    submissionDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Auto-fill user data
    if (user) {
      const autoFillData = getAutoFillData(user);
      setFormData(prev => ({
        ...prev,
        studentName: `${user.first_name} ${user.last_name}`,
        studentId: user.student_id || '',
        email: user.email || '',
        department: user.department || '',
        enrollmentYear: user.enrollment_year || '',
        currentSemester: user.current_semester || '',
        researchArea: user.research_area || '',
        ...autoFillData
      }));
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      'proposalTitle', 'problemStatement', 'objectives', 
      'methodology', 'expectedOutcomes', 'timeline'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field]?.trim()) {
        alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (formData.proposalTitle.length < 10) {
      alert('Proposal title should be at least 10 characters long');
      return false;
    }
    
    if (formData.problemStatement.length < 100) {
      alert('Problem statement should be at least 100 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        formType: 'research_proposal',
        workflowStage: 'research_candidacy',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        // This will go to admin first, then supervisor
        approvalFlow: ['admin', 'supervisor', 'supervisor_consent', 'gec_formation']
      };

      const result = await submitForm('RESEARCH_PROPOSAL', submissionData);
      
      if (result.success) {
        alert('Research proposal submitted successfully! It will be reviewed by the admin first, then forwarded to your supervisor.');
        if (onNavigate) {
          onNavigate('dashboard');
        }
        if (onSubmit) {
          onSubmit(result.data);
        }
      } else {
        alert(`Submission failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      alert('Failed to submit proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Research Proposal Submission</h1>
            <p className="text-blue-100 mt-1">
              Submit your research proposal for admin review and supervisor approval
            </p>
          </div>

          {/* Workflow Info */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-600 text-xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Approval Workflow</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Your proposal will follow this approval process:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li><strong>Admin Review:</strong> Initial review for completeness and guidelines</li>
                    <li><strong>Supervisor Approval:</strong> Academic review by your proposed supervisor</li>
                    <li><strong>Supervisor Consent Form:</strong> Formal agreement to supervise</li>
                    <li><strong>GEC Committee Formation:</strong> Graduate Evaluation Committee setup</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Student Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </section>

            {/* Research Proposal Details */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Research Proposal</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.proposalTitle}
                    onChange={(e) => handleInputChange('proposalTitle', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a clear and concise title for your research"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.researchArea}
                    onChange={(e) => handleInputChange('researchArea', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Machine Learning, Computer Vision, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Problem Statement *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.problemStatement}
                    onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Clearly define the problem your research aims to address..."
                  />
                  <p className="text-sm text-gray-500 mt-1">Minimum 100 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Objectives *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.objectives}
                    onChange={(e) => handleInputChange('objectives', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List the main objectives of your research..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Literature Review
                  </label>
                  <textarea
                    rows={4}
                    value={formData.literatureReview}
                    onChange={(e) => handleInputChange('literatureReview', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide a brief overview of relevant literature and current state of research..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Methodology *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.methodology}
                    onChange={(e) => handleInputChange('methodology', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your research methodology and approach..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Outcomes *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.expectedOutcomes}
                    onChange={(e) => handleInputChange('expectedOutcomes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="What are the expected outcomes and contributions of your research?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeline *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide a timeline for your research activities..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resources Required
                  </label>
                  <textarea
                    rows={3}
                    value={formData.resources}
                    onChange={(e) => handleInputChange('resources', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List any special resources, equipment, or funding needed..."
                  />
                </div>
              </div>
            </section>

            {/* Supervisor Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Supervisor Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Supervisor
                  </label>
                  <input
                    type="text"
                    value={formData.proposedSupervisor}
                    onChange={(e) => handleInputChange('proposedSupervisor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Name and designation of proposed supervisor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rationale for Supervisor Selection
                  </label>
                  <textarea
                    rows={3}
                    value={formData.supervisorRationale}
                    onChange={(e) => handleInputChange('supervisorRationale', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Why is this supervisor suitable for your research?"
                  />
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ethical Considerations
                  </label>
                  <textarea
                    rows={3}
                    value={formData.ethicalConsiderations}
                    onChange={(e) => handleInputChange('ethicalConsiderations', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any ethical considerations or approvals needed..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preliminary Work Done
                  </label>
                  <textarea
                    rows={3}
                    value={formData.preliminaryWork}
                    onChange={(e) => handleInputChange('preliminaryWork', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any preliminary work or pilot studies completed..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    References
                  </label>
                  <textarea
                    rows={4}
                    value={formData.references}
                    onChange={(e) => handleInputChange('references', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Key references (APA format)..."
                  />
                </div>
              </div>
            </section>

            {/* Submission */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-2 rounded-lg font-medium ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {loading ? 'Submitting...' : 'Submit Research Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResearchProposal; 