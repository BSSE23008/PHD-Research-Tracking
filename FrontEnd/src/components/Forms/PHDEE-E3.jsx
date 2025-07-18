// FrontEnd/src/components/Forms/PHDEE-E3.jsx
// GEC 

import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E3 = ({ user, onClose, onSubmissionComplete }) => {
    const [formData, setFormData] = useState({
        session: '',
        studentName: '',
        studentId: '',
        semester: '',
        researchDetails: '',
        researchMilestone: '',
        nextSemesterPlan: '',
        meetingDate: '',
        committeeMembers: [
            { role: 'Supervisor', progress: '', minutes: '', signature: '' },
            { role: 'Co-Supervisor', progress: '', minutes: '', signature: '' },
            { role: 'GEC Member 1', progress: '', minutes: '', signature: '' },
            { role: 'GEC Member 2', progress: '', minutes: '', signature: '' },
            { role: 'GEC Member 3', progress: '', minutes: '', signature: '' }
        ],
        chairpersonSignature: '',
        deanSignature: '',
        officialRemarks: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Prefill form fields from user prop
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                session: user.enrollment_year || prev.session || '',
                studentId: user.student_id || user.studentId || prev.studentId || '',
                studentName: (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : prev.studentName || '',
            }));
        }
    }, [user]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCommitteeChange = (index, field, value) => {
        const updatedMembers = [...formData.committeeMembers];
        updatedMembers[index] = {
            ...updatedMembers[index],
            [field]: value
        };
        setFormData(prev => ({
            ...prev,
            committeeMembers: updatedMembers
        }));
    };

    // Simulate form submission
    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Simulate API call delay
            await new Promise(res => setTimeout(res, 1000));
            // Simulate success
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                if (onSubmissionComplete) onSubmissionComplete(formData);
            }, 2000);
        } catch (error) {
            // Handle error
        } finally {
            setSubmitting(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h3 className="text-2xl font-bold mb-2">Form Submitted Successfully!</h3>
                <p className="text-lg">GEC Meeting Minutes have been submitted.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white relative">
            {/* Header */}
            <div className="relative text-center mb-6">
                {/* Close Button */}
                {onClose && (
                    <button
                        className="absolute left-0 top-0 m-2 text-2xl text-gray-500 hover:text-black focus:outline-none"
                        onClick={onClose}
                        aria-label="Close"
                        type="button"
                    >
                        ×
                    </button>
                )}
                {/* ITU Logo Placeholder */}
                <div className="logo-placeholder"></div>
                <h1 className="text-lg font-bold mb-2">INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB</h1>
                <h2 className="text-base font-bold">GEC MEETING MINUTES FOR SEMESTER WISE PROGRESS EVALUATION</h2>
            </div>

            {/* Student Information */}
            <div className="mb-6">
                <div className="flex gap-4 mb-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <label className="inline-block w-24">Session</label>
                        <input
                            readOnly
                            disabled
                            type="text"
                            value={formData.session}
                            onChange={(e) => handleInputChange('session', e.target.value)}
                            className="border-b border-black inline-block w-32 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="inline-block w-32">Student Name</label>
                        <input
                            readOnly
                            disabled
                            type="text"
                            value={formData.studentName}
                            onChange={(e) => handleInputChange('studentName', e.target.value)}
                            className="border-b border-black inline-block w-48 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="inline-block w-24">Student ID</label>
                        <input
                            readOnly
                            disabled
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => handleInputChange('studentId', e.target.value)}
                            className="border-b border-black inline-block w-32 focus:outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="inline-block w-24">Semester</label>
                        <input
                            type="text"
                            value={formData.semester}
                            onChange={(e) => handleInputChange('semester', e.target.value)}
                            className="border-b border-black inline-block w-32 focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Student Section */}
            <div className="mb-8">
                <h3 className="font-bold mb-4 bg-gray-200 p-2">To be filled in by student</h3>

                <div className="mb-6">
                    <label className="block mb-2 font-semibold">
                        Details of Research work conducted during the semester: (May attach further documents if required)
                    </label>
                    <textarea
                        value={formData.researchDetails}
                        onChange={(e) => handleInputChange('researchDetails', e.target.value)}
                        className="border border-black w-full h-32 p-2 focus:outline-none"
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-2 font-semibold">
                        Research Milestone achieved (Any publication/notable achievement):
                    </label>
                    <textarea
                        value={formData.researchMilestone}
                        onChange={(e) => handleInputChange('researchMilestone', e.target.value)}
                        className="border border-black w-full h-24 p-2 focus:outline-none"
                    />
                </div>

                <div className="mb-6">
                    <label className="block mb-2 font-semibold">
                        Plan for next semester:
                    </label>
                    <textarea
                        value={formData.nextSemesterPlan}
                        onChange={(e) => handleInputChange('nextSemesterPlan', e.target.value)}
                        className="border border-black w-full h-24 p-2 focus:outline-none"
                    />
                </div>
            </div>

            {/* GEC Meeting Section */}
            <div className="mb-8">
                <h3 className="font-bold mb-4 bg-gray-200 p-2">
                    GEC Meeting Minutes & Recommendations to be filled in by Supervisor & GEC Committee
                </h3>

                <div className="mb-4 flex items-center">
                    <label className="mr-2 font-semibold">Meeting held on:</label>
                    <input
                        type="text"
                        value={formData.meetingDate}
                        onChange={(e) => handleInputChange('meetingDate', e.target.value)}
                        className="border-b border-black w-48 focus:outline-none"
                        placeholder="Date"
                    />
                </div>

                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 w-1/4">Name</th>
                            <th className="border border-black p-2 w-1/4">Progress (Satisfactory /Unsatisfactory)</th>
                            <th className="border border-black p-2 w-2/4">Meeting Minutes & Remarks</th>
                            <th className="border border-black p-2 w-1/4">Signature with date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.committeeMembers.map((member, index) => (
                            <tr key={index}>
                                <td className="border border-black p-2 font-semibold">{member.role}</td>
                                <td className="border border-black p-2">
                                    <select
                                        value={member.progress}
                                        onChange={(e) => handleCommitteeChange(index, 'progress', e.target.value)}
                                        className="w-full p-1 focus:outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Satisfactory">Satisfactory</option>
                                        <option value="Unsatisfactory">Unsatisfactory</option>
                                    </select>
                                </td>
                                <td className="border border-black p-2">
                                    <textarea
                                        value={member.minutes}
                                        onChange={(e) => handleCommitteeChange(index, 'minutes', e.target.value)}
                                        className="w-full h-20 p-1 focus:outline-none"
                                    />
                                </td>
                                <td className="border border-black p-2">
                                    <textarea
                                        value={member.signature}
                                        onChange={(e) => handleCommitteeChange(index, 'signature', e.target.value)}
                                        className="w-full h-20 p-1 focus:outline-none"
                                        placeholder="Signature with date"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="text-sm mt-2 italic">(Add additional page if required)</p>
            </div>

            {/* Official Use Only */}
            <div className="mb-6 border-t-2 border-black pt-4">
                <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
                <table className="w-full border-collapse border border-black">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2">
                                <label className="block mb-2">Approved by</label>
                                <div className="flex justify-between">
                                    <div className="w-1/2 pr-2">
                                        <label className="block mb-1">Chairperson EE (Signature & Date Received)</label>
                                        <input
                                            type="text"
                                            value={formData.chairpersonSignature}
                                            onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
                                            className="border-b border-black w-full focus:outline-none"
                                        />
                                    </div>
                                    <div className="w-1/2 pl-2">
                                        <label className="block mb-1">Dean (Signature & Date)</label>
                                        <input
                                            type="text"
                                            value={formData.deanSignature}
                                            onChange={(e) => handleInputChange('deanSignature', e.target.value)}
                                            className="border-b border-black w-full focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2">
                                <label className="block mb-2">Remarks:</label>
                                <textarea
                                    value={formData.officialRemarks}
                                    onChange={(e) => handleInputChange('officialRemarks', e.target.value)}
                                    className="border border-black w-full h-20 p-2 focus:outline-none"
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Form Footer */}
            <div className="flex justify-end items-center mt-8 gap-4">
                {onClose && (
                    <button
                        type="button"
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                </button>
            </div>
            <div className="text-right text-sm mt-4">
                <strong>PHDEE-E3 Form</strong>
            </div>
        </div>
    );
};

export default PHDEE_E3;


