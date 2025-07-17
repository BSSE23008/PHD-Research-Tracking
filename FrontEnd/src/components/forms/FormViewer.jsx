import React from 'react';
import { Download, Printer } from 'lucide-react';
import './FormViewer.css';

export const FormViewer = ({ formSubmission, supervisorConsent, onClose }) => {
  const formData = formSubmission?.form_data || {};
  const submissionDate = new Date(formSubmission?.submitted_at).toLocaleDateString();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PHDEE02-A Form - ${formData.studentName}</title>
          <style>
            ${getFormViewerStyles()}
          </style>
        </head>
        <body>
          ${document.querySelector('.form-viewer-content').innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getFormViewerStyles = () => {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
      .form-template { max-width: 800px; margin: 20px auto; padding: 20px; }
      .template-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
      .university-logo { width: 80px; height: 80px; margin: 0 auto 10px; }
      .template-title { font-size: 16px; font-weight: bold; margin: 5px 0; }
      .template-subtitle { font-size: 14px; margin: 5px 0; }
      .form-section { margin: 20px 0; }
      .section-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
      .info-row { display: flex; margin: 8px 0; }
      .info-label { font-weight: bold; width: 150px; }
      .info-value { flex: 1; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
      .signature-section { margin-top: 30px; }
      .signature-row { display: flex; justify-content: space-between; margin: 20px 0; }
      .signature-box { width: 200px; text-align: center; }
      .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 40px; }
      .approval-status { padding: 10px; border: 2px solid #000; margin: 20px 0; text-align: center; font-weight: bold; }
      .approved { background: #d4edda; color: #155724; }
      .pending { background: #fff3cd; color: #856404; }
      .rejected { background: #f8d7da; color: #721c24; }
      @media print { body { font-size: 11px; } .form-template { margin: 0; padding: 10px; } }
    `;
  };

  return (
    <div className="form-viewer-container">
      {/* Action Bar */}
      <div className="form-viewer-actions">
        <div className="actions-left">
          <button onClick={onClose} className="action-btn secondary">
            ← Back to Dashboard
          </button>
        </div>
        
        <div className="actions-right">
          <button onClick={handlePrint} className="action-btn primary">
            <Printer size={16} />
            Print
          </button>
          <button onClick={handleDownload} className="action-btn primary">
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-viewer-content">
        <div className="form-template">
          {/* Header with Logo */}
          <div className="template-header">
            <div className="university-logo">
              <img 
                src="/src/assets/logo.png" 
                alt="ITU Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div className="template-title">
              INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB
            </div>
            <div className="template-subtitle">
              PHD SUPERVISOR CONSENT FORM
            </div>
            <div className="form-reference">
              <strong>PHDEE02-A Form</strong>
            </div>
            <div className="submission-info">
              Degree: {formData.program} | Session: {formData.year} | Student ID: {formData.studentId}
            </div>
          </div>

          {/* Student Information Section */}
          <div className="form-section">
            <div className="section-title">Student Information</div>
            
            <div className="info-row">
              <div className="info-label">Student Name:</div>
              <div className="info-value">{formData.studentName}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Area of Research:</div>
              <div className="info-value">{formData.projectDescription}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Contact No:</div>
              <div className="info-value">{formData.studentEmail}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Student Signature with date:</div>
              <div className="info-value">{submissionDate}</div>
            </div>
          </div>

          {/* Project Details Section */}
          <div className="form-section">
            <div className="section-title">Project Details</div>
            
            <div className="info-row">
              <div className="info-label">Project Title:</div>
              <div className="info-value">{formData.projectTitle}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Project Type:</div>
              <div className="info-value">{formData.projectType}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Duration:</div>
              <div className="info-value">{formData.startDate} to {formData.endDate}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">Estimated Hours/Week:</div>
              <div className="info-value">{formData.estimatedHours}</div>
            </div>
          </div>

          {/* Supervisor Consent Section */}
          <div className="form-section">
            <div className="section-title">Supervisor Consent</div>
            
            <div style={{ 
              padding: '15px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px',
              margin: '15px 0',
              fontStyle: 'italic'
            }}>
              I am willing to take Mr / Ms / Mrs <strong>{formData.studentName}</strong> of PHD program / 
              batch <strong>{formData.year}</strong> under my supervision as a PhD student at the Department of 
              Electrical Engineering, Information Technology University of the Punjab.
            </div>

            {supervisorConsent ? (
              <div className="supervisor-details">
                <table style={{ width: '100%', border: '2px solid #000', borderCollapse: 'collapse', margin: '20px 0' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Supervisor</th>
                      <th style={{ border: '1px solid #000', padding: '10px', textAlign: 'left' }}>Designation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{supervisorConsent.supervisor_name}</td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{supervisorConsent.designation}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>HEC Approved Supervisor Ref. No.</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{supervisorConsent.hec_approved_supervisor_ref}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>No. of existing PhD students</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        As Supervisor: {supervisorConsent.num_existing_phd_students} | 
                        As Co-Supervisor: {supervisorConsent.num_existing_ms_students}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>No. of existing MS students</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        As Supervisor: {supervisorConsent.as_supervisor} | 
                        As Co-Supervisor: {supervisorConsent.as_co_supervisor}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>Email</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{supervisorConsent.email}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>Contact #</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>{supervisorConsent.contact_number}</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        <strong>Supervisor's Signature with date:</strong>
                      </td>
                      <td style={{ border: '1px solid #000', padding: '10px' }}>
                        {new Date(supervisorConsent.supervisor_signature_date).toLocaleDateString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pending-consent" style={{ 
                padding: '20px',
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                <p><strong>Supervisor Consent Pending</strong></p>
                <p>Waiting for supervisor to fill and approve the consent form.</p>
              </div>
            )}
          </div>

          {/* Approval Status */}
          <div className="approval-status-section">
            <div className="section-title">Approval Status</div>
            
            <div className={`approval-status ${
              formSubmission?.supervisor_approval_status === 'approved' ? 'approved' :
              formSubmission?.supervisor_approval_status === 'rejected' ? 'rejected' : 'pending'
            }`}>
              {formSubmission?.supervisor_approval_status === 'approved' && '✓ APPROVED BY SUPERVISOR'}
              {formSubmission?.supervisor_approval_status === 'rejected' && '✗ REJECTED BY SUPERVISOR'}
              {formSubmission?.supervisor_approval_status === 'pending' && '⏳ PENDING SUPERVISOR APPROVAL'}
            </div>

            {supervisorConsent?.supervisor_comments && (
              <div className="supervisor-comments" style={{ 
                margin: '15px 0',
                padding: '10px',
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px'
              }}>
                <strong>Supervisor Comments:</strong>
                <p>{supervisorConsent.supervisor_comments}</p>
              </div>
            )}
          </div>

          {/* Note Section */}
          <div className="form-section">
            <div style={{ 
              fontSize: '12px',
              fontStyle: 'italic',
              padding: '10px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '5px'
            }}>
              <strong>Note:</strong> A supervisor can supervise no more than 12 graduate students 
              (of which maximum 5 can be PhD students) at a time, as per HEC policy.
            </div>
          </div>

          {/* Official Use Only Section */}
          <div className="form-section">
            <div className="section-title">(FOR OFFICIAL USE ONLY)</div>
            
            <table style={{ width: '100%', border: '2px solid #000', borderCollapse: 'collapse', margin: '20px 0' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '10px', background: '#f8f9fa' }}>Recommended ☐</th>
                  <th style={{ border: '1px solid #000', padding: '10px', background: '#f8f9fa' }}>Not Recommended ☐</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="2" style={{ border: '1px solid #000', padding: '10px' }}>
                    <strong>Remarks:</strong>
                    <div style={{ height: '40px', marginTop: '5px' }}></div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>
                    <div><strong>Graduate Program Coordinator</strong></div>
                    <div>(Signature & Date)</div>
                    <div style={{ height: '40px', marginTop: '10px' }}></div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '10px' }}>
                    <div><strong>Graduate Program Advisor /</strong></div>
                    <div><strong>Secretary DPGC</strong></div>
                    <div>(Signature & Date)</div>
                    <div style={{ height: '40px', marginTop: '10px' }}></div>
                  </td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ border: '1px solid #000', padding: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <strong>Chairperson EE</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>(Signature & Date)</div>
                    <div style={{ height: '40px', marginTop: '10px' }}></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="form-footer" style={{ 
            marginTop: '30px',
            paddingTop: '15px',
            borderTop: '1px solid #ccc',
            fontSize: '10px',
            color: '#666',
            textAlign: 'center'
          }}>
            <p>Generated on: {new Date().toLocaleDateString()} | Form ID: {formSubmission?.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 