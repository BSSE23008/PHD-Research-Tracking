import React, { useState, useEffect } from 'react';
import { getAllFaculty, updateUserProfile } from '../utils/api';

const FirstTimeSetup = ({ user, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState([]);
  const [formData, setFormData] = useState({
    primary_supervisor_id: '',
    research_area: user?.research_area || '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFaculty();
  }, []);

  const loadFaculty = async () => {
    try {
      const result = await getAllFaculty();
      if (result.success) {
        // Filter faculty from the same department if user has a department
        const availableFaculty = user?.department_id 
          ? result.data.filter(f => f.department_id === user.department_id)
          : result.data;
        setFaculty(availableFaculty);
      } else {
        console.error('Failed to load faculty:', result.message);
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.primary_supervisor_id) {
      alert('Please select a supervisor');
      return;
    }

    if (!formData.research_area.trim()) {
      alert('Please specify your research area');
      return;
    }

    setSubmitting(true);
    try {
      const result = await updateUserProfile({
        primary_supervisor_id: parseInt(formData.primary_supervisor_id),
        research_area: formData.research_area.trim(),
        academic_year: formData.academic_year
      });

      if (result.success) {
        alert('Profile setup completed successfully!');
        onComplete(result.data);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to PhD Research Tracking System
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Let's complete your profile setup to get started
          </p>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Profile Information
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="ml-2">{user?.first_name} {user?.last_name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2">{user?.email}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Student ID:</span>
                  <span className="ml-2">{user?.student_id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <span className="ml-2">{user?.department}</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Primary Supervisor *
              </label>
              <select
                required
                value={formData.primary_supervisor_id}
                onChange={(e) => setFormData({...formData, primary_supervisor_id: e.target.value})}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a supervisor...</option>
                {faculty.map(supervisor => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.title} {supervisor.first_name} {supervisor.last_name} - {supervisor.designation}
                    {supervisor.research_interests && (
                      ` (${supervisor.research_interests.substring(0, 50)}...)`
                    )}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-600">
                Select a faculty member who will supervise your PhD research.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Research Area *
              </label>
              <textarea
                required
                value={formData.research_area}
                onChange={(e) => setFormData({...formData, research_area: e.target.value})}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Describe your research area or interests (e.g., Machine Learning, Computer Vision, Natural Language Processing, etc.)"
              />
              <p className="mt-2 text-sm text-gray-600">
                Provide a brief description of your research area or interests.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academic_year}
                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Important Note
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    Once you submit this information, you'll be able to start your PhD journey. 
                    Your first step will be to submit a research proposal for admin approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-lg font-medium ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {submitting ? 'Setting up...' : 'Complete Setup'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact the admin or your department for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeSetup; 