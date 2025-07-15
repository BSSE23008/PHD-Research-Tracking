import React, { useState, useEffect } from 'react';
import {
  FiHome, FiUser, FiLogOut, FiSettings, FiHelpCircle, FiBookOpen,
  FiBriefcase, FiGrid, FiBarChart2, FiCheckCircle, FiChevronDown, FiBell,
  FiClock, FiCheck, FiX, FiCircle, FiChevronRight, FiFileText, FiList
} from 'react-icons/fi';

import './Dashboard.css';
// import PHDEE03 from './Forms/PHDEE03'; 
import formComponents  from './Forms'; // Importing form components dynamically


// Sample PhD form data structure
const phdForms = [
  {
    id: 'PHDEE01',
    title: 'PhD Admission Form',
    description: 'Initial admission and eligibility verification',
    status: 'completed',
    dateCompleted: '2024-09-15',
    isRequired: true,
    category: 'admission'
  },
  {
    id: 'PHDEE02',
    title: 'Research Proposal Submission',
    description: 'Detailed research proposal and methodology',
    status: 'completed',
    dateCompleted: '2024-10-20',
    isRequired: true,
    category: 'proposal'
  },
  {
    id: 'PHDEE03',
    title: 'Graduate Examination Committee Formation',
    description: 'Formation of supervision and examination committee',
    status: 'in-progress',
    dateStarted: '2024-11-01',
    isRequired: true,
    category: 'committee'
  },
  {
    id: 'PHDEE04',
    title: 'Coursework Completion Form',
    description: 'Documentation of completed coursework and grades',
    status: 'pending',
    isRequired: true,
    category: 'coursework'
  },
  {
    id: 'PHDEE05',
    title: 'Comprehensive Exam Application',
    description: 'Application for comprehensive examination',
    status: 'pending',
    isRequired: true,
    category: 'examination'
  },
  {
    id: 'PHDEE06',
    title: 'Thesis Proposal Defense',
    description: 'Formal defense of thesis proposal',
    status: 'pending',
    isRequired: true,
    category: 'defense'
  },
  {
    id: 'PHDEE07',
    title: 'Research Progress Report',
    description: 'Annual progress report submission',
    status: 'pending',
    isRequired: true,
    category: 'progress'
  },
  {
    id: 'PHDEE08',
    title: 'Thesis Submission Form',
    description: 'Final thesis submission and format verification',
    status: 'pending',
    isRequired: true,
    category: 'thesis'
  },
  {
    id: 'PHDEE09',
    title: 'Defense Scheduling Form',
    description: 'Schedule final thesis defense',
    status: 'pending',
    isRequired: true,
    category: 'defense'
  },
  {
    id: 'PHDEE10',
    title: 'Graduation Application',
    description: 'Final graduation application and requirements',
    status: 'pending',
    isRequired: true,
    category: 'graduation'
  }
];

// Form component (placeholder for different forms)
// const FormComponent = ({ formId }) => {
  
//   const Component = formId === 'PHDEE03' ? PHDEE03 : () => (
//     <div className="form-placeholder">
//       <div className="placeholder-content">
//         <FiFileText className="placeholder-icon" />
//         <h3>{formId}</h3>
//         <p>This form is not yet implemented. Click here to access the form when it becomes available.</p>
//       </div>
//     </div>
//   );

//   return <Component />;
// };

const FormComponent = ({ formId }) => {
  const Component = formComponents[formId];

  if (Component) {
    return <Component />;
  }

  // Default placeholder if form not found
  return (
    <div className="form-placeholder">
      <div className="placeholder-content">
        <FiFileText className="placeholder-icon" />
        <h3>{formId}</h3>
        <p>This form is not yet implemented.</p>
      </div>
    </div>
  );
};

// Timeline item component
const TimelineItem = ({ form, isActive, onClick }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="timeline-icon completed" />;
      case 'in-progress':
        return <FiCircle className="timeline-icon in-progress" />;
      case 'pending':
        return <FiCircle className="timeline-icon pending" />;
      default:
        return <FiCircle className="timeline-icon" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-default';
    }
  };

  return (
    <div className={`timeline-item ${isActive ? 'active' : ''} ${getStatusColor(form.status)}`} onClick={onClick}>
      <div className="timeline-marker">
        {getStatusIcon(form.status)}
      </div>
      <div className="timeline-content">
        <h4 className="timeline-title">{form.id}</h4>
        <p className="timeline-description">{form.title}</p>
        <div className="timeline-status">
          <span className={`status-badge ${form.status}`}>{form.status.replace('-', ' ')}</span>
          {form.dateCompleted && (
            <span className="timeline-date">Completed: {new Date(form.dateCompleted).toLocaleDateString()}</span>
          )}
          {form.dateStarted && !form.dateCompleted && (
            <span className="timeline-date">Started: {new Date(form.dateStarted).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar component
const Sidebar = ({ isOpen, onClose, activeForm, onFormSelect }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredForms = phdForms.filter(form => {
    if (filter === 'all') return true;
    return form.status === filter;
  });

  const getProgress = () => {
    const completed = phdForms.filter(form => form.status === 'completed').length;
    const total = phdForms.length;
    return { completed, total, percentage: (completed / total) * 100 };
  };

  const progress = getProgress();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <FiList className="sidebar-icon" />
          <h3>PhD Forms Timeline</h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      <div className="progress-section">
        <h4>Overall Progress</h4>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
        </div>
        <p>{progress.completed} of {progress.total} forms completed</p>
      </div>

      <div className="filter-section">
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Forms</option>
          <option value="completed">Completed</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="timeline-container">
        {filteredForms.map((form) => (
          <TimelineItem
            key={form.id}
            form={form}
            isActive={activeForm === form.id}
            onClick={() => onFormSelect(form.id)}
          />
        ))}
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  const handleFormSelect = (formId) => {
    setActiveForm(formId);
  };

  const renderRoleDashboard = () => {
    const roleFeatures = {
      student: [
        "Track Research Progress", "Manage Tasks & Deadlines",
        "Generate Progress Reports", "Communicate with Supervisor"
      ],
      supervisor: [
        "View All Students", "Monitor Progress",
        "Review Submissions", "Schedule Meetings"
      ],
      admin: [
        "Manage Users & Roles", "View System Analytics",
        "Configure Settings", "Oversee Security"
      ]
    };

    const roleInfo = {
      student: { title: "Student Dashboard", icon: <FiBookOpen className="card-icon" /> },
      supervisor: { title: "Supervisor Dashboard", icon: <FiBriefcase className="card-icon" /> },
      admin: { title: "Admin Dashboard", icon: <FiGrid className="card-icon" /> }
    };

    const currentRole = user?.role || 'student';
    const { title, icon } = roleInfo[currentRole];
    const features = roleFeatures[currentRole];

    return (
      <div className="card role-card">
        <div className="card-header">
          {icon}
          <h3>{title}</h3>
        </div>
        <p>Here are your primary functions based on your role.</p>
        <ul className="feature-list">
          {features.map(feature => (
            <li key={feature}><FiCheckCircle className="check-icon" /> {feature}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <FiHome />
          <h1>PhD Tracker</h1>
        </div>
        <div className="header-user-menu">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)}>
            <FiList />
          </button>
          <button className="icon-btn">
            <FiBell />
          </button>
          <div className="user-profile">
            <img src={`https://i.pravatar.cc/40?u=${user.id}`} alt="User Avatar" className="avatar" />
            <div className="user-details">
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <FiChevronDown />
          </div>
          <button onClick={onLogout} className="btn btn-logout">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {!activeForm ? (
          <>
            <div className="welcome-banner">
              <h2>Welcome back, {user?.firstName}! 👋</h2>
              <p>You have successfully logged in. Here's your overview for today.</p>
            </div>

            <div className="dashboard-grid">
              {renderRoleDashboard()}

              <div className="card quick-actions-card">
                <div className="card-header">
                  <FiBarChart2 className="card-icon" />
                  <h3>Quick Actions</h3>
                </div>
                <p>Access your most used features in one click.</p>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={() => setSidebarOpen(true)}>
                    <FiList /> View Forms Timeline
                  </button>
                  <button className="btn btn-secondary">
                    <FiUser /> View Profile
                  </button>
                  <button className="btn btn-secondary">
                    <FiSettings /> Account Settings
                  </button>
                  <button className="btn btn-secondary">
                    <FiHelpCircle /> Help & Support
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="form-view">
            <div className="form-header-nav">
              <button className="btn btn-secondary" onClick={() => setActiveForm(null)}>
                ← Back to Dashboard
              </button>
              <h2>{activeForm}</h2>
            </div>
            <FormComponent formId={activeForm} />
          </div>
        )}
      </main>

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeForm={activeForm}
        onFormSelect={handleFormSelect}
      />
    </div>
  );
};

export default Dashboard;