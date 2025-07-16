import React, { useState, useEffect } from 'react';
import {
  getAvailableForms,
  getFormSchema,
  getFormSubmissions,
  saveFormProgress,
  loadFormProgress,
  submitForm,
  getSubmissionById,
  getAutoFillData,
  formatDate,
  getStatusColor,
  getWorkflowStageDisplayName
} from '../utils/api';
import { PHDEE02AForm } from './forms/PHDEE02-A';
import PHDEE03 from './forms/PHDEE03';

const FormManager = ({ user, selectedFormCode, onFormCodeCleared }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'form', 'submission'
  const [availableForms, setAvailableForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [formData, setFormData] = useState({});
  const [formSchema, setFormSchema] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle external form selection
  useEffect(() => {
    if (selectedFormCode && availableForms.length > 0) {
      const formToSelect = availableForms.find(form => form.form_code === selectedFormCode);
      if (formToSelect) {
        handleStartForm(formToSelect);
        // Clear the selected form code to prevent re-selection
        if (onFormCodeCleared) {
          onFormCodeCleared();
        }
      }
    }
  }, [selectedFormCode, availableForms]);

  useEffect(() => {
    if (autoSaveEnabled && selectedForm && Object.keys(formData).length > 0) {
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, autoSaveEnabled, selectedForm]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [availableResult, submissionsResult] = await Promise.all([
        getAvailableForms(),
        getFormSubmissions()
      ]);

      if (availableResult.success) {
        setAvailableForms(availableResult.data);
      }
      if (submissionsResult.success) {
        setSubmissions(submissionsResult.data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormSchema = async (formCode) => {
    try {
      const result = await getFormSchema(formCode);
      if (result.success) {
        setFormSchema(result.data.formType);
        
        // Load existing progress if available
        const progressResult = await loadFormProgress(formCode);
        if (progressResult.success && progressResult.data.formData) {
          setFormData(progressResult.data.formData);
          setCurrentStep(progressResult.data.stepNumber || 0);
        } else {
          // Auto-fill with user data
          const autoFillData = getAutoFillData(user);
          setFormData(autoFillData);
        }
      }
    } catch (error) {
      console.error('Error loading form schema:', error);
    }
  };

  const saveProgress = async () => {
    if (!selectedForm || !formData) return;

    try {
      await saveFormProgress(selectedForm.form_code, formData, currentStep);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedForm || !formData) return;

    setSubmitting(true);
    try {
      const result = await submitForm(selectedForm.form_code, formData);
      if (result.success) {
        alert('Form submitted successfully!');
        setCurrentView('list');
        setSelectedForm(null);
        setFormData({});
        setFormSchema(null);
        loadInitialData(); // Refresh data
      } else {
        alert(`Failed to submit form: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubmission = async (submissionId) => {
    try {
      const result = await getSubmissionById(submissionId);
      if (result.success) {
        setSelectedSubmission(result.data);
        setCurrentView('submission');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
    }
  };

  const handleStartForm = (form) => {
    setSelectedForm(form);
    setCurrentView('form');
    setCurrentStep(0);
    setFormData({});
    
    // Check if this is a custom form component
    if (isCustomFormComponent(form.form_code)) {
      // Custom forms handle their own state and API calls
      return;
    }
    
    loadFormSchema(form.form_code);
  };

  const isCustomFormComponent = (formCode) => {
    const customForms = ['PHDEE02-A', 'PHDEE02-C'];
    return customForms.includes(formCode);
  };

  const renderCustomForm = (formCode) => {
    const commonProps = {
      user: user,
      onClose: () => {
        setCurrentView('list');
        setSelectedForm(null);
      },
      onSubmissionComplete: () => {
        setCurrentView('list');
        setSelectedForm(null);
        loadInitialData(); // Refresh the form list
      }
    };

    switch (formCode) {
      case 'PHDEE02-A':
        return <PHDEE02AForm {...commonProps} />;
      case 'PHDEE02-C':
        return <PHDEE03 {...commonProps} />;
      default:
        return null;
    }
  };

  const DynamicFormRenderer = ({ schema, data, onChange }) => {
    if (!schema || !schema.form_schema) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading form schema...</p>
        </div>
      );
    }

    const renderField = (field, index) => {
      const value = data[field.name] || '';
      
      const handleFieldChange = (newValue) => {
        onChange({
          ...data,
          [field.name]: newValue
        });
      };

      switch (field.type) {
        case 'text':
        case 'email':
        case 'date':
          return (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={field.type}
                value={value}
                onChange={(e) => handleFieldChange(e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'textarea':
          return (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                value={value}
                onChange={(e) => handleFieldChange(e.target.value)}
                required={field.required}
                placeholder={field.placeholder}
                rows={field.rows || 4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'select':
          return (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                value={value}
                onChange={(e) => handleFieldChange(e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select an option</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'checkbox':
          return (
            <div key={index} className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => handleFieldChange(e.target.checked)}
                  required={field.required}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              </div>
              {field.description && (
                <p className="text-sm text-gray-500 mt-1 ml-6">{field.description}</p>
              )}
            </div>
          );

        case 'radio':
          return (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="space-y-2">
                {field.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center">
                    <input
                      type="radio"
                      name={field.name}
                      value={option.value}
                      checked={value === option.value}
                      onChange={(e) => handleFieldChange(e.target.value)}
                      required={field.required}
                      className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        case 'file':
          return (
            <div key={index} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept={field.accept}
                  onChange={(e) => handleFieldChange(e.target.files[0])}
                  required={field.required}
                  className="hidden"
                  id={`file-${field.name}`}
                />
                <label
                  htmlFor={`file-${field.name}`}
                  className="cursor-pointer text-primary-600 hover:text-primary-700"
                >
                  Click to upload file
                </label>
                {value && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {value.name || value}
                  </p>
                )}
              </div>
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {schema.form_schema.fields?.map((field, index) => renderField(field, index))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Management</h2>
          <p className="text-gray-600 mt-1">Manage your PhD forms and submissions</p>
        </div>
        
        {currentView !== 'list' && (
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedForm(null);
              setSelectedSubmission(null);
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to List
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-2xl shadow-soft">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setCurrentView('list')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'list'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Available Forms
            </button>
            <button
              onClick={() => setCurrentView('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'submissions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Submissions
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentView === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableForms.map((form) => (
                <div
                  key={form.form_code}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-medium transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {form.form_name}
                    </h3>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {getWorkflowStageDisplayName(form.workflow_stage)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {form.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Code: {form.form_code}
                    </div>
                    <button
                      onClick={() => handleStartForm(form)}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Start Form
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {currentView === 'submissions' && (
            <div className="space-y-4">
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-medium transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.form_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <div className="font-medium">{formatDate(submission.submitted_at)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Admin Status:</span>
                        <div className="font-medium">{submission.admin_approval_status}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Supervisor Status:</span>
                        <div className="font-medium">{submission.supervisor_approval_status}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleViewSubmission(submission.id)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {currentView === 'form' && selectedForm && (
            <div>
              {isCustomFormComponent(selectedForm.form_code) ? (
                renderCustomForm(selectedForm.form_code)
              ) : (
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedForm.form_name}
                    </h3>
                    <p className="text-gray-600">{selectedForm.description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Auto-save</span>
                      <button
                        onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          autoSaveEnabled ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            autoSaveEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <DynamicFormRenderer
                      schema={formSchema}
                      data={formData}
                      onChange={setFormData}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => saveProgress()}
                      className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Save Progress
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Form'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'submission' && selectedSubmission && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedSubmission.form_name}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Submitted: {formatDate(selectedSubmission.submitted_at)}</span>
                  <span className={`px-2 py-1 rounded-full ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Form Data</h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(selectedSubmission.form_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormManager; 