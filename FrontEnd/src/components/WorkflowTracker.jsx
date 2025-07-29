import React, { useState, useEffect } from 'react';
import {
  getCurrentWorkflowStage,
  getFormSubmissions,
  getMyGECCommittee,
  getWorkflowStatus,
  formatDate,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';

const WorkflowTracker = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [workflowData, setWorkflowData] = useState({
    currentStage: '',
    currentSemester: '',
    academicYear: '',
    progress: 0,
    completedStages: [],
    submissions: [],
    gecCommittee: null,
    timeline: []
  });

  // Define the complete PhD workflow stages
  const workflowStages = [
    {
      id: 'admission',
      name: 'Admission & Enrollment',
      description: 'Initial admission and enrollment process',
      icon: '🎓',
      forms: ['PHDEE-E1'],
      requirements: ['Complete admission application', 'Enroll in PhD program'],
      duration: '1 month'
    },
    {
      id: 'supervision_consent',
      name: 'Supervisor Assignment',
      description: 'Get supervisor consent and assignment',
      icon: '👨‍🏫',
      forms: ['PHDEE02-A', 'SupervisorConsent'],
      requirements: ['Find and contact supervisor', 'Get supervisor consent', 'Submit assignment form'],
      duration: '2-4 weeks'
    },
    {
      id: 'course_registration',
      name: 'Course Registration',
      description: 'Register for required coursework',
      icon: '📚',
      forms: ['PHDEE-E2-A'],
      requirements: ['Complete course selection', 'Get supervisor approval', 'Register for courses'],
      duration: 'Each semester'
    },
    {
      id: 'gec_formation',
      name: 'GEC Committee Formation',
      description: 'Form Graduate Examination Committee',
      icon: '👥',
      forms: ['PHDEE02-B', 'PHDEE02-C'],
      requirements: ['Submit research proposal', 'Committee member selection', 'Get admin approval'],
      duration: '2-6 months'
    },
    {
      id: 'comprehensive_exam',
      name: 'Comprehensive Examination',
      description: 'Major and minor comprehensive exams',
      icon: '📝',
      forms: ['PHDEE03', 'PHDEE-E1'],
      requirements: ['Complete 18+ credit hours', 'Maintain 3.0+ CGPA', 'Pass comprehensive exams'],
      duration: '3-6 months'
    },
    {
      id: 'research_candidacy',
      name: 'Research Candidacy',
      description: 'Achieve PhD candidacy status',
      icon: '🔬',
      forms: ['PHDEE04-C'],
      requirements: ['Pass comprehensive exams', 'Complete coursework', 'Begin dissertation research'],
      duration: '2-4 months'
    },
    {
      id: 'synopsis_defense',
      name: 'Synopsis Defense',
      description: 'Defend research synopsis/proposal',
      icon: '📋',
      forms: ['PHDEE04-A', 'PHDEE04-B', 'PHDEE-E2-A', 'PHDEE-E2-B'],
      requirements: ['Complete synopsis', 'Schedule defense', 'Successfully defend proposal'],
      duration: '3-6 months'
    },
    {
      id: 'thesis_writing',
      name: 'Dissertation Research',
      description: 'Conduct research and write dissertation',
      icon: '📖',
      forms: ['PHDEE-E3'],
      requirements: ['Conduct original research', 'Regular progress meetings', 'Write dissertation'],
      duration: '18-36 months'
    },
    {
      id: 'thesis_evaluation',
      name: 'Thesis Evaluation',
      description: 'External thesis evaluation',
      icon: '👁️',
      forms: ['PHDEE-E4'],
      requirements: ['Submit completed thesis', 'External evaluator review', 'Address feedback'],
      duration: '3-6 months'
    },
    {
      id: 'thesis_defense',
      name: 'Thesis Defense',
      description: 'Final thesis defense',
      icon: '🎯',
      forms: ['PHDEE05-A', 'PHDEE-E5'],
      requirements: ['Schedule final defense', 'Defend thesis', 'Address committee feedback'],
      duration: '2-4 months'
    },
    {
      id: 'graduation',
      name: 'Graduation',
      description: 'Complete PhD requirements and graduate',
      icon: '🎉',
      forms: [],
      requirements: ['Pass final defense', 'Submit final thesis', 'Complete degree requirements'],
      duration: '1-2 months'
    }
  ];

  useEffect(() => {
    loadWorkflowData();
  }, [user]);

  const loadWorkflowData = async () => {
    setLoading(true);
    try {
      const [
        statusResult,
        submissionsResult,
        gecResult,
        workflowResult
      ] = await Promise.all([
        getCurrentWorkflowStage(),
        getFormSubmissions(),
        getMyGECCommittee(),
        getWorkflowStatus()
      ]);

      let currentStage = 'admission';
      let progress = 0;
      let completedStages = [];

      if (statusResult.success && statusResult.data) {
        currentStage = statusResult.data.stage || 'admission';
        progress = statusResult.data.progress || 0;
        completedStages = statusResult.data.completed_stages || [];
      }

      const submissions = submissionsResult.success ? submissionsResult.data.submissions || [] : [];
      const gecCommittee = gecResult.success ? gecResult.data : null;

      // Calculate progress based on current stage
      const stageIndex = workflowStages.findIndex(stage => stage.id === currentStage);
      if (stageIndex !== -1) {
        progress = ((stageIndex + 1) / workflowStages.length) * 100;
      }

      // Generate timeline from submissions and key events
      const timeline = generateTimeline(submissions, gecCommittee, user);

      setWorkflowData({
        currentStage,
        currentSemester: user?.current_semester || '1st',
        academicYear: user?.academic_year || new Date().getFullYear(),
        progress,
        completedStages,
        submissions,
        gecCommittee,
        timeline
      });

    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeline = (submissions, gecCommittee, user) => {
    const timeline = [];

    // Add enrollment event
    if (user?.enrollment_date) {
      timeline.push({
        id: 'enrollment',
        title: 'Program Enrollment',
        description: 'Enrolled in PhD program',
        date: user.enrollment_date,
        type: 'milestone',
        status: 'completed',
        icon: '🎓'
      });
    }

    // Add supervisor assignment
    if (user?.primary_supervisor_id) {
      timeline.push({
        id: 'supervisor',
        title: 'Supervisor Assigned',
        description: 'Primary supervisor assigned',
        date: user.supervisor_assigned_date || user.enrollment_date,
        type: 'milestone',
        status: 'completed',
        icon: '👨‍🏫'
      });
    }

    // Add GEC committee formation
    if (gecCommittee) {
      timeline.push({
        id: 'gec',
        title: 'GEC Committee Formed',
        description: 'Graduate Examination Committee formed',
        date: gecCommittee.committee_formed_date,
        type: 'milestone',
        status: 'completed',
        icon: '👥'
      });
    }

    // Add form submissions
    submissions.forEach(submission => {
      timeline.push({
        id: `form_${submission.id}`,
        title: `${submission.form_name} Submitted`,
        description: `Status: ${submission.status}`,
        date: submission.submitted_at,
        type: 'form_submission',
        status: submission.status,
        icon: '📝',
        formCode: submission.form_code
      });
    });

    // Sort by date
    return timeline.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getStageStatus = (stage) => {
    const currentIndex = workflowStages.findIndex(s => s.id === workflowData.currentStage);
    const stageIndex = workflowStages.findIndex(s => s.id === stage.id);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStageProgress = (stage) => {
    const submissions = workflowData.submissions.filter(sub => 
      stage.forms.includes(sub.form_code)
    );
    const completed = submissions.filter(sub => sub.status === 'approved').length;
    const total = stage.forms.length;
    
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your PhD journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PhD Journey Tracker</h1>
              <p className="text-gray-600 mt-1">Track your progress through the PhD program</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Current Semester: <span className="font-medium">{workflowData.currentSemester}</span>
              </div>
              <div className="text-sm text-gray-600">
                Academic Year: <span className="font-medium">{workflowData.academicYear}</span>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="mt-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Overall Progress</h2>
              <p className="text-gray-600">
                Current Stage: {getWorkflowStageDisplayName(workflowData.currentStage)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{Math.round(workflowData.progress)}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${workflowData.progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Started</span>
            <span className="font-medium">{getWorkflowStageDisplayName(workflowData.currentStage)}</span>
            <span>Graduation</span>
          </div>
        </div>

        {/* Workflow Stages */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">PhD Workflow Stages</h2>
          
          <div className="space-y-4">
            {workflowStages.map((stage, index) => (
              <WorkflowStage
                key={stage.id}
                stage={stage}
                status={getStageStatus(stage)}
                progress={getStageProgress(stage)}
                isLast={index === workflowStages.length - 1}
                submissions={workflowData.submissions.filter(sub => 
                  stage.forms.includes(sub.form_code)
                )}
                onNavigateToForms={() => onNavigate('forms')}
              />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>
          
          {workflowData.timeline.length > 0 ? (
            <div className="space-y-6">
              {workflowData.timeline.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isLast={index === workflowData.timeline.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">⏳</div>
              <p>Your journey timeline will appear here as you progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WorkflowStage = ({ stage, status, progress, isLast, submissions, onNavigateToForms }) => {
  const [expanded, setExpanded] = useState(status === 'current');

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'current':
        return '🔄';
      case 'upcoming':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'current':
        return 'border-blue-500 bg-blue-50';
      case 'upcoming':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border-l-4 rounded-lg shadow-sm transition-all duration-200 ${getStatusColor()}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl">{stage.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stage.name}</h3>
              <p className="text-sm text-gray-600">{stage.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500">Duration: {stage.duration}</span>
                <span className="flex items-center text-xs text-gray-500">
                  {getStatusIcon()} {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {stage.forms.length > 0 && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  Forms: {submissions.filter(s => s.status === 'approved').length}/{stage.forms.length}
                </div>
                {progress > 0 && (
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              {expanded ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Requirements</h4>
                <ul className="space-y-2">
                  {stage.requirements.map((req, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {stage.forms.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Required Forms</h4>
                  <div className="space-y-2">
                    {stage.forms.map(formCode => {
                      const submission = submissions.find(s => s.form_code === formCode);
                      return (
                        <div key={formCode} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{formCode}</span>
                          {submission ? (
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          ) : (
                            <button
                              onClick={onNavigateToForms}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              Submit →
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Connection line to next stage */}
      {!isLast && (
        <div className="flex justify-center pb-4">
          <div className="w-0.5 h-8 bg-gray-300"></div>
        </div>
      )}
    </div>
  );
};

const TimelineEvent = ({ event, isLast }) => {
  const getEventColor = () => {
    switch (event.status) {
      case 'completed':
      case 'approved':
        return 'bg-green-500';
      case 'current':
      case 'submitted':
        return 'bg-blue-500';
      case 'rejected':
        return 'bg-red-500';
      case 'under_review':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-start space-x-4">
      <div className="flex flex-col items-center">
        <div className={`w-4 h-4 rounded-full ${getEventColor()}`}></div>
        {!isLast && <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>}
      </div>
      
      <div className="flex-1 min-w-0 pb-8">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-lg">{event.icon}</span>
          <h3 className="font-medium text-gray-900">{event.title}</h3>
          <span className="text-sm text-gray-500">
            {formatDate(event.date)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{event.description}</p>
        {event.formCode && (
          <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
            {event.formCode}
          </span>
        )}
      </div>
    </div>
  );
};

export default WorkflowTracker; 