import React, { useState } from 'react';
import { Download, Printer, Eye, X, FileText, User, Calendar, Building } from 'lucide-react';
import './FormPreview.css';

export const FormPreview = ({ formSubmission, onClose }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!formSubmission) {
    return (
      <div className="form-preview-container">
        <div className="form-preview-error">
          <FileText size={48} />
          <h3>No Form Data</h3>
          <p>No form submission data available to preview.</p>
          <button onClick={onClose} className="modern-btn modern-btn-primary">
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
      // Use browser's print-to-PDF functionality
      // In a real implementation, you might want to use a library like jsPDF or html2pdf
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PHDEE02-A Form - ${formSubmission.student_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .field { margin-bottom: 10px; }
            .field-label { font-weight: bold; color: #555; }
            .field-value { margin-left: 10px; }
            .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
            .signature-box { width: 200px; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          ${generatePrintableHTML(formSubmission, formData)}
        </body>
        </html>
      `);
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
      <div class="header">
        <h1>PHD RESEARCH PROJECT REGISTRATION FORM</h1>
        <h2>PHDEE02-A</h2>
        <p>Form ID: #${submission.id} | Submitted: ${new Date(submission.submitted_at).toLocaleDateString()}</p>
      </div>

      <div class="section">
        <div class="section-title">Student Information</div>
        <div class="field">
          <span class="field-label">Full Name:</span>
          <span class="field-value">${data.studentName || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Student ID:</span>
          <span class="field-value">${data.studentId || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Email:</span>
          <span class="field-value">${data.studentEmail || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Program:</span>
          <span class="field-value">${data.program || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Academic Year:</span>
          <span class="field-value">${data.year || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Supervisor Information</div>
        <div class="field">
          <span class="field-label">Supervisor Name:</span>
          <span class="field-value">${data.supervisorName || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Supervisor Email:</span>
          <span class="field-value">${data.supervisorEmail || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Title:</span>
          <span class="field-value">${data.supervisorTitle || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Department:</span>
          <span class="field-value">${data.supervisorDepartment || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Project Details</div>
        <div class="field">
          <span class="field-label">Project Title:</span>
          <span class="field-value">${data.projectTitle || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Project Type:</span>
          <span class="field-value">${data.projectType || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Estimated Hours:</span>
          <span class="field-value">${data.estimatedHours || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Start Date:</span>
          <span class="field-value">${data.startDate || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">End Date:</span>
          <span class="field-value">${data.endDate || 'N/A'}</span>
        </div>
        <div class="field">
          <span class="field-label">Project Description:</span>
          <div class="field-value">${data.projectDescription || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Additional Information</div>
        <div class="field">
          <span class="field-label">Previous Experience:</span>
          <div class="field-value">${data.previousExperience || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Special Requirements:</span>
          <div class="field-value">${data.specialRequirements || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Ethics Approval:</span>
          <span class="field-value">${data.ethicsApproval ? 'Yes' : 'No'}</span>
        </div>
        <div class="field">
          <span class="field-label">Data Protection Agreement:</span>
          <span class="field-value">${data.dataProtection ? 'Agreed' : 'Not Agreed'}</span>
        </div>
        <div class="field">
          <span class="field-label">Terms and Conditions:</span>
          <span class="field-value">${data.agreementTerms ? 'Accepted' : 'Not Accepted'}</span>
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div>Student Signature</div>
          <div>Date: ___________</div>
        </div>
        <div class="signature-box">
          <div>Supervisor Signature</div>
          <div>Date: ___________</div>
        </div>
      </div>
    `;
  };

  return (
    <div className="form-preview-container">
      <div className="form-preview-header no-print">
        <div className="preview-title">
          <Eye size={24} />
          <h2>Form Preview</h2>
        </div>
        <div className="preview-actions">
          <button 
            onClick={handlePrint}
            className="preview-btn print-btn"
            title="Print form"
          >
            <Printer size={16} />
            Print
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="preview-btn download-btn"
            disabled={isGeneratingPDF}
            title="Download as PDF"
          >
            <Download size={16} />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </button>
          <button 
            onClick={onClose}
            className="preview-btn close-btn"
            title="Close preview"
          >
            <X size={16} />
            Close
          </button>
        </div>
      </div>

      <div className="form-preview-content printable">
        {/* Form Header */}
        <div className="preview-header-section">
          <h1>PHD RESEARCH PROJECT REGISTRATION FORM</h1>
          <h2>PHDEE02-A</h2>
          <div className="form-meta">
            <div className="meta-item">
              <strong>Form ID:</strong> #{formSubmission.id}
            </div>
            <div className="meta-item">
              <strong>Submitted:</strong> {new Date(formSubmission.submitted_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="meta-item">
              <strong>Status:</strong> 
              <span className={`status-indicator ${formSubmission.supervisor_approval_status || 'pending'}`}>
                {(formSubmission.supervisor_approval_status || 'pending').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="preview-section">
          <h3 className="section-title">
            <User size={20} />
            Student Information
          </h3>
          <div className="section-content">
            <div className="field-grid">
              <div className="field">
                <label>Full Name:</label>
                <span>{formData.studentName || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Student ID:</label>
                <span>{formData.studentId || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Email Address:</label>
                <span>{formData.studentEmail || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Program/Course:</label>
                <span>{formData.program || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Academic Year:</label>
                <span>{formData.year || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisor Information */}
        <div className="preview-section">
          <h3 className="section-title">
            <Building size={20} />
            Supervisor Information
          </h3>
          <div className="section-content">
            <div className="field-grid">
              <div className="field">
                <label>Supervisor Name:</label>
                <span>{formData.supervisorName || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Supervisor Email:</label>
                <span>{formData.supervisorEmail || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Academic Title:</label>
                <span>{formData.supervisorTitle || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Department/Faculty:</label>
                <span>{formData.supervisorDepartment || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="preview-section">
          <h3 className="section-title">
            <FileText size={20} />
            Project Details
          </h3>
          <div className="section-content">
            <div className="field-grid">
              <div className="field full-width">
                <label>Project Title:</label>
                <span>{formData.projectTitle || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Project Type:</label>
                <span>{formData.projectType || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Estimated Hours:</label>
                <span>{formData.estimatedHours || 'N/A'}</span>
              </div>
              <div className="field">
                <label>Start Date:</label>
                <span>{formData.startDate || 'N/A'}</span>
              </div>
              <div className="field">
                <label>End Date:</label>
                <span>{formData.endDate || 'N/A'}</span>
              </div>
              <div className="field full-width">
                <label>Project Description:</label>
                <div className="text-content">
                  {formData.projectDescription || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="preview-section">
          <h3 className="section-title">
            <Calendar size={20} />
            Additional Information
          </h3>
          <div className="section-content">
            <div className="field-grid">
              <div className="field full-width">
                <label>Previous Experience:</label>
                <div className="text-content">
                  {formData.previousExperience || 'N/A'}
                </div>
              </div>
              <div className="field full-width">
                <label>Special Requirements:</label>
                <div className="text-content">
                  {formData.specialRequirements || 'N/A'}
                </div>
              </div>
              <div className="field">
                <label>Ethics Approval Required:</label>
                <span className={`boolean-value ${formData.ethicsApproval ? 'yes' : 'no'}`}>
                  {formData.ethicsApproval ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="field">
                <label>Data Protection Agreement:</label>
                <span className={`boolean-value ${formData.dataProtection ? 'yes' : 'no'}`}>
                  {formData.dataProtection ? 'Agreed' : 'Not Agreed'}
                </span>
              </div>
              <div className="field full-width">
                <label>Terms and Conditions:</label>
                <span className={`boolean-value ${formData.agreementTerms ? 'yes' : 'no'}`}>
                  {formData.agreementTerms ? 'Accepted' : 'Not Accepted'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <h3 className="section-title">Signatures</h3>
          <div className="signature-grid">
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">Student Signature</div>
              <div className="signature-date">Date: ___________</div>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <div className="signature-label">Supervisor Signature</div>
              <div className="signature-date">Date: ___________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 