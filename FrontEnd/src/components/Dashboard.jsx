import React, { useState, useEffect } from 'react';
import { 
  FiFileText,
  FiClock,
  FiCheckSquare,
  FiBell,
  FiChevronRight,
  FiCheck,
  FiLock,
  FiUnlock,
  FiUser,
  FiBook,
  FiAward,
  FiBarChart2,
  FiEdit,
  FiEye,
  FiCalendar,
  FiMapPin,
  FiStar,
  FiTrendingUp
} from 'react-icons/fi';

const Dashboard = ({ user = { first_name: 'John', last_name: 'Doe' }, onNavigate, onFormSelect }) => {
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);
  const [selectedPhase, setSelectedPhase] = useState(0);
  const [dashboardData, setDashboardData] = useState({});
  const [expandedPhase, setExpandedPhase] = useState(null);

  // Define all phases with their forms and requirements
  const phases = [
    {
      id: 'admission',
      title: 'Admission Phase',
      subtitle: 'Start your PhD journey',
      icon: <FiUser className="w-6 h-6" />,
      color: 'blue',
      bgGradient: 'from-blue-500 to-blue-600',
      timeline: 'Before 1st Semester',
      description: 'Complete admission requirements and documentation',
      progress: 100,
      status: 'completed',
      forms: [
        { code: 'MERIT_LIST', name: 'Merit List', status: 'completed', required: true },
        { code: 'ADMISSION_OFFER', name: 'Admission Offer Letter', status: 'completed', required: true },
        { code: 'PHDEE01-A', name: 'Admission Acceptance Form', status: 'completed', required: true },
        { code: 'DOCUMENTS', name: 'Supporting Documents', status: 'completed', required: true }
      ]
    },
    {
      id: 'supervision',
      title: 'Supervision Setup',
      subtitle: 'Establish supervision & committee',
      icon: <FiUsers className="w-6 h-6" />,
      color: 'green',
      bgGradient: 'from-green-500 to-green-600',
      timeline: '1st Semester',
      description: 'Set up supervision and graduate examination committee',
      progress: 75,
      status: 'active',
      forms: [
        { code: 'PHDEE02-A', name: 'Supervisor Consent Form', status: 'pending', required: true },
        { code: 'PHDEE02-B', name: 'GEC Formation Form', status: 'locked', required: true },
        { code: 'PHDEE02-C', name: 'Committee Member Change Form', status: 'locked', required: false }
      ]
    },
    {
      id: 'coursework',
      title: 'Coursework Phase',
      subtitle: 'Complete required courses',
      icon: <FiBook className="w-6 h-6" />,
      color: 'purple',
      bgGradient: 'from-purple-500 to-purple-600',
      timeline: 'Year 1-2',
      description: 'Complete all required coursework and maintain good standing',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'COURSE_REG', name: 'Course Registration Forms', status: 'locked', required: true },
        { code: 'COURSEWORK_COMPLETION', name: 'Coursework Completion', status: 'locked', required: true }
      ]
    },
    {
      id: 'comprehensive',
      title: 'Comprehensive Exam',
      subtitle: 'Demonstrate knowledge mastery',
      icon: <FiEdit className="w-6 h-6" />,
      color: 'orange',
      bgGradient: 'from-orange-500 to-orange-600',
      timeline: 'End of Year 2',
      description: 'Pass comprehensive examinations in your field',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'PHDEE03', name: 'Comprehensive Exam Request', status: 'locked', required: true },
        { code: 'PHDEE-E1', name: 'Exam Evaluation Form', status: 'locked', required: true }
      ]
    },
    {
      id: 'synopsis',
      title: 'Synopsis Defense',
      subtitle: 'Defend your research proposal',
      icon: <FiBarChart2 className="w-6 h-6" />, 
      color: 'teal',
      bgGradient: 'from-teal-500 to-teal-600',
      timeline: 'End of Year 2',
      description: 'Present and defend your research synopsis',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'PHDEE04-A', name: 'Synopsis Defense Request', status: 'locked', required: true },
        { code: 'PHDEE04-B', name: 'Defense Scheduling Form', status: 'locked', required: true },
        { code: 'PHDEE-E2-A', name: 'Defense Evaluation Form', status: 'locked', required: true },
        { code: 'PHDEE04-C', name: 'Research Candidacy Request', status: 'locked', required: true }
      ]
    },
    {
      id: 'research',
      title: 'Research & Thesis',
      subtitle: 'Conduct research & write thesis',
      icon: <FiStar className="w-6 h-6" />,
      color: 'red',
      bgGradient: 'from-red-500 to-red-600',
      timeline: 'Year 3-4',
      description: 'Complete research work and thesis writing',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'PHDEE-E3', name: 'Progress Evaluation Forms', status: 'locked', required: true },
        { code: 'PHDEE-E2-C', name: 'Plagiarism Check Form', status: 'locked', required: true },
        { code: 'PHDEE-E3-A', name: 'Thesis Evaluation Form', status: 'locked', required: true }
      ]
    },
    {
      id: 'defense',
      title: 'Thesis Defense',
      subtitle: 'Defend your research work',
      icon: <FiAward className="w-6 h-6" />,
      color: 'indigo',
      bgGradient: 'from-indigo-500 to-indigo-600',
      timeline: 'End of Year 4',
      description: 'Complete in-house and public thesis defense',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'PHDEE05-A', name: 'In-House Defense Scheduling', status: 'locked', required: true },
        { code: 'PHDEE05-B', name: 'Public Defense Scheduling', status: 'locked', required: true },
        { code: 'PHDEE-E5', name: 'In-House Defense Evaluation', status: 'locked', required: true },
        { code: 'PHDEE-E6', name: 'Public Defense Evaluation', status: 'locked', required: true }
      ]
    },
    {
      id: 'completion',
      title: 'Degree Completion',
      subtitle: 'Final requirements & graduation',
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'yellow',
      bgGradient: 'from-yellow-500 to-yellow-600',
      timeline: 'Final Stage',
      description: 'Complete final requirements and receive degree',
      progress: 0,
      status: 'locked',
      forms: [
        { code: 'THESIS_SUBMISSION', name: 'Final Thesis Submission', status: 'locked', required: true },
        { code: 'DEGREE_COMPLETION', name: 'Degree Completion Form', status: 'locked', required: true },
        { code: 'STUDENT_LEAVING', name: 'Student Leaving Form', status: 'locked', required: true }
      ]
    }
  ];

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const mockData = {
          workflowStatus: {
            current_phase: 'supervision',
            semester: 1,
            academic_year: '2024-2025'
          },
          stats: {
            totalSubmissions: 4,
            pendingApprovals: 1,
            pendingForms: 2,
            unreadNotifications: 3
          }
        };
        
        setDashboardData(mockData);
        setActivePhase(1); // Currently in supervision phase
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      case 'active':
      case 'pending':
        return <FiClock className="w-4 h-4 text-yellow-600" />;
      case 'locked':
        return <FiLock className="w-4 h-4 text-gray-400" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'locked':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const PhaseCard = ({ phase, isActive, isSelected, onClick }) => {
    const isUnlocked = phase.status !== 'locked';
    
    return (
      <div
        className={`relative p-6 rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
          isSelected 
            ? `bg-gradient-to-br ${phase.bgGradient} text-white shadow-2xl` 
            : isActive
              ? 'bg-white border-2 border-blue-300 shadow-lg'
              : isUnlocked
                ? 'bg-white border border-gray-200 shadow-md hover:shadow-lg'
                : 'bg-gray-50 border border-gray-100 opacity-75'
        }`}
        onClick={() => isUnlocked && onClick(phase)}
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {phase.status === 'completed' && (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <FiCheck className="w-4 h-4 text-white" />
            </div>
          )}
          {phase.status === 'active' && (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          )}
          {phase.status === 'locked' && (
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <FiLock className="w-4 h-4 text-gray-600" />
            </div>
          )}
        </div>

        {/* Phase Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          isSelected 
            ? 'bg-white bg-opacity-20' 
            : `bg-${phase.color}-100`
        }`}>
          <div className={isSelected ? 'text-white' : `text-${phase.color}-600`}>
            {phase.icon}
          </div>
        </div>

        {/* Phase Info */}
        <h3 className={`text-lg font-bold mb-1 ${
          isSelected ? 'text-white' : 'text-gray-900'
        }`}>
          {phase.title}
        </h3>
        
        <p className={`text-sm mb-3 ${
          isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
        }`}>
          {phase.subtitle}
        </p>

        {/* Timeline */}
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4 ${
          isSelected 
            ? 'bg-white bg-opacity-20 text-white' 
            : 'bg-gray-100 text-gray-700'
        }`}>
          <FiCalendar className="w-3 h-3 mr-1" />
          {phase.timeline}
        </div>

        {/* Progress Bar */}
        {phase.progress > 0 && (
          <div className="mb-4">
            <div className={`w-full h-2 rounded-full ${
              isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-200'
            }`}>
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  isSelected ? 'bg-white' : `bg-${phase.color}-500`
                }`}
                style={{ width: `${phase.progress}%` }}
              ></div>
            </div>
            <p className={`text-xs mt-1 ${
              isSelected ? 'text-white text-opacity-75' : 'text-gray-500'
            }`}>
              {phase.progress}% Complete
            </p>
          </div>
        )}

        {/* Form Count */}
        <div className={`text-sm ${
          isSelected ? 'text-white text-opacity-90' : 'text-gray-600'
        }`}>
          {phase.forms.length} forms • {phase.forms.filter(f => f.required).length} required
        </div>
      </div>
    );
  };

  const FormItem = ({ form, phaseColor, onFormSelect }) => {
    const isUnlocked = form.status !== 'locked';
    
    return (
      <div
        className={`p-4 rounded-lg border transition-all duration-200 ${
          isUnlocked 
            ? 'bg-white hover:shadow-md cursor-pointer' 
            : 'bg-gray-50 opacity-75'
        }`}
        onClick={isUnlocked ? () => onFormSelect?.(form.code) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              form.status === 'completed' 
                ? 'bg-green-100' 
                : form.status === 'pending'
                  ? 'bg-yellow-100'
                  : isUnlocked
                    ? `bg-${phaseColor}-100`
                    : 'bg-gray-100'
            }`}>
              {getStatusIcon(form.status)}
            </div>
            
            <div className="flex-1">
              <h4 className={`font-medium ${
                isUnlocked ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {form.name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{form.code}</span>
                {form.required && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              getStatusColor(form.status)
            }`}>
              {form.status}
            </span>
            
            {/* Remove the button, as the whole item is now clickable */}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your PhD journey...</p>
        </div>
      </div>
    );
  }

  const selectedPhaseData = phases[selectedPhase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                PhD Journey Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.first_name}! Track your progress through your doctoral program.
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Semester</div>
              <div className="text-xl font-semibold text-gray-900">
                Semester {dashboardData.workflowStatus?.semester || 1}, {dashboardData.workflowStatus?.academic_year || '2024-2025'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {dashboardData.stats?.totalSubmissions || 4}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {dashboardData.stats?.pendingApprovals || 1}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Forms</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {dashboardData.stats?.pendingForms || 2}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <FiFileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {dashboardData.stats?.unreadNotifications || 3}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <FiBell className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Phase Timeline */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">PhD Journey Timeline</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, index) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isActive={index === activePhase}
                isSelected={index === selectedPhase}
                onClick={() => setSelectedPhase(index)}
              />
            ))}
          </div>
        </div>

        {/* Selected Phase Details */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedPhaseData.bgGradient} flex items-center justify-center text-white`}>
                {selectedPhaseData.icon}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{selectedPhaseData.title}</h3>
                <p className="text-gray-600">{selectedPhaseData.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                getStatusColor(selectedPhaseData.status)
              }`}>
                {getStatusIcon(selectedPhaseData.status)}
                <span className="ml-2 capitalize">{selectedPhaseData.status}</span>
              </div>
            </div>
          </div>

          {/* Forms List */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Required Forms & Documents</h4>
            {selectedPhaseData.forms.map((form, index) => (
              <FormItem
                key={form.code}
                form={form}
                phaseColor={selectedPhaseData.color}
                onFormSelect={onFormSelect}
              />
            ))}
          </div>

          {/* Phase Actions */}
          {selectedPhaseData.status !== 'locked' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {selectedPhaseData.forms
                  .filter(form => form.status === 'pending' || form.status === 'active')
                  .map(form => (
                    <button
                      key={form.code}
                      onClick={() => onFormSelect?.(form.code)}
                      className={`px-4 py-2 rounded-lg bg-gradient-to-r ${selectedPhaseData.bgGradient} text-white hover:shadow-lg transition-all duration-200`}
                    >
                      Submit {form.name}
                    </button>
                  ))}
                
                <button
                  onClick={() => onNavigate?.('workflow')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Detailed Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Additional component for Users icon (since it's not in the original imports)
const FiUsers = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

export default Dashboard;