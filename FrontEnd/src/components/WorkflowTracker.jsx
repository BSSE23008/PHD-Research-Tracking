import React, { useState, useEffect } from 'react';
import { 
  getWorkflowStatus, 
  getFormSubmissions,
  getWorkflowStageDisplayName,
  getStatusColor,
  formatDate 
} from '../utils/api';

const WorkflowTracker = ({ onNavigate, onFormSelect }) => {
  const [workflowData, setWorkflowData] = useState({
    currentStage: '',
    semester: 1,
    academicYear: '',
    stageStartDate: '',
    completedStages: [],
    nextStages: [],
    requirements: {}
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const workflowStages = [
    {
      key: 'admission',
      name: 'Admission',
      description: 'Initial admission to PhD program',
      color: 'green'
    },
    {
      key: 'supervision_consent',
      name: 'Supervision Consent',
      description: 'Secure supervisor consent and agreement',
      color: 'blue'
    },
    {
      key: 'course_registration',
      name: 'Course Registration',
      description: 'Register for required coursework',
      color: 'purple'
    },
    {
      key: 'gec_formation',
      name: 'GEC Formation',
      description: 'Form Graduate Evaluation Committee',
      color: 'indigo'
    },
    {
      key: 'comprehensive_exam',
      name: 'Comprehensive Exam',
      description: 'Complete comprehensive examination',
      color: 'orange'
    },
    {
      key: 'synopsis_defense',
      name: 'Synopsis Defense',
      description: 'Defend research synopsis',
      color: 'red'
    },
    {
      key: 'research_candidacy',
      name: 'Research Candidacy',
      description: 'Achieve PhD candidate status',
      color: 'pink'
    },
    {
      key: 'thesis_writing',
      name: 'Thesis Writing',
      description: 'Complete thesis research and writing',
      color: 'teal'
    },
    {
      key: 'thesis_evaluation',
      name: 'Thesis Evaluation',
      description: 'Submit thesis for evaluation',
      color: 'cyan'
    },
    {
      key: 'thesis_defense',
      name: 'Thesis Defense',
      description: 'Defend completed thesis',
      color: 'yellow'
    },
    {
      key: 'graduation',
      name: 'Graduation',
      description: 'Complete PhD program',
      color: 'emerald'
    }
  ];

  useEffect(() => {
    loadWorkflowData();
  }, []);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      const [workflowResult, submissionsResult] = await Promise.all([
        getWorkflowStatus(),
        getFormSubmissions()
      ]);

      if (workflowResult.success && workflowResult.data) {
        setWorkflowData(workflowResult.data);
      }

      if (submissionsResult.success && submissionsResult.data) {
        setSubmissions(submissionsResult.data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (formCode) => {
    if (onFormSelect && onNavigate) {
      // Navigate to forms page and select the specific form
      onNavigate('forms');
      // Give a small delay to ensure the FormManager component loads
      setTimeout(() => {
        onFormSelect(formCode);
      }, 100);
    } else if (onNavigate) {
      // Just navigate to forms page if no form selection callback
      onNavigate('forms');
    }
  };

  const handleQuickAction = (action) => {
    if (onNavigate) {
      switch (action) {
        case 'submit':
          onNavigate('forms');
          break;
        case 'submissions':
          onNavigate('forms');
          break;
        case 'contact':
          // Could implement contact supervisor functionality
          break;
        default:
          break;
      }
    }
  };

  const getStageStatus = (stageKey) => {
    const currentStageIndex = workflowStages.findIndex(s => s.key === workflowData.currentStage);
    const stageIndex = workflowStages.findIndex(s => s.key === stageKey);
    
    if (stageIndex < currentStageIndex) {
      return 'completed';
    } else if (stageIndex === currentStageIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'current':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      case 'upcoming':
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStageColor = (status, color) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'current':
        return `bg-${color}-50 border-${color}-200`;
      case 'upcoming':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getRelatedForms = (stageKey) => {
    return submissions.filter(sub => {
      const formStageMap = {
        'supervision_consent': ['PHDEE02-A'],
        'course_registration': ['PHDEE02-B'],
        'gec_formation': ['PHDEE02-C'],
        'comprehensive_exam': ['PHDEE03', 'PHDEE1'],
        'synopsis_defense': ['PHDEE04-A', 'PHDEE04-B', 'PHDEE2-A', 'PHDEE2-B'],
        'research_candidacy': ['PHDEE04-C'],
        'thesis_writing': ['PHDEE3'],
        'thesis_evaluation': ['PHDEE2-C', 'PHDEE3-A', 'PHDEE3-B', 'PHDEE4', 'PHDEE4-A'],
        'thesis_defense': ['PHDEE05-A', 'PHDEE5', 'PHDEE05-B', 'PHDEE6'],
        'graduation': ['PHDEE-COMPLETION', 'PHDEE-TRANSCRIPT']
      };
      
      return (formStageMap[stageKey] || []).includes(sub.form_code);
    });
  };

  const getAvailableFormsForStage = (stageKey) => {
    const formStageMap = {
      'supervision_consent': [
        { form_code: 'PHDEE02-A', form_name: 'Supervisor Consent Form' }
      ],
      'course_registration': [
        { form_code: 'PHDEE02-B', form_name: 'Course Registration Form' }
      ],
      'gec_formation': [
        { form_code: 'PHDEE02-C', form_name: 'GEC Formation Form' }
      ],
      'comprehensive_exam': [
        { form_code: 'PHDEE03', form_name: 'Comprehensive Examination Request Form' },
        { form_code: 'PHDEE1', form_name: 'Comprehensive Exam Evaluation Form' }
      ],
      'synopsis_defense': [
        { form_code: 'PHDEE04-A', form_name: 'Synopsis Defense Request Form' },
        { form_code: 'PHDEE04-B', form_name: 'Synopsis Defense Scheduling Form' },
        { form_code: 'PHDEE2-A', form_name: 'Synopsis Defense Evaluation Form' },
        { form_code: 'PHDEE2-B', form_name: 'Synopsis Defense Full Committee Report' }
      ],
      'research_candidacy': [
        { form_code: 'PHDEE04-C', form_name: 'Research Candidacy Request Form' }
      ],
      'thesis_writing': [
        { form_code: 'PHDEE3', form_name: 'GEC Meeting Minutes for Progress Evaluation' }
      ],
      'thesis_evaluation': [
        { form_code: 'PHDEE2-C', form_name: 'PhD Thesis Plagiarism Check Form' },
        { form_code: 'PHDEE3-A', form_name: 'PhD Thesis Evaluation Form' },
        { form_code: 'PHDEE3-B', form_name: 'PhD Thesis External Evaluation Request Form' },
        { form_code: 'PHDEE4', form_name: 'PhD Thesis Evaluation Form (External Evaluators)' },
        { form_code: 'PHDEE4-A', form_name: 'PhD Thesis Submission Form (DPRC)' }
      ],
      'thesis_defense': [
        { form_code: 'PHDEE05-A', form_name: 'PhD Thesis Defense Scheduling Form (In-house)' },
        { form_code: 'PHDEE5', form_name: 'In House Defense Evaluation Form' },
        { form_code: 'PHDEE05-B', form_name: 'PhD Thesis Defense Scheduling Form (Public)' },
        { form_code: 'PHDEE6', form_name: 'PhD Thesis Defense Evaluation Form (Public)' }
      ],
      'graduation': [
        { form_code: 'PHDEE-COMPLETION', form_name: 'PhD Degree Completion Form' },
        { form_code: 'PHDEE-TRANSCRIPT', form_name: 'Final Transcript Request' }
      ]
    };
    
    return formStageMap[stageKey] || [];
  };

  const calculateProgress = () => {
    const currentStageIndex = workflowStages.findIndex(s => s.key === workflowData.currentStage);
    return ((currentStageIndex + 1) / workflowStages.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Overview */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PhD Progress Tracker</h2>
            <p className="text-gray-600 mt-1">Track your journey through the PhD program</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-primary-600">{Math.round(calculateProgress())}%</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">{Math.round(calculateProgress())}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Current Stage</div>
            <div className="text-lg font-semibold text-blue-900">
              {getWorkflowStageDisplayName(workflowData.currentStage)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Semester</div>
            <div className="text-lg font-semibold text-green-900">
              {workflowData.semester} ({workflowData.academicYear})
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium">Stage Started</div>
            <div className="text-lg font-semibold text-purple-900">
              {formatDate(workflowData.stageStartDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Workflow Timeline</h3>
        
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {workflowStages.map((stage) => {
              const status = getStageStatus(stage.key);
              const relatedForms = getRelatedForms(stage.key);
              const availableForms = getAvailableFormsForStage(stage.key);
              
              return (
                <div key={stage.key} className="relative flex items-start space-x-4">
                  {/* Stage Icon */}
                  <div className="relative z-10">
                    {getStageIcon(status)}
                  </div>
                  
                  {/* Stage Content */}
                  <div className={`flex-1 border rounded-lg p-4 ${getStageColor(status, stage.color)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{stage.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        status === 'completed' ? 'bg-green-100 text-green-800' :
                        status === 'current' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {status === 'completed' ? 'Completed' : 
                         status === 'current' ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{stage.description}</p>
                    
                    {/* Related Forms (Submitted) */}
                    {relatedForms.length > 0 && (
                      <div className="space-y-2 mb-3">
                        <h5 className="text-sm font-medium text-gray-700">Submitted Forms:</h5>
                        <div className="space-y-1">
                          {relatedForms.map((form) => (
                            <div 
                              key={form.id} 
                              className="flex items-center justify-between bg-white rounded p-2 cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleFormClick(form.form_code)}
                            >
                              <span className="text-sm text-gray-900 hover:text-primary-600">{form.form_name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(form.status)}`}>
                                {form.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Available Forms (Not yet submitted) */}
                    {availableForms.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Available Forms:</h5>
                        <div className="space-y-1">
                          {availableForms.map((form) => {
                            const isSubmitted = relatedForms.some(rf => rf.form_code === form.form_code);
                            if (isSubmitted) return null;
                            
                            return (
                              <div 
                                key={form.form_code} 
                                className="flex items-center justify-between bg-white rounded p-2 cursor-pointer hover:bg-primary-50 transition-colors border border-dashed border-gray-200 hover:border-primary-300"
                                onClick={() => handleFormClick(form.form_code)}
                              >
                                <span className="text-sm text-gray-900 hover:text-primary-600">{form.form_name}</span>
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                  Click to open
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Stage Requirements */}
                    {status === 'current' && workflowData.requirements && workflowData.requirements[stage.key] && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="text-sm font-medium text-yellow-800 mb-1">Requirements:</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          {workflowData.requirements[stage.key].map((req, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('submit')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-sm font-medium text-gray-900">Submit New Form</div>
            <div className="text-xs text-gray-500 mt-1">Start a new form submission</div>
          </button>
          <button 
            onClick={() => handleQuickAction('submissions')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-sm font-medium text-gray-900">View Submissions</div>
            <div className="text-xs text-gray-500 mt-1">Check status of submitted forms</div>
          </button>
          <button 
            onClick={() => handleQuickAction('contact')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="text-sm font-medium text-gray-900">Contact Supervisor</div>
            <div className="text-xs text-gray-500 mt-1">Get guidance on next steps</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTracker; 