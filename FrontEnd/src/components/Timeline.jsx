import React, { useState, useEffect } from 'react';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, FileText, User, Calendar,
  Filter, Search, RefreshCw, Eye, Download, TrendingUp, BarChart3
} from 'lucide-react';
import './Timeline.css';

export const Timeline = ({ userEmail, onClose }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  useEffect(() => {
    loadTimelineData();
  }, [userEmail]);

  const loadTimelineData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/forms/supervisor/timeline', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setTimelineData(result.data || []);
      } else {
        throw new Error('Failed to load timeline data');
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
      setError('Failed to load timeline data');
      // Use enhanced mock data when API isn't available
      setTimelineData(getEnhancedMockTimelineData());
    } finally {
      setLoading(false);
    }
  };

  const getEnhancedMockTimelineData = () => [
    {
      id: 1,
      type: 'form_submitted',
      studentName: 'John Doe',
      studentEmail: 'john.doe@student.itu.edu.pk',
      studentId: 'PHD2024001',
      projectTitle: 'Machine Learning Applications in Healthcare Diagnostics',
      status: 'pending',
      timestamp: new Date('2024-01-15T10:30:00'),
      description: 'Student submitted PHDEE02-A form for research approval',
      priority: 'high',
      department: 'Computer Science',
      supervisor: 'Dr. Ahmed Ali'
    },
    {
      id: 2,
      type: 'form_approved',
      studentName: 'Sarah Ahmad',
      studentEmail: 'sarah.ahmad@student.itu.edu.pk',
      studentId: 'PHD2024002',
      projectTitle: 'Blockchain Security in IoT Networks',
      status: 'approved',
      timestamp: new Date('2024-01-14T14:20:00'),
      description: 'Supervisor consent form completed and approved',
      approvalDate: new Date('2024-01-14T14:20:00'),
      comments: 'Excellent research proposal with clear methodology and innovative approach.',
      priority: 'normal',
      department: 'Computer Science',
      supervisor: 'Dr. Ahmed Ali'
    },
    {
      id: 3,
      type: 'form_submitted',
      studentName: 'Ali Hassan',
      studentEmail: 'ali.hassan@student.itu.edu.pk',
      studentId: 'PHD2024003',
      projectTitle: 'AI Ethics in Autonomous Decision Making Systems',
      status: 'pending',
      timestamp: new Date('2024-01-13T09:15:00'),
      description: 'Student submitted PHDEE02-A form for research approval',
      priority: 'normal',
      department: 'Computer Science',
      supervisor: 'Dr. Ahmed Ali'
    },
    {
      id: 4,
      type: 'form_rejected',
      studentName: 'Fatima Khan',
      studentEmail: 'fatima.khan@student.itu.edu.pk',
      studentId: 'PHD2024004',
      projectTitle: 'Quantum Computing for Enhanced Cryptographic Security',
      status: 'rejected',
      timestamp: new Date('2024-01-12T16:45:00'),
      description: 'Supervisor consent form reviewed and feedback provided',
      rejectionDate: new Date('2024-01-12T16:45:00'),
      comments: 'Research scope needs refinement. Please provide more detailed methodology and clearer objectives.',
      priority: 'normal',
      department: 'Computer Science',
      supervisor: 'Dr. Ahmed Ali'
    },
    {
      id: 5,
      type: 'form_approved',
      studentName: 'Hassan Malik',
      studentEmail: 'hassan.malik@student.itu.edu.pk',
      studentId: 'PHD2024005',
      projectTitle: 'Deep Learning for Medical Image Analysis',
      status: 'approved',
      timestamp: new Date('2024-01-10T11:30:00'),
      description: 'Supervisor consent form completed and approved',
      approvalDate: new Date('2024-01-10T11:30:00'),
      comments: 'Well-structured research proposal with practical applications.',
      priority: 'normal',
      department: 'Computer Science',
      supervisor: 'Dr. Ahmed Ali'
    }
  ];

  const getStatusIcon = (status, type) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return badges[priority] || badges.normal;
  };

  const filteredAndSortedData = () => {
    let filtered = timelineData.filter(item => {
      const matchesFilter = filter === 'all' || item.status === filter;
      const matchesSearch = searchTerm === '' || 
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTimeframe = selectedTimeframe === 'all' || (() => {
        const itemDate = new Date(item.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        
        switch (selectedTimeframe) {
          case 'today': return diffDays === 0;
          case 'week': return diffDays <= 7;
          case 'month': return diffDays <= 30;
          case 'quarter': return diffDays <= 90;
          default: return true;
        }
      })();
      
      return matchesFilter && matchesSearch && matchesTimeframe;
    });

    // Sort the filtered data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'student':
          return a.studentName.localeCompare(b.studentName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priority':
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getTimelineStats = () => {
    const total = timelineData.length;
    const pending = timelineData.filter(item => item.status === 'pending').length;
    const approved = timelineData.filter(item => item.status === 'approved').length;
    const rejected = timelineData.filter(item => item.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getTimelineStats();
  const filteredData = filteredAndSortedData();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          <span className="ml-4 text-gray-600 dark:text-gray-400">Loading timeline...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Timeline</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button 
          onClick={loadTimelineData} 
          className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center mx-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline & Activity</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track all form activities and approvals chronologically
            </p>
          </div>
          <button
            onClick={loadTimelineData}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-500" />
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Approved</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students, projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Status ({timelineData.length})</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>

            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="student">By Student</option>
              <option value="status">By Status</option>
              <option value="priority">By Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No activities found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filter !== 'all' || selectedTimeframe !== 'all'
                ? 'No activities match your current filters. Try adjusting your search criteria.'
                : 'No form activities have been recorded yet.'
              }
            </p>
            {(searchTerm || filter !== 'all' || selectedTimeframe !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setSelectedTimeframe('all');
                }}
                className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-6">
              {filteredData.map((item, index) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  isLast={index === filteredData.length - 1}
                  getStatusIcon={getStatusIcon}
                  getStatusBadge={getStatusBadge}
                  getPriorityBadge={getPriorityBadge}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Item Component
const TimelineItem = ({ 
  item, 
  isLast, 
  getStatusIcon, 
  getStatusBadge, 
  getPriorityBadge, 
  formatRelativeTime 
}) => (
  <div className="relative">
    {/* Timeline Line */}
    {!isLast && (
      <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-600"></div>
    )}
    
    <div className="flex items-start space-x-4">
      {/* Status Icon */}
      <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-full">
        {getStatusIcon(item.status, item.type)}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {item.studentName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                {item.priority && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student ID: {item.studentId} | {item.studentEmail}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatRelativeTime(item.timestamp)}
              </div>
              <div className="mt-1">
                {new Date(item.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          {/* Project Details */}
          <div className="mb-4">
            <div className="flex items-start space-x-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.projectTitle}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Comments */}
          {item.comments && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Supervisor Comments:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {item.comments}
              </p>
            </div>
          )}
          
          {/* Additional Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Department: {item.department}</span>
              <span>Supervisor: {item.supervisor}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-amber-600 hover:text-amber-700 flex items-center">
                <Eye className="w-3 h-3 mr-1" />
                View Details
              </button>
              <button className="text-gray-600 hover:text-gray-700 flex items-center dark:text-gray-400 dark:hover:text-gray-300">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
); 