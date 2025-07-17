import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onSwitchToSignup, onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
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

    const result = await onLogin(formData);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="flex w-full max-w-4xl min-h-[600px] bg-white rounded-3xl shadow-2xl overflow-hidden m-8">
        
        {/* Left Side - Welcome Section */}
        <div className="flex-1 bg-gradient-to-br from-amber-700 to-black flex items-center justify-center p-12 relative">
          <div className="text-center text-white w-full max-w-sm flex flex-col items-center gap-8">
            <div className="text-center">
              <div className="logo-placeholder "></div>
              <h1 className="text-4xl font-bold mb-4 leading-tight">
                Welcome Back
              </h1>
              <p className="text-base font-normal opacity-90 leading-relaxed">
                To keep connected with us please login with your personal information
              </p>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-h-48 bg-white bg-opacity-10 rounded-xl p-8 flex items-center justify-center">
                <div className="text-6xl opacity-60">🔬</div>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={onSwitchToSignup} 
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 uppercase tracking-wide hover:bg-white hover:text-amber-700 hover:-translate-y-1"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-12 bg-white overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-black mb-2 -tracking-wide">
                Sign In
              </h2>
              <p className="text-base text-amber-700 font-normal">
                Use your account credentials
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {error && (
                <div className="bg-red-100 text-red-800 px-4 py-3 rounded-md border border-red-300 text-sm mb-2">
                  {error}
                </div>
              )}
              
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

              <div className="flex items-center justify-between my-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-black text-sm">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-all duration-300 ${formData.rememberMe ? 'bg-amber-700 border-amber-700' : 'border-gray-300 bg-gray-50'}`}>
                    {formData.rememberMe && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  Remember me
                </label>
                <a 
                  href="#" 
                  className="text-amber-700 hover:text-black transition-colors duration-300 font-semibold text-sm hover:underline"
                >
                  Forgot Password?
                </a>
              </div>

              <button 
                type="submit" 
                className="bg-gradient-to-r from-amber-700 to-black text-white border-none px-8 py-4 rounded-full text-base font-semibold cursor-pointer transition-all duration-300 tracking-wide uppercase mt-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                onClick={handleSubmit}
              >
              {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>

            <div className="text-center mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm m-0">
                Don't have an account?
                <button 
                  type="button" 
                  onClick={onSwitchToSignup} 
                  className="bg-none border-none text-amber-700 cursor-pointer font-semibold no-underline transition-all duration-300 p-0 ml-2 text-sm hover:text-black hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;