import React, { useState } from 'react';
import { User, Mail, Lock, Phone, MapPin, GraduationCap, Building, Users, Calendar } from 'lucide-react';
import './SignUp.css';

const SignUpPage = () => {
  // State to manage form data
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    institution: '',
    department: '',
    // Student specific fields
    studentId: '',
    enrollmentYear: '',
    expectedGraduation: '',
    researchArea: '',
    advisorEmail: '',
    // Advisor/Supervisor specific fields
    title: '',
    officeLocation: '',
    researchInterests: '',
    maxStudents: '',
    yearsExperience: ''
  });

  // State for form validation errors
  const [errors, setErrors] = useState({});
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // Common validation for all roles
    if (!formData.role) newErrors.role = 'Please select a role';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.institution.trim()) newErrors.institution = 'Institution is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';

    // Role-specific validation
    if (formData.role === 'student') {
      if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
      if (!formData.enrollmentYear) newErrors.enrollmentYear = 'Enrollment year is required';
      if (!formData.researchArea.trim()) newErrors.researchArea = 'Research area is required';
      if (!formData.advisorEmail.trim()) newErrors.advisorEmail = 'Advisor email is required';
    } else if (formData.role === 'advisor' || formData.role === 'supervisor') {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.officeLocation.trim()) newErrors.officeLocation = 'Office location is required';
      if (!formData.researchInterests.trim()) newErrors.researchInterests = 'Research interests are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', formData);
      alert('Account created successfully!');
      
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Error creating account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render role-specific fields
  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'student':
        return (
          <>
            <div className="gridTwoColumns">
              {/* Student ID */}
              <div>
                <label className="label">
                  <GraduationCap size={16} className="icon" />
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className={`input ${errors.studentId ? 'inputError' : ''}`}
                  placeholder="Enter your student ID"
                />
                {errors.studentId && <p className="errorText">{errors.studentId}</p>}
              </div>

              {/* Enrollment Year */}
              <div>
                <label className="label">
                  <Calendar size={16} className="icon" />
                  Enrollment Year
                </label>
                <select
                  name="enrollmentYear"
                  value={formData.enrollmentYear}
                  onChange={handleInputChange}
                  className={`input ${errors.enrollmentYear ? 'inputError' : ''}`}
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 10 }, (_, i) => 2025 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.enrollmentYear && <p className="errorText">{errors.enrollmentYear}</p>}
              </div>
            </div>

            {/* Expected Graduation */}
            <div>
              <label className="label">
                Expected Graduation Year
              </label>
              <select
                name="expectedGraduation"
                value={formData.expectedGraduation}
                onChange={handleInputChange}
                className="input"
              >
                <option value="">Select year</option>
                {Array.from({ length: 10 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Research Area */}
            <div>
              <label className="label">
                Research Area *
              </label>
              <input
                type="text"
                name="researchArea"
                value={formData.researchArea}
                onChange={handleInputChange}
                className={`input ${errors.researchArea ? 'inputError' : ''}`}
                placeholder="e.g., Machine Learning, Quantum Computing"
              />
              {errors.researchArea && <p className="errorText">{errors.researchArea}</p>}
            </div>

            {/* Advisor Email */}
            <div>
              <label className="label">
                Advisor Email *
              </label>
              <input
                type="email"
                name="advisorEmail"
                value={formData.advisorEmail}
                onChange={handleInputChange}
                className={`input ${errors.advisorEmail ? 'inputError' : ''}`}
                placeholder="advisor@university.edu"
              />
              {errors.advisorEmail && <p className="errorText">{errors.advisorEmail}</p>}
            </div>
          </>
        );

      case 'advisor':
      case 'supervisor':
        return (
          <>
            <div className="gridTwoColumns">
              {/* Title */}
              <div>
                <label className="label">
                  Academic Title *
                </label>
                <select
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`input ${errors.title ? 'inputError' : ''}`}
                >
                  <option value="">Select title</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Research Scientist">Research Scientist</option>
                  <option value="Principal Investigator">Principal Investigator</option>
                  <option value="Other">Other</option>
                </select>
                {errors.title && <p className="errorText">{errors.title}</p>}
              </div>

              {/* Office Location */}
              <div>
                <label className="label">
                  <MapPin size={16} className="icon" />
                  Office Location *
                </label>
                <input
                  type="text"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleInputChange}
                  className={`input ${errors.officeLocation ? 'inputError' : ''}`}
                  placeholder="Building Name, Room Number"
                />
                {errors.officeLocation && <p className="errorText">{errors.officeLocation}</p>}
              </div>
            </div>

            {/* Research Interests */}
            <div>
              <label className="label">
                Research Interests *
              </label>
              <textarea
                name="researchInterests"
                value={formData.researchInterests}
                onChange={handleInputChange}
                rows="3"
                className={`input ${errors.researchInterests ? 'inputError' : ''}`}
                style={{ resize: 'vertical' }}
                placeholder="Describe your research interests and areas of expertise"
              />
              {errors.researchInterests && <p className="errorText">{errors.researchInterests}</p>}
            </div>

            {formData.role === 'supervisor' && (
              <div className="gridTwoColumns">
                {/* Max Students */}
                <div>
                  <label className="label">
                    <Users size={16} className="icon" />
                    Maximum Students to Supervise
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    className="input"
                    placeholder="e.g., 5"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="label">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    className="input"
                    placeholder="Years of research experience"
                  />
                </div>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container">
      <div className="maxWidth">
        {/* Header */}
        <div className="header">
          <h1 className="title">
            PhD Research Tracking System
          </h1>
          <p className="subtitle">Create your account to get started</p>
        </div>

        {/* Sign Up Form */}
        <div className="formContainer">
          <div>
            {/* Role Selection */}
            <div className="formGroup">
              <label className="label">
                <User size={16} className="icon" />
                Select Your Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`input ${errors.role ? 'inputError' : ''}`}
              >
                <option value="">Choose your role</option>
                <option value="student">PhD Student</option>
                <option value="advisor">Research Advisor</option>
                <option value="supervisor">Supervisor</option>
              </select>
              {errors.role && <p className="errorText">{errors.role}</p>}
            </div>

            {/* Basic Information */}
            <div className="gridTwoColumns">
              {/* First Name */}
              <div>
                <label className="label">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`input ${errors.firstName ? 'inputError' : ''}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && <p className="errorText">{errors.firstName}</p>}
              </div>

              {/* Last Name */}
              <div>
                <label className="label">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`input ${errors.lastName ? 'inputError' : ''}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && <p className="errorText">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="formGroup">
              <label className="label">
                <Mail size={16} className="icon" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`input ${errors.email ? 'inputError' : ''}`}
                placeholder="your.email@university.edu"
              />
              {errors.email && <p className="errorText">{errors.email}</p>}
            </div>

            {/* Password Fields */}
            <div className="gridTwoColumns">
              {/* Password */}
              <div>
                <label className="label">
                  <Lock size={16} className="icon" />
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input ${errors.password ? 'inputError' : ''}`}
                  placeholder="Create a strong password"
                />
                {errors.password && <p className="errorText">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`input ${errors.confirmPassword ? 'inputError' : ''}`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="errorText">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="formGroup">
              <label className="label">
                <Phone size={16} className="icon" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Institution & Department */}
            <div className="gridTwoColumns">
              {/* Institution */}
              <div>
                <label className="label">
                  <Building size={16} className="icon" />
                  Institution *
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className={`input ${errors.institution ? 'inputError' : ''}`}
                  placeholder="University or Institute name"
                />
                {errors.institution && <p className="errorText">{errors.institution}</p>}
              </div>

              {/* Department */}
              <div>
                <label className="label">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`input ${errors.department ? 'inputError' : ''}`}
                  placeholder="e.g., Computer Science, Physics"
                />
                {errors.department && <p className="errorText">{errors.department}</p>}
              </div>
            </div>

            {/* Role-specific fields */}
            {formData.role && (
              <div>
                <h3 className="sectionTitle">
                  {formData.role === 'student' ? 'Student Information' : 
                   formData.role === 'advisor' ? 'Advisor Information' : 
                   'Supervisor Information'}
                </h3>
                {renderRoleSpecificFields()}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`button ${isSubmitting ? 'buttonDisabled' : ''}`}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="signInLink">
            <p>
              Already have an account?{' '}
              <a href="#" className="link">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;