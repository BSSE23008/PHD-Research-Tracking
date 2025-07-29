import React, { useState, useEffect } from 'react';
import {
  getWorkflowAnalytics,
  getAdminDashboardOverview,
  getFormAnalytics,
  getAllStudents,
  getAllFaculty,
  getFormSubmissions,
  getAllGECCommittees,
  getDepartmentStatistics,
  formatDate
} from '../utils/api';

const ReportsAnalytics = ({ user, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    workflow: {},
    forms: {},
    departments: {},
    students: [],
    submissions: [],
    trends: {}
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        overviewResult,
        workflowResult,
        formsResult,
        studentsResult,
        submissionsResult,
        committeesResult,
        deptResult
      ] = await Promise.all([
        getAdminDashboardOverview(),
        getWorkflowAnalytics(),
        getFormAnalytics(),
        getAllStudents(),
        getFormSubmissions({ date_range: dateRange }),
        getAllGECCommittees(),
        getDepartmentStatistics()
      ]);

      const processedData = {
        overview: overviewResult.success ? overviewResult.data : {},
        workflow: workflowResult.success ? workflowResult.data : {},
        forms: formsResult.success ? formsResult.data : {},
        students: studentsResult.success ? studentsResult.data : [],
        submissions: submissionsResult.success ? submissionsResult.data.submissions || [] : [],
        committees: committeesResult.success ? committeesResult.data : [],
        departments: deptResult.success ? deptResult.data : {},
        trends: calculateTrends(submissionsResult.data?.submissions || [])
      };

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTrends = (submissions) => {
    const now = new Date();
    const periods = {
      thisWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastWeek: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      thisMonth: new Date(now.getFullYear(), now.getMonth(), 1),
      lastMonth: new Date(now.getFullYear(), now.getMonth() - 1, 1)
    };

    const trends = {};
    
    // Submission trends
    trends.submissions = {
      thisWeek: submissions.filter(s => new Date(s.submitted_at) >= periods.thisWeek).length,
      lastWeek: submissions.filter(s => 
        new Date(s.submitted_at) >= periods.lastWeek && 
        new Date(s.submitted_at) < periods.thisWeek
      ).length,
      thisMonth: submissions.filter(s => new Date(s.submitted_at) >= periods.thisMonth).length,
      lastMonth: submissions.filter(s => 
        new Date(s.submitted_at) >= periods.lastMonth && 
        new Date(s.submitted_at) < periods.thisMonth
      ).length
    };

    // Approval trends
    const approvedSubmissions = submissions.filter(s => s.status === 'approved');
    trends.approvals = {
      thisWeek: approvedSubmissions.filter(s => new Date(s.approved_at || s.updated_at) >= periods.thisWeek).length,
      lastWeek: approvedSubmissions.filter(s => {
        const date = new Date(s.approved_at || s.updated_at);
        return date >= periods.lastWeek && date < periods.thisWeek;
      }).length
    };

    return trends;
  };

  const getWorkflowDistribution = () => {
    const stages = analyticsData.students.reduce((acc, student) => {
      const stage = student.workflow_stage || 'admission';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(stages).map(([stage, count]) => ({
      stage: stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
      percentage: ((count / analyticsData.students.length) * 100).toFixed(1)
    }));
  };

  const getFormTypeDistribution = () => {
    const forms = analyticsData.submissions.reduce((acc, submission) => {
      const formType = submission.form_code || 'Unknown';
      acc[formType] = (acc[formType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(forms)
      .map(([form, count]) => ({ form, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getApprovalTimeAnalytics = () => {
    const approvedSubmissions = analyticsData.submissions.filter(s => s.status === 'approved' && s.approved_at);
    
    if (approvedSubmissions.length === 0) return { average: 0, distribution: [] };

    const approvalTimes = approvedSubmissions.map(submission => {
      const submitDate = new Date(submission.submitted_at);
      const approveDate = new Date(submission.approved_at);
      return Math.ceil((approveDate - submitDate) / (1000 * 60 * 60 * 24)); // days
    });

    const average = approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length;
    
    const distribution = [
      { range: '0-1 days', count: approvalTimes.filter(t => t <= 1).length },
      { range: '2-3 days', count: approvalTimes.filter(t => t > 1 && t <= 3).length },
      { range: '4-7 days', count: approvalTimes.filter(t => t > 3 && t <= 7).length },
      { range: '8-14 days', count: approvalTimes.filter(t => t > 7 && t <= 14).length },
      { range: '15+ days', count: approvalTimes.filter(t => t > 14).length }
    ];

    return { average: average.toFixed(1), distribution };
  };

  const renderOverview = () => {
    const workflowDist = getWorkflowDistribution();
    const formDist = getFormTypeDistribution();
    const approvalAnalytics = getApprovalTimeAnalytics();

    return (
      <div className="space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Students"
            value={analyticsData.students.length}
            change={`+${analyticsData.trends.submissions?.thisWeek || 0} this week`}
            color="blue"
            icon="🎓"
          />
          <MetricCard
            title="Active Submissions"
            value={analyticsData.submissions.filter(s => s.status === 'submitted').length}
            change={`${analyticsData.trends.submissions?.thisWeek - analyticsData.trends.submissions?.lastWeek || 0} vs last week`}
            color="orange"
            icon="📝"
          />
          <MetricCard
            title="Avg Approval Time"
            value={`${approvalAnalytics.average} days`}
            change="Based on recent approvals"
            color="green"
            icon="⏱️"
          />
          <MetricCard
            title="GEC Committees"
            value={analyticsData.committees.length}
            change="Active committees"
            color="purple"
            icon="👥"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workflow Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Workflow Stage Distribution</h3>
            <div className="space-y-3">
              {workflowDist.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.stage}</span>
                      <span className="text-gray-600">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Type Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Popular Form Types</h3>
            <div className="space-y-3">
              {formDist.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-sm">{item.form}</span>
                  <span className="text-blue-600 font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Approval Time Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Approval Time Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {approvalAnalytics.distribution.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                <div className="text-sm text-gray-600">{item.range}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 text-center">
              <strong>Average approval time: {approvalAnalytics.average} days</strong>
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderStudentAnalytics = () => {
    const semesterDist = analyticsData.students.reduce((acc, student) => {
      const semester = student.current_semester || 'Unknown';
      acc[semester] = (acc[semester] || 0) + 1;
      return acc;
    }, {});

    const departmentDist = analyticsData.students.reduce((acc, student) => {
      const dept = student.department_name || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Semester Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Students by Semester</h3>
            <div className="space-y-3">
              {Object.entries(semesterDist)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([semester, count]) => (
                  <div key={semester} className="flex items-center justify-between">
                    <span className="font-medium">{semester}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">{count}</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / analyticsData.students.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Department Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Students by Department</h3>
            <div className="space-y-3">
              {Object.entries(departmentDist)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="font-medium text-sm">{dept}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">{count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / analyticsData.students.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Student Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Student Progress</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.students.slice(0, 10).map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{student.student_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.department_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.current_semester}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {student.workflow_stage?.replace('_', ' ') || 'admission'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(student.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFormAnalytics = () => {
    const statusDist = analyticsData.submissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1;
      return acc;
    }, {});

    const monthlySubmissions = analyticsData.submissions.reduce((acc, submission) => {
      const month = new Date(submission.submitted_at).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-8">
        {/* Form Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Form Status Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(statusDist).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</div>
                <div className="text-xs text-gray-500">
                  {((count / analyticsData.submissions.length) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Submission Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Submission Trends</h3>
          <div className="space-y-3">
            {Object.entries(monthlySubmissions)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 12)
              .map(([month, count]) => (
                <div key={month} className="flex items-center justify-between">
                  <span className="font-medium">{new Date(month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">{count}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full"
                        style={{ width: `${Math.min((count / Math.max(...Object.values(monthlySubmissions))) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Form Submissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Form</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.submissions
                  .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                  .slice(0, 15)
                  .map(submission => (
                    <tr key={submission.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{submission.form_name}</div>
                          <div className="text-sm text-gray-500">{submission.form_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.student_name}</div>
                        <div className="text-sm text-gray-500">{submission.student_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(submission.submitted_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                          submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          submission.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.current_approval_stage || 'Initial'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">System insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="last_90_days">Last 90 days</option>
                <option value="last_year">Last year</option>
              </select>
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                Back to Admin
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'students', name: 'Students', icon: '🎓' },
              { id: 'forms', name: 'Forms', icon: '📝' },
              { id: 'performance', name: 'Performance', icon: '⚡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'students' && renderStudentAnalytics()}
        {activeTab === 'forms' && renderFormAnalytics()}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-medium mb-2">Performance Analytics Coming Soon</h3>
            <p className="text-gray-600">Advanced performance metrics and system optimization insights.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, color = 'blue', icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`p-3 rounded-full bg-${color}-100 mr-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{change}</p>
      </div>
    </div>
  </div>
);

export default ReportsAnalytics; 