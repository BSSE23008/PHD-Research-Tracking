import React, { useState } from 'react';
import { Download, Printer, Eye, X, FileText, User, Calendar, Building, Mail, GraduationCap, Clock, MapPin } from 'lucide-react';

export const FormPreview = ({ formSubmission, onClose }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!formSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center max-w-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Form Data</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">No form submission data available to preview.</p>
          <button 
            onClick={onClose} 
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const formData = typeof formSubmission.form_data === 'string' 
    ? JSON.parse(formSubmission.form_data) 
    : formSubmission.form_data;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Create a new window for printing/PDF generation
      const printWindow = window.open('', '_blank');
      printWindow.document.write(generatePrintableHTML(formSubmission, formData));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePrintableHTML = (submission, data) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PHDEE02-A Form - ${submission.student_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; padding: 20px; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #B45309; padding-bottom: 20px; }
          .header h1 { color: #B45309; font-size: 24px; margin-bottom: 10px; }
          .header h2 { color: #6B7280; font-size: 18px; margin-bottom: 10px; }
          .header p { color: #6B7280; font-size: 14px; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; color: #1F2937; margin-bottom: 15px; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; }
          .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .field { margin-bottom: 12px; }
          .field-label { font-weight: 600; color: #374151; margin-bottom: 4px; display: block; }
          .field-value { color: #6B7280; padding: 8px 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; }
          .field-value.textarea { min-height: 80px; white-space: pre-wrap; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .status-pending { background: #FEF3C7; color: #D97706; }
          .status-approved { background: #D1FAE5; color: #059669; }
          .status-rejected { background: #FEE2E2; color: #DC2626; }
          .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .signature-box { text-align: center; }
          .signature-line { border-top: 2px solid #1F2937; margin-bottom: 8px; height: 50px; }
          .signature-label { font-weight: 600; color: #374151; }
          .date-line { margin-top: 15px; color: #6B7280; }
          @media print { body { padding: 10px; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PhD RESEARCH PROJECT REGISTRATION FORM</h1>
          <h2>PHDEE02-A</h2>
          <p>Form ID: #${submission.id} | Submitted: ${new Date(submission.submitted_at).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}</p>
          <span class="status-badge status-${submission.status}">${submission.status}</span>
        </div>

        <div class="section">
          <div class="section-title">Student Information</div>
          <div class="field-grid">
            <div class="field">
              <span class="field-label">Full Name</span>
              <div class="field-value">${data.studentName || submission.student_name || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Student ID</span>
              <div class="field-value">${data.studentId || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Email Address</span>
              <div class="field-value">${data.studentEmail || submission.student_email || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Program</span>
              <div class="field-value">${data.program || 'PhD'}</div>
            </div>
            <div class="field">
              <span class="field-label">Academic Year</span>
              <div class="field-value">${data.year || new Date().getFullYear()}</div>
            </div>
            <div class="field">
              <span class="field-label">Department</span>
              <div class="field-value">${data.department || 'Computer Science'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Supervisor Information</div>
          <div class="field-grid">
            <div class="field">
              <span class="field-label">Supervisor Name</span>
              <div class="field-value">${data.supervisorName || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Supervisor Email</span>
              <div class="field-value">${data.supervisorEmail || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Title/Position</span>
              <div class="field-value">${data.supervisorTitle || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Department</span>
              <div class="field-value">${data.supervisorDepartment || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Project Details</div>
          <div class="field">
            <span class="field-label">Project Title</span>
            <div class="field-value">${data.projectTitle || submission.project_title || 'N/A'}</div>
          </div>
          <div class="field-grid">
            <div class="field">
              <span class="field-label">Project Type</span>
              <div class="field-value">${data.projectType || 'Research'}</div>
            </div>
            <div class="field">
              <span class="field-label">Estimated Duration</span>
              <div class="field-value">${data.estimatedHours || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Start Date</span>
              <div class="field-value">${data.startDate || 'N/A'}</div>
            </div>
            <div class="field">
              <span class="field-label">Expected Completion</span>
              <div class="field-value">${data.endDate || 'N/A'}</div>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Project Description & Objectives</span>
            <div class="field-value textarea">${data.projectDescription || 'N/A'}</div>
          </div>
          <div class="field">
            <span class="field-label">Research Methodology</span>
            <div class="field-value textarea">${data.methodology || 'N/A'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Additional Information</div>
          <div class="field">
            <span class="field-label">Previous Research Experience</span>
            <div class="field-value textarea">${data.previousExperience || 'N/A'}</div>
          </div>
          <div class="field">
            <span class="field-label">Special Requirements or Resources</span>
            <div class="field-value textarea">${data.specialRequirements || 'N/A'}</div>
          </div>
          <div class="field-grid">
            <div class="field">
              <span class="field-label">Ethics Approval Required</span>
              <div class="field-value">${data.ethicsApproval ? 'Yes' : 'No'}</div>
            </div>
            <div class="field">
              <span class="field-label">Data Protection Agreement</span>
              <div class="field-value">${data.dataProtection ? 'Agreed' : 'Not Specified'}</div>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Student Signature</div>
            <div class="date-line">Date: ${data.studentSignatureDate || '___________'}</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Supervisor Signature</div>
            <div class="date-line">Date: ${data.supervisorSignatureDate || '___________'}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Actions - Hidden when printing */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-amber-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Form Preview</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PHDEE02-A Form - {formSubmission.student_name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              title="Print form"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
              title="Download as PDF"
            >
              <Download className="w-4 h-4 mr-2" />
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </button>
            
            <button 
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              title="Close preview"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-8 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/src/assets/itu-logo.svg" 
                alt="ITU Logo" 
                className="w-16 h-16 bg-white rounded-full p-2"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2">PhD RESEARCH PROJECT REGISTRATION FORM</h1>
            <h2 className="text-xl font-semibold mb-2">PHDEE02-A</h2>
            <div className="flex items-center justify-center space-x-4 text-sm opacity-90">
              <span>Form ID: #{formSubmission.id}</span>
              <span>•</span>
              <span>
                Submitted: {new Date(formSubmission.submitted_at).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                formSubmission.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                formSubmission.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {formSubmission.status === 'pending' && <Clock className="w-4 h-4 mr-1" />}
                {formSubmission.status === 'approved' && <Eye className="w-4 h-4 mr-1" />}
                {formSubmission.status === 'rejected' && <X className="w-4 h-4 mr-1" />}
                Status: {formSubmission.status.charAt(0).toUpperCase() + formSubmission.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Student Information */}
            <FormSection
              title="Student Information"
              icon={<User className="w-5 h-5" />}
              fields={[
                { label: 'Full Name', value: formData.studentName || formSubmission.student_name },
                { label: 'Student ID', value: formData.studentId },
                { label: 'Email Address', value: formData.studentEmail || formSubmission.student_email },
                { label: 'Program', value: formData.program || 'PhD' },
                { label: 'Academic Year', value: formData.year || new Date().getFullYear() },
                { label: 'Department', value: formData.department || 'Computer Science' }
              ]}
            />

            {/* Supervisor Information */}
            <FormSection
              title="Supervisor Information"
              icon={<GraduationCap className="w-5 h-5" />}
              fields={[
                { label: 'Supervisor Name', value: formData.supervisorName },
                { label: 'Supervisor Email', value: formData.supervisorEmail },
                { label: 'Title/Position', value: formData.supervisorTitle },
                { label: 'Department', value: formData.supervisorDepartment }
              ]}
            />

            {/* Project Details */}
            <FormSection
              title="Project Details"
              icon={<FileText className="w-5 h-5" />}
              fields={[
                { label: 'Project Title', value: formData.projectTitle || formSubmission.project_title, fullWidth: true },
                { label: 'Project Type', value: formData.projectType || 'Research' },
                { label: 'Estimated Duration', value: formData.estimatedHours },
                { label: 'Start Date', value: formData.startDate },
                { label: 'Expected Completion', value: formData.endDate },
                { label: 'Project Description & Objectives', value: formData.projectDescription, fullWidth: true, textarea: true },
                { label: 'Research Methodology', value: formData.methodology, fullWidth: true, textarea: true }
              ]}
            />

            {/* Additional Information */}
            <FormSection
              title="Additional Information"
              icon={<Building className="w-5 h-5" />}
              fields={[
                { label: 'Previous Research Experience', value: formData.previousExperience, fullWidth: true, textarea: true },
                { label: 'Special Requirements or Resources', value: formData.specialRequirements, fullWidth: true, textarea: true },
                { label: 'Ethics Approval Required', value: formData.ethicsApproval ? 'Yes' : 'No' },
                { label: 'Data Protection Agreement', value: formData.dataProtection ? 'Agreed' : 'Not Specified' }
              ]}
            />

            {/* Signatures */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-amber-600" />
                Signatures & Approval
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 mb-4 h-16"></div>
                  <p className="font-semibold text-gray-900 dark:text-white">Student Signature</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Date: {formData.studentSignatureDate || '_____________'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="border-t-2 border-gray-400 mb-4 h-16"></div>
                  <p className="font-semibold text-gray-900 dark:text-white">Supervisor Signature</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Date: {formData.supervisorSignatureDate || '_____________'}
                  </p>
                </div>
              </div>
            </div>

            {/* Supervisor Comments (if any) */}
            {formSubmission.supervisor_comments && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-amber-600" />
                  Supervisor Comments
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {formSubmission.supervisor_comments}
                  </p>
                  {formSubmission.approved_at && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Reviewed on: {new Date(formSubmission.approved_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Form Section Component
const FormSection = ({ title, icon, fields }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
      <span className="text-amber-600 mr-2">{icon}</span>
      {title}
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field, index) => (
        <div 
          key={index} 
          className={field.fullWidth ? 'md:col-span-2' : ''}
        >
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
          </label>
          {field.textarea ? (
            <div className="min-h-24 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {field.value || 'Not provided'}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              <p className="text-gray-900 dark:text-white">
                {field.value || 'Not provided'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
); 