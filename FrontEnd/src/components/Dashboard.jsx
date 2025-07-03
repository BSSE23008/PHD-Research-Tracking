import { useState, useEffect } from 'react';
// Import icons from the react-icons library
import {
  FiHome, FiUser, FiLogOut, FiSettings, FiHelpCircle, FiBookOpen,
  FiBriefcase, FiGrid, FiBarChart2, FiCheckCircle, FiChevronDown, FiBell
} from 'react-icons/fi';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);

  // This effect simulates fetching data when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Increased time to better see the loading animation
    return () => clearTimeout(timer);
  }, []);

  // A simple loading screen
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  // Helper to render the role-specific card
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
        <div className="welcome-banner">
          <h2>Welcome back, {user?.firstName}! 👋</h2>
          <p>You have successfully logged in. Here's your overview for today.</p>
        </div>

        <div className="dashboard-grid">
          {/* Role-specific dashboard card */}
          {renderRoleDashboard()}

          {/* Quick Actions Card */}
          <div className="card quick-actions-card">
            <div className="card-header">
              <FiBarChart2 className="card-icon" />
              <h3>Quick Actions</h3>
            </div>
            <p>Access your most used features in one click.</p>
            <div className="action-buttons">
              <button className="btn btn-primary"><FiUser /> View Profile</button>
              <button className="btn btn-secondary"><FiSettings /> Account Settings</button>
              <button className="btn btn-secondary"><FiHelpCircle /> Help & Support</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;