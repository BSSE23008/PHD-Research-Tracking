import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiFileText,
  FiClock,
  FiCheck,
  FiX,
  FiEye,
  FiEdit,
  FiSearch,
  FiFilter,
  FiBell,
  FiTrendingUp,
  FiCalendar,
  FiAward,
  FiBookOpen,
  FiChevronRight,
  FiDownload,
  FiMessageCircle,
  FiStar,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

const SupervisorDashboard = ({ user = { title: 'Dr.', first_name: 'Sarah', last_name: 'Johnson', department: 'Electrical Engineering' } }) => {
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [pendingForms, setPendingForms] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [supervisorForms, setSupervisorForms] = useState([]);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        const mockStudents = [
          {
            id: 1,
            first_name: 'Ahmad',
            last_name: 'Khan',
            student_id: 'PhD-EE-2023-001',
            current_stage: 'supervision_consent',
            progress: 15,
            email: 'ahmad.khan@example.com',
            phone: '+92-300-1234567',
            admission_date: '2023-09-01',
            thesis_title: 'Advanced Power Electronics in Renewable Energy Systems',
            pending_forms: 2,
            recent_activity: '2024-01-15T10:30:00Z',
            gpa: 3.8,
            completed_courses: 4,
            total_courses: 8
          },
          {
            id: 2,
            first_name: 'Fatima',
            last_name: 'Ali',
            student_id: 'PhD-EE-2022-005',
            current_stage: 'coursework',
            progress: 45,
            email: 'fatima.ali@example.com',
            phone: '+92-300-9876543',
            admission_date: '2022-09-01',
            thesis_title: 'Machine Learning Applications in Smart Grid Technology',
            pending_forms: 1,
            recent_activity: '2024-01-20T14:15:00Z',
            gpa: 3.9,
            completed_courses: 6,
            total_courses: 8
          },
          {
            id: 3,
            first_name: 'Hassan',
            last_name: 'Ahmed',
            student_id: 'PhD-EE-2021-003',
            current_stage: 'synopsis_defense',
            progress: 75,
            email: 'hassan.ahmed@example.com',
            phone: '+92-300-5555555',
            admission_date: '2021-09-01',
            thesis_title: 'IoT-Based Monitoring Systems for Industrial Applications',
            pending_forms: 0,
            recent_activity: '2024-01-22T09:00:00Z',
            gpa: 3.7,
            completed_courses: 8,
            total_courses: 8,
            defense_date: '2024-02-15'
          }
        ];

        const mockPendingForms = [
          {
            id: 1,
            student_id: 1,
            student_name: 'Ahmad Khan',
            form_name: 'Supervisor Consent Form',
            form_code: 'PHDEE02-A',
            submitted_at: '2024-01-15T10:30:00Z',
            supervisor_approval_status: 'pending',
            priority: 'high',
            deadline: '2024-02-01'
          },
          {
            id: 2,
            student_id: 2,
            student_name: 'Fatima Ali',
            form_code: 'PHDEE02-B',
            form_name: 'GEC Formation Form',
            submitted_at: '2024-01-20T14:15:00Z',
            supervisor_approval_status: 'pending',
            priority: 'medium',
            deadline: '2024-02-10'
          }
        ];

        const mockSupervisorForms = [
          {
            id: 1,
            form_name: 'Annual Research Progress Report',
            form_code: 'SUP-001',
            deadline: '2024-03-01',
            status: 'pending',
            description: 'Submit annual progress report for all supervised students',
            priority: 'high'
          },
          {
            id: 2,
            form_name: 'Faculty Development Form',
            form_code: 'SUP-002',
            deadline: '2024-02-15',
            status: 'completed',
            description: 'Professional development activities documentation',
            priority: 'medium'
          }
        ];

        setStudents(mockStudents);
        setPendingForms(mockPendingForms);
        setSupervisorForms(mockSupervisorForms);
        
        setStats({
          totalStudents: mockStudents.length,
          pendingApprovals: mockPendingForms.length,
          activeStudents: mockStudents.filter(s => s.current_stage !== 'graduation').length,
          averageProgress: Math.round(mockStudents.reduce((acc, s) => acc + s.progress, 0) / mockStudents.length),
          upcomingDeadlines: 3,
          recentActivity: mockStudents.filter(s => {
            const activityDate = new Date(s.recent_activity);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return activityDate > weekAgo;
          }).length
        });
        
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  const getStageColor = (stage) => {
    const stageColors = {
      'admission': 'blue',
      'supervision_consent': 'green',
      'coursework': 'purple',
      'comprehensive_exam': 'orange',
      'synopsis_defense': 'teal',
      'thesis_preparation': 'red',
      'in_house_defense': 'indigo',
      'public_defense': 'pink',
      'graduation': 'gray'
    };
    return stageColors[stage] || 'gray';
  };

  const getStageDisplayName = (stage) => {
    const stageNames = {
      'admission': 'Admission',
      'supervision_consent': 'Supervision Setup',
      'coursework': 'Coursework',
      'comprehensive_exam': 'Comprehensive Exam',
      'synopsis_defense': 'Synopsis Defense',
      'thesis_preparation': 'Thesis Preparation',
      'in_house_defense': 'In-House Defense',
      'public_defense': 'Public Defense',
      'graduation': 'Graduated'
    };
    return stageNames[stage] || stage;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const StatCard = ({ title, value, description, color = 'blue', icon, trend, onClick }) => (
    <div 
      className={`bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer transform hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 mt-2`}>{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="text-right">
          <div className={`p-4 rounded-2xl bg-${color}-100 mb-2`}>
            <div className={`text-${color}-600 text-2xl`}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StudentCard = ({ student, onClick }) => {
    if (!student) return null;
    const stageColor = getStageColor(student.current_stage);
    
    return (
      <div 
        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105 border border-gray-100"
        onClick={() => onClick && onClick(student)}
      >
        <div className="p-6">
          {/* Student Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {(student.first_name || '') + ' ' + (student.last_name || '')}
                </h3>
                <p className="text-sm text-gray-600">{student.student_id || ''}</p>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 bg-${stageColor}-100 text-${stageColor}-800`}>
                  <div className={`w-2 h-2 bg-${stageColor}-500 rounded-full mr-2`}></div>
                  {getStageDisplayName(student.current_stage)}
                </div>
              </div>
            </div>
            
            {student.pending_forms > 0 && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                {student.pending_forms} pending
              </div>
            )}
          </div>

          {/* Thesis Title */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Thesis Title:</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{student.thesis_title}</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">{student.progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r from-${stageColor}-500 to-${stageColor}-600 transition-all duration-500`}
                style={{ width: `${student.progress}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">{student.gpa}</div>
              <div className="text-xs text-gray-600">CGPA</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">{student.completed_courses}/{student.total_courses}</div>
              <div className="text-xs text-gray-600">Courses</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Last activity: {new Date(student.recent_activity).toLocaleDateString()}</span>
              <FiChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FormCard = ({ form, onApprove, onReject, onView }) => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{form.form_name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(form.priority)}`}>
              {form.priority} priority
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Student:</strong> {form.student_name}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            <strong>Form Code:</strong> {form.form_code}
          </p>
          <p className="text-xs text-gray-500">
            Submitted: {new Date(form.submitted_at).toLocaleDateString()}
          </p>
          {form.deadline && (
            <p className="text-xs text-red-600 mt-1">
              <FiClock className="w-3 h-3 inline mr-1" />
              Due: {new Date(form.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => onApprove(form.id)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiCheck className="w-4 h-4" />
          <span>Approve</span>
        </button>
        
        <button
          onClick={() => onReject(form.id)}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <FiX className="w-4 h-4" />
          <span>Reject</span>
        </button>
        
        <button
          onClick={() => onView(form.id)}
          className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <FiEye className="w-4 h-4" />
          <span>View</span>
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <FiMessageCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const SupervisorFormCard = ({ form }) => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{form.form_name}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              form.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {form.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{form.description}</p>
          <p className="text-sm text-gray-600">
            <strong>Form Code:</strong> {form.form_code}
          </p>
          {form.deadline && (
            <p className="text-xs text-orange-600 mt-2">
              <FiCalendar className="w-3 h-3 inline mr-1" />
              Deadline: {new Date(form.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${
          form.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
        }`}>
          {form.status === 'completed' ? (
            <FiCheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <FiClock className="w-6 h-6 text-yellow-600" />
          )}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {form.status === 'pending' && (
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <FiEdit className="w-4 h-4" />
            <span>Submit</span>
          </button>
        )}
        
        <button className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          <FiEye className="w-4 h-4" />
          <span>View</span>
        </button>
        
        {form.status === 'completed' && (
          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
            <FiDownload className="w-4 h-4" />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading supervisor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Supervisor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user.title} {user.first_name} {user.last_name}! Manage your students and approvals.
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">Department</div>
              <div className="text-xl font-semibold text-gray-900">{user.department}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            description="Under supervision"
            color="blue"
            icon={<FiUsers />}
            onClick={() => setCurrentView('students')}
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            description="Awaiting review"
            color="red"
            icon={<FiAlertCircle />}
            onClick={() => setCurrentView('approvals')}
          />
          <StatCard
            title="Active Students"
            value={stats.activeStudents}
            description="Currently enrolled"
            color="green"
            icon={<FiCheckCircle />}
          />
          <StatCard
            title="Avg Progress"
            value={`${stats.averageProgress}%`}
            description="Student progress"
            color="purple"
            icon={<FiTrendingUp />}
          />
          <StatCard
            title="Upcoming Deadlines"
            value={stats.upcomingDeadlines}
            description="Next 30 days"
            color="orange"
            icon={<FiCalendar />}
          />
          <StatCard
            title="Recent Activity"
            value={stats.recentActivity}
            description="Last 7 days"
            color="indigo"
            icon={<FiBell />}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <FiTrendingUp className="w-4 h-4" /> },
                { id: 'students', label: 'My Students', icon: <FiUsers className="w-4 h-4" /> },
                { id: 'approvals', label: 'Pending Approvals', icon: <FiClock className="w-4 h-4" /> },
                { id: 'my-forms', label: 'My Forms', icon: <FiFileText className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentView(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    currentView === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {currentView === 'overview' && (
              <div className="space-y-8">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      onClick={() => setCurrentView('approvals')}
                      className="p-6 text-left border-2 border-dashed border-red-200 rounded-2xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-3 bg-red-100 rounded-full">
                          <FiClock className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-lg font-semibold text-red-600">Review Pending</div>
                      </div>
                      <div className="text-sm text-gray-600">{stats.pendingApprovals} forms awaiting your approval</div>
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('students')}
                      className="p-6 text-left border-2 border-dashed border-blue-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <FiUsers className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-lg font-semibold text-blue-600">View Students</div>
                      </div>
                      <div className="text-sm text-gray-600">{stats.totalStudents} students under supervision</div>
                    </button>
                    
                    <button
                      onClick={() => setCurrentView('my-forms')}
                      className="p-6 text-left border-2 border-dashed border-purple-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 transform hover:scale-105"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-3 bg-purple-100 rounded-full">
                          <FiFileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="text-lg font-semibold text-purple-600">My Forms</div>
                      </div>
                      <div className="text-sm text-gray-600">Forms you need to submit</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Timeline */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Student Activity</h3>
                  <div className="space-y-4">
                    {students.slice(0, 5).map((student) => (
                      <div key={student.id} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.first_name[0]}{student.last_name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                          <div className="text-sm text-gray-500">
                            Currently in {getStageDisplayName(student.current_stage)} • {student.progress}% complete
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {new Date(student.recent_activity).toLocaleDateString()}
                          </div>
                          {student.pending_forms > 0 && (
                            <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium mt-1">
                              {student.pending_forms} pending
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentView === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">My Students ({students.length})</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.isArray(students) && students
                    .filter(student =>
                      (student.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (student.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                      (student.student_id?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    )
                    .map(student => (
                      <StudentCard
                        key={student.id}
                        student={student}
                        onClick={setSelectedStudent}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;