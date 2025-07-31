import React, { useState, useEffect } from 'react';
import { formatDate, formatDateTime, getStatusColor } from '../utils/api';

const FormViewer = ({ submission, onClose, onApprove, onReject, userType = 'admin' }) => {
  const [activeTab, setActiveTab] = useState('form');
  const [loading, setLoading] = useState(false);

  if (!submission) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">No Form Data</h3>
            <p className="text-gray-600 mb-4">No form submission data available to display.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderFormData = () => {
    if (!submission.form_data) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-gray-600">No form data available</p>
        </div>
      );
    }

    const formData = typeof submission.form_data === 'string' 
      ? JSON.parse(submission.form_data) 
      : submission.form_data;

    return (
      <div className="space-y-6">
        {Object.entries(formData).map(([key, value]) => {
          // Skip internal fields
          if (key.startsWith('_') || key === 'id' || key === 'created_at') {
            return null;
          }

          return (
            <div key={key} className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <div className="text-gray-900">
                {typeof value === 'object' ? (
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm">{String(value || 'Not provided')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStudentInfo = () => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold text-gray-800 mb-3">Student Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">Name:</span>
          <span className="ml-2 text-gray-900">{submission.student_name}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Student ID:</span>
          <span className="ml-2 text-gray-900">{submission.student_id}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Email:</span>
          <span className="ml-2 text-gray-900">{submission.student_email}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Department:</span>
          <span className="ml-2 text-gray-900">{submission.department}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Current Semester:</span>
          <span className="ml-2 text-gray-900">{submission.current_semester}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Academic Year:</span>
          <span className="ml-2 text-gray-900">{submission.academic_year}</span>
        </div>
        {submission.primary_supervisor_name && (
          <div>
            <span className="font-medium text-gray-600">Primary Supervisor:</span>
            <span className="ml-2 text-gray-900">{submission.primary_supervisor_name}</span>
          </div>
        )}
        {submission.co_supervisor_name && (
          <div>
            <span className="font-medium text-gray-600">Co-Supervisor:</span>
            <span className="ml-2 text-gray-900">{submission.co_supervisor_name}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderApprovalStatus = () => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-semibold text-gray-800 mb-3">Approval Status</h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">Overall Status:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.status)}`}>
            {submission.status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">Supervisor Approval:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.supervisor_approval_status)}`}>
            {submission.supervisor_approval_status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">HOD Approval:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.hod_approval_status)}`}>
            {submission.hod_approval_status}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-600">Chairperson Approval:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(submission.chairperson_approval_status)}`}>
            {submission.chairperson_approval_status}
          </span>
        </div>
      </div>
    </div>
  );

  const renderAttachments = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Attachments</h4>
      {submission.attachments && submission.attachments.length > 0 ? (
        <div className="space-y-3">
          {submission.attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {attachment.file_type?.includes('pdf') ? '📄' : 
                   attachment.file_type?.includes('image') ? '🖼️' : '📎'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{attachment.file_name}</p>
                  <p className="text-sm text-gray-600">
                    {attachment.upload_type} • {formatDate(attachment.uploaded_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {attachment.is_verified && (
                  <span className="text-green-600 text-sm">✓ Verified</span>
                )}
                <button
                  onClick={() => window.open(`/api/attachments/${attachment.id}`, '_blank')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No attachments found</p>
      )}
    </div>
  );

  const renderApprovalHistory = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-800">Approval History</h4>
      {submission.approval_history && submission.approval_history.length > 0 ? (
        <div className="space-y-3">
          {submission.approval_history.map((history, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">
                    {history.approval_stage} - {history.approved_by_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {history.previous_status} → {history.new_status}
                  </p>
                  {history.comments && (
                    <p className="text-sm text-gray-700 mt-1 italic">
                      "{history.comments}"
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDateTime(history.action_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No approval history available</p>
      )}
    </div>
  );

  const renderActionButtons = () => {
    // Only show action buttons if the form is pending and user has permission
    const isPending = submission.status === 'submitted';
    const canApprove = isPending && (
      submission.supervisor_approval_status === 'pending' ||
      submission.hod_approval_status === 'pending' ||
      submission.chairperson_approval_status === 'pending'
    );

    if (!canApprove) return null;

    return (
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => onReject && onReject(submission.id)}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Reject'}
        </button>
        <button
          onClick={() => onApprove && onApprove(submission.id)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Approve'}
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {submission.form_name}
            </h2>
            <p className="text-sm text-gray-600">
              Submitted by {submission.student_name} on {formatDate(submission.submitted_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['form', 'info', 'status', 'attachments', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'form' && renderFormData()}
          {activeTab === 'info' && renderStudentInfo()}
          {activeTab === 'status' && renderApprovalStatus()}
          {activeTab === 'attachments' && renderAttachments()}
          {activeTab === 'history' && renderApprovalHistory()}
        </div>

        {/* Action Buttons */}
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default FormViewer; 