import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, User, Calendar } from 'lucide-react';
import './Timeline.css';

export const Timeline = ({ userEmail, onClose }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

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
      // For now, use mock data when API isn't available
      setTimelineData(getMockTimelineData());
    } finally {
      setLoading(false);
    }
  };

  const getMockTimelineData = () => [
    {
      id: 1,
      type: 'form_submitted',
      studentName: 'John Doe',
      studentEmail: 'john.doe@student.edu',
      projectTitle: 'Machine Learning in Healthcare',
      status: 'pending',
      timestamp: new Date('2024-01-15T10:30:00'),
      description: 'Student submitted PHDEE02-A form for research approval'
    },
    {
      id: 2,
      type: 'form_approved',
      studentName: 'Sarah Smith',
      studentEmail: 'sarah.smith@student.edu',
      projectTitle: 'Quantum Computing Applications',
      status: 'approved',
      timestamp: new Date('2024-01-14T14:20:00'),
      description: 'Supervisor consent form completed and approved'
    },
    {
      id: 3,
      type: 'form_submitted',
      studentName: 'Mike Johnson',
      studentEmail: 'mike.johnson@student.edu',
      projectTitle: 'AI Ethics in Decision Making',
      status: 'pending',
      timestamp: new Date('2024-01-13T09:15:00'),
      description: 'Student submitted PHDEE02-A form for research approval'
    },
    {
      id: 4,
      type: 'form_rejected',
      studentName: 'Emma Wilson',
      studentEmail: 'emma.wilson@student.edu',
      projectTitle: 'Blockchain Security Analysis',
      status: 'rejected',
      timestamp: new Date('2024-01-12T16:45:00'),
      description: 'Supervisor consent form rejected - additional information required'
    }
  ];

  const getStatusIcon = (status, type) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="timeline-icon pending" />;
      case 'approved':
        return <CheckCircle size={20} className="timeline-icon approved" />;
      case 'rejected':
        return <XCircle size={20} className="timeline-icon rejected" />;
      default:
        return <AlertCircle size={20} className="timeline-icon default" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const filteredData = timelineData.filter(item => 
    filter === 'all' || item.status === filter
  );

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

  if (loading) {
    return (
      <div className="timeline-container">
        <div className="timeline-loading">
          <div className="spinner"></div>
          <p>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timeline-container">
        <div className="timeline-error">
          <AlertCircle size={48} />
          <h3>Error Loading Timeline</h3>
          <p>{error}</p>
          <button onClick={loadTimelineData} className="modern-btn modern-btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>Form Submission Timeline</h2>
        <p>Track all form activities and approvals chronologically</p>
        
        <div className="timeline-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({timelineData.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({timelineData.filter(item => item.status === 'pending').length})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({timelineData.filter(item => item.status === 'approved').length})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({timelineData.filter(item => item.status === 'rejected').length})
          </button>
        </div>
      </div>

      <div className="timeline-content">
        {filteredData.length === 0 ? (
          <div className="timeline-empty">
            <Calendar size={48} />
            <h3>No activities found</h3>
            <p>No form activities match the selected filter.</p>
          </div>
        ) : (
          <div className="timeline-list">
            {filteredData.map((item, index) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-marker">
                  {getStatusIcon(item.status, item.type)}
                  {index < filteredData.length - 1 && <div className="timeline-line"></div>}
                </div>
                
                <div className="timeline-content-item">
                  <div className="timeline-item-header">
                    <div className="timeline-item-title">
                      <h4>{item.studentName}</h4>
                      <span 
                        className={`status-badge status-${item.status}`}
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="timeline-item-time">
                      <Calendar size={14} />
                      <span>{formatRelativeTime(item.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="timeline-item-details">
                    <div className="timeline-detail">
                      <User size={14} />
                      <span>{item.studentEmail}</span>
                    </div>
                    <div className="timeline-detail">
                      <FileText size={14} />
                      <span>{item.projectTitle}</span>
                    </div>
                  </div>
                  
                  <p className="timeline-item-description">
                    {item.description}
                  </p>
                  
                  <div className="timeline-item-actions">
                    <button className="timeline-action-btn">
                      View Details
                    </button>
                    {item.status === 'pending' && (
                      <button className="timeline-action-btn primary">
                        Take Action
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 