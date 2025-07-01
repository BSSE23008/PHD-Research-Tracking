import { useState } from 'react';
import logo from '../assets/logo.png';
import researchImage from '../assets/research.png';
import './Signup.css';

const Signup = ({ onSwitchToLogin, onSignup }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    // Student specific
    studentId: '',
    enrollmentYear: '',
    researchArea: '',
    advisorEmail: '',
    // Supervisor specific
    title: '',
    department: '',
    institution: '',
    officeLocation: '',
    researchInterests: '',
    maxStudents: '',
    // Admin specific
    adminCode: '',
    agreeToTerms: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await onSignup(formData);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <>
            <div className="input-group">
              <div className="form-row">
                <input
                  type="text"
                  name="studentId"
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
                <select
                  name="enrollmentYear"
                  value={formData.enrollmentYear}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Enrollment Year</option>
                  {Array.from({ length: 10 }, (_, i) => 2025 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-group">
              <input
                type="text"
                name="researchArea"
                placeholder="Research Area"
                value={formData.researchArea}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="email"
                name="advisorEmail"
                placeholder="Advisor Email (Optional)"
                value={formData.advisorEmail}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </>
        );
      
      case 'supervisor':
        return (
          <>
            <div className="input-group">
              <select
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Academic Title</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Research Scientist">Research Scientist</option>
              </select>
            </div>
            <div className="input-group">
              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="institution"
                placeholder="Institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </>
        );
      
      case 'admin':
        return (
          <>
            <div className="input-group">
              <input
                type="text"
                name="adminCode"
                placeholder="Admin Access Code"
                value={formData.adminCode}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                name="institution"
                placeholder="Institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        {/* Left Side - Welcome Section */}
        <div className="signup-welcome-section">
          <div className="welcome-content">
            <div className="welcome-header">
              <img src={logo} alt="PhD Research Tracking" className="welcome-logo" />
              <h1 className="welcome-title">Join Our Research Community</h1>
              <p className="welcome-subtitle">Create your account to start tracking your PhD research journey</p>
            </div>
            
            <div className="research-showcase">
              <img src={researchImage} alt="PhD Research" className="welcome-image" />
            </div>
            
            <button 
              type="button" 
              onClick={onSwitchToLogin} 
              className="switch-button"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="signup-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Fill in your details to get started</p>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="input-group">
                <div className="form-row">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="student">PhD Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {renderRoleSpecificFields()}

              <div className="input-group">
                <div className="password-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <div className="password-container">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    required
                  />
                  <span className="checkmark"></span>
                  I agree to Terms & Conditions
                </label>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="form-footer">
              <p>Already have an account? 
                <button type="button" onClick={onSwitchToLogin} className="link-button">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup; 