import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './Forms/logo.css';

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
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  name="studentId"
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                />
                <select
                  name="enrollmentYear"
                  value={formData.enrollmentYear}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                >
                  <option value="">Enrollment Year</option>
                  {Array.from({ length: 10 }, (_, i) => 2025 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <input
                type="text"
                name="researchArea"
                placeholder="Research Area"
                value={formData.researchArea}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                required
              />
            </div>
            <div>
              <input
                type="email"
                name="advisorEmail"
                placeholder="Advisor Email"
                value={formData.advisorEmail}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
              />
            </div>
          </>
        );

      case 'supervisor':
        return (
          <>
            <div>
              <select
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                required
              >
                <option value="">Academic Title</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Research Scientist">Research Scientist</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="institution"
                placeholder="Institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                required
              />
            </div>
          </>
        );

      case 'admin':
        return (
          <>
            <div>
              <input
                type="text"
                name="adminCode"
                placeholder="Admin Access Code"
                value={formData.adminCode}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                required
              />
            </div>
            <div>
              <input
                type="text"
                name="institution"
                placeholder="Institution"
                value={formData.institution}
                onChange={handleInputChange}
                className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="flex w-full max-w-4xl min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden m-8">

        {/* Left Side - Welcome Section */}
        <div className="flex-1 bg-gradient-to-br from-amber-700 to-black flex items-center justify-center p-12 relative">
          <div className="text-center text-white w-full max-w-sm flex flex-col items-center gap-8">
            {/* ITU Logo Placeholder */}
            <div className='logo-placeholder'></div> 
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4 leading-tight text-white">
                Join Our Research Community
              </h1>
              <p className="text-base font-normal opacity-90 leading-relaxed">
                Create your account to start tracking your PhD research journey
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-h-48 bg-white bg-opacity-10 rounded-xl p-8 flex items-center justify-center">
                <div className="text-6xl opacity-60">🎓</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSwitchToLogin}
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wide hover:bg-white hover:text-amber-700 hover:-translate-y-1"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-12 bg-white overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-black mb-2 -tracking-wide">
                Create Account
              </h2>
              <p className="text-base text-amber-700 font-normal">
                Fill in your details to get started
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md border border-red-300 text-sm mb-2">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                    required
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                    required
                  />
                </div>
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                />
              </div>

              <div>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                >
                  <option value="student">PhD Student</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {renderRoleSpecificFields()}

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 pr-12 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-700 transition-colors duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-5 py-4 pr-12 border border-gray-300 rounded-lg text-base bg-gray-50 text-black transition-all duration-300 focus:outline-none focus:border-amber-600 focus:bg-white focus:shadow-lg focus:shadow-amber-100"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-amber-700 transition-colors duration-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between my-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-black text-sm">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className="sr-only"
                    required
                  />
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-300 ${formData.agreeToTerms ? 'bg-amber-700 border-amber-700' : 'border-gray-300 bg-gray-50'}`}>
                    {formData.agreeToTerms && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  I agree to Terms & Conditions
                </label>
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-amber-700 to-black text-white border-none px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 tracking-wide uppercase mt-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm m-0">
                Already have an account?
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="bg-none border-none text-amber-700 cursor-pointer font-semibold no-underline transition-all duration-300 p-0 ml-2 text-sm hover:text-black hover:underline"
                >
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