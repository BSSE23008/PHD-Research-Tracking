import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';

// ITU Logo component
const ITULogo = () => (
  <div className="w-16 h-16 flex items-center justify-center">
    <img 
      src="/src/assets/itu-logo.svg" 
      alt="ITU Logo" 
      className="w-16 h-16"
    />
  </div>
);

export const SupervisorConsentForm = ({ user, formSubmission, onClose, onSubmissionComplete }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      degree: 'PhD',
      session: new Date().getFullYear().toString(),
      studentId: formSubmission?.form_data?.studentId || '',
      studentName: formSubmission?.form_data?.studentName || '',
      areaOfResearch: formSubmission?.form_data?.projectDescription || '',
      contactNo: '',
      studentSignatureDate: '',
      supervisorName: user ? `${user.first_name} ${user.last_name}` : '',
      designation: user?.title || '',
      hecApprovedRef: '',
      phdStudentsAsSupervisor: '',
      phdStudentsAsCoSupervisor: '',
      msStudentsAsSupervisor: '',
      msStudentsAsCoSupervisor: '',
      email: user?.email || '',
      contactNumber: '',
      supervisorSignatureDate: new Date().toISOString().split('T')[0],
      isApproved: false,
      comments: ''
    }
  });

  const formData = watch();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/forms/supervisor/consent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formSubmissionId: formSubmission.id,
          consentData: data,
          approved: data.isApproved
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowPreview(true);
        if (onSubmissionComplete) {
          onSubmissionComplete(result.data);
        }
      } else {
        const error = await response.json();
        console.error('Submission error:', error);
      }
    } catch (error) {
      console.error('Error submitting consent form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Note: You'll need to install html2canvas and jspdf for this to work
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      
      const element = formRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('supervisor-consent-form.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF generation requires additional packages. Please install html2canvas and jspdf.');
    }
  };

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Form Preview</h2>
            <div className="space-x-4">
              <button
                onClick={handleDownloadPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Edit Form
              </button>
              <button
                onClick={onClose}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          
          <FormPreview data={formData} ref={formRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
        <div className="bg-gradient-to-r from-amber-600 to-gray-800 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold mb-2">Supervisor Consent Form</h2>
          <p className="opacity-90">
            PHDEE02-A Form - Student: {formData.studentName}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* University Header */}
          <div className="text-center border-b-2 border-amber-600 pb-6">
            <div className="flex justify-center mb-4">
              <ITULogo />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB
            </h3>
            <h4 className="text-base font-semibold text-gray-700 mb-2">
              PHD SUPERVISOR CONSENT FORM
            </h4>
            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <span>Degree:</span>
                <input
                  {...register('degree')}
                  className="border-b border-gray-400 text-center bg-transparent w-20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span>Session:</span>
                <input
                  {...register('session')}
                  className="border-b border-gray-400 text-center bg-transparent w-20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span>Student ID:</span>
                <input
                  {...register('studentId')}
                  className="border-b border-gray-400 text-center bg-transparent w-32"
                />
              </div>
            </div>
          </div>

          {/* Student Information */}
          <div className="border-2 border-gray-300 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Student Information</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="w-32 font-medium">Student Name:</label>
                <input
                  {...register('studentName', { required: 'Student name is required' })}
                  className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-amber-600"
                  disabled
                />
              </div>
              {errors.studentName && (
                <p className="text-red-500 text-sm">{errors.studentName.message}</p>
              )}

              <div className="flex items-center space-x-4">
                <label className="w-32 font-medium">Area of Research:</label>
                <textarea
                  {...register('areaOfResearch', { required: 'Area of research is required' })}
                  className="flex-1 border border-gray-400 p-2 rounded focus:outline-none focus:border-amber-600 min-h-20"
                  placeholder="Describe the area of research"
                />
              </div>
              {errors.areaOfResearch && (
                <p className="text-red-500 text-sm">{errors.areaOfResearch.message}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-4">
                  <label className="w-24 font-medium">Contact No:</label>
                  <input
                    {...register('contactNo')}
                    className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="w-32 font-medium">Student Signature with date:</label>
                  <input
                    {...register('studentSignatureDate')}
                    type="date"
                    className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor Consent */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Supervisor Consent</h3>
            
            <div className="bg-amber-50 p-4 rounded border-l-4 border-amber-600">
              <p className="italic">
                I am willing to take <strong>{formData.studentName || 'Mr / Ms / Mrs _________________________'}</strong> of PHD program 
                batch <strong>{formData.session}</strong> under my supervision as a PhD student at the Department of 
                Electrical Engineering, Information Technology University of the Punjab.
              </p>
            </div>

            {/* Supervisor Details Table */}
            <div className="border-2 border-gray-800">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="border border-gray-800 p-3 text-left font-semibold">Supervisor</th>
                    <th className="border border-gray-800 p-3 text-left font-semibold">Designation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('supervisorName', { required: 'Supervisor name is required' })}
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                        placeholder="Enter supervisor name"
                      />
                      {errors.supervisorName && (
                        <p className="text-red-500 text-xs mt-1">{errors.supervisorName.message}</p>
                      )}
                    </td>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('designation')}
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                        placeholder="e.g., Professor, Associate Professor"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">
                      HEC Approved Supervisor Ref. No.
                    </td>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('hecApprovedRef')}
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                        placeholder="Enter HEC reference number"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">
                      No. of existing PHD students
                    </td>
                    <td className="border border-gray-800 p-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">As Supervisor:</span>
                        <input
                          {...register('phdStudentsAsSupervisor')}
                          type="number"
                          className="w-16 bg-transparent border-b border-gray-400 text-center focus:outline-none focus:border-amber-600"
                        />
                        <span className="text-sm">As Co-Supervisor:</span>
                        <input
                          {...register('phdStudentsAsCoSupervisor')}
                          type="number"
                          className="w-16 bg-transparent border-b border-gray-400 text-center focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">
                      No. of existing MS students
                    </td>
                    <td className="border border-gray-800 p-3">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">As Supervisor:</span>
                        <input
                          {...register('msStudentsAsSupervisor')}
                          type="number"
                          className="w-16 bg-transparent border-b border-gray-400 text-center focus:outline-none focus:border-amber-600"
                        />
                        <span className="text-sm">As Co-Supervisor:</span>
                        <input
                          {...register('msStudentsAsCoSupervisor')}
                          type="number"
                          className="w-16 bg-transparent border-b border-gray-400 text-center focus:outline-none focus:border-amber-600"
                        />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">Email</td>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">Contact #</td>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('contactNumber')}
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                        placeholder="Contact number"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 p-3 font-semibold">
                      Supervisor's Signature with date:
                    </td>
                    <td className="border border-gray-800 p-3">
                      <input
                        {...register('supervisorSignatureDate', { required: 'Signature date is required' })}
                        type="date"
                        className="w-full bg-transparent focus:outline-none focus:bg-gray-50 p-1"
                      />
                      {errors.supervisorSignatureDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.supervisorSignatureDate.message}</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-sm italic text-gray-600">
              <strong>Note:</strong> A supervisor can supervise no more than 12 graduate students (of which maximum 5 can be 
              PhD students) at a time, as per HEC policy.
            </div>
          </div>

          {/* Approval Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Approval Decision</h3>
            
            <div className="flex items-center space-x-3">
              <input
                {...register('isApproved')}
                type="checkbox"
                className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-600"
              />
              <label className="font-medium">
                I approve this student to proceed with the research under my supervision
              </label>
            </div>
            
            <div>
              <label className="block font-medium mb-2">Additional Comments (Optional)</label>
              <textarea
                {...register('comments')}
                className="w-full border border-gray-400 p-3 rounded focus:outline-none focus:border-amber-600 min-h-24"
                placeholder="Any additional comments or requirements..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-3 rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-600 text-white px-6 py-3 rounded hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Consent Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Form Preview Component
const FormPreview = React.forwardRef(({ data }, ref) => (
  <div ref={ref} className="bg-white shadow-lg max-w-4xl mx-auto">
    <div className="p-8">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
        <div className="flex justify-center mb-4">
          <ITULogo />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB
        </h3>
        <h4 className="text-base font-semibold text-gray-700 mb-4">
          PHD SUPERVISOR CONSENT FORM
        </h4>
        <div className="flex justify-center space-x-8 text-sm">
          <div>Degree: <span className="font-semibold">{data.degree}</span></div>
          <div>Session: <span className="font-semibold">{data.session}</span></div>
          <div>Student ID: <span className="font-semibold">{data.studentId}</span></div>
        </div>
      </div>

      {/* Student Information */}
      <div className="border-2 border-gray-300 p-6 mb-8">
        <div className="space-y-3">
          <div className="flex">
            <span className="w-32 font-medium">Student Name:</span>
            <span className="flex-1 border-b border-gray-400 pb-1">{data.studentName}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-medium">Area of Research:</span>
            <span className="flex-1 border-b border-gray-400 pb-1">{data.areaOfResearch}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex">
              <span className="w-24 font-medium">Contact No:</span>
              <span className="flex-1 border-b border-gray-400 pb-1">{data.contactNo}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-medium">Student Signature with date:</span>
              <span className="flex-1 border-b border-gray-400 pb-1">{data.studentSignatureDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor Consent */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Supervisor Consent</h3>
        
        <div className="bg-gray-50 p-4 rounded border-l-4 border-gray-400 mb-6">
          <p className="italic">
            I am willing to take <strong>{data.studentName || 'Mr / Ms / Mrs _________________________'}</strong> of PHD program 
            batch <strong>{data.session}</strong> under my supervision as a PhD student at the Department of 
            Electrical Engineering, Information Technology University of the Punjab.
          </p>
        </div>

        {/* Supervisor Details Table */}
        <div className="border-2 border-gray-800 mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-800 p-3 text-left font-semibold">Supervisor</th>
                <th className="border border-gray-800 p-3 text-left font-semibold">Designation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-800 p-3">{data.supervisorName}</td>
                <td className="border border-gray-800 p-3">{data.designation}</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">HEC Approved Supervisor Ref. No.</td>
                <td className="border border-gray-800 p-3">{data.hecApprovedRef}</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">No. of existing PHD students</td>
                <td className="border border-gray-800 p-3">
                  As Supervisor: {data.phdStudentsAsSupervisor} | As Co-Supervisor: {data.phdStudentsAsCoSupervisor}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">No. of existing MS students</td>
                <td className="border border-gray-800 p-3">
                  As Supervisor: {data.msStudentsAsSupervisor} | As Co-Supervisor: {data.msStudentsAsCoSupervisor}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">Email</td>
                <td className="border border-gray-800 p-3">{data.email}</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">Contact #</td>
                <td className="border border-gray-800 p-3">{data.contactNumber}</td>
              </tr>
              <tr>
                <td className="border border-gray-800 p-3 font-semibold">Supervisor's Signature with date:</td>
                <td className="border border-gray-800 p-3">{data.supervisorSignatureDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-sm italic text-gray-600 mb-6">
          <strong>Note:</strong> A supervisor can supervise no more than 12 graduate students (of which maximum 5 can be 
          PhD students) at a time, as per HEC policy.
        </div>

        {/* Approval Status */}
        <div className="border-t pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-5 h-5 border-2 border-gray-800 ${data.isApproved ? 'bg-green-500' : 'bg-white'}`}>
              {data.isApproved && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="font-medium">
              I approve this student to proceed with the research under my supervision
            </span>
          </div>
          
          {data.comments && (
            <div>
              <div className="font-medium mb-2">Additional Comments:</div>
              <div className="border border-gray-300 p-3 rounded bg-gray-50">{data.comments}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));

FormPreview.displayName = 'FormPreview'; 