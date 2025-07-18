// FrontEnd/src/components/Forms/PHDEE-E4.jsx
// PHD Thesis Evaluation Form (For External Evaluators)

import React, { useState, useEffect } from 'react';
import './logo.css';

const PHDEE_E4 = ({ user, onClose, onSubmissionComplete }) => {
    const [formData, setFormData] = useState({
        // Part-I: Logistical details
        evaluatorName: '',
        evaluatorEmail: '',
        evaluatorDesignation: '',
        evaluatorInstitute: '',
        evaluatorAddress: '',
        studentName: '',
        studentId: '',

        // Part-II: Quantitative assessment
        question1: '',
        question2: '',
        question3: '',
        question4: '',
        question5: '',

        // Part-III: Detailed feedback
        detailedFeedback: '',

        // Part-IV: Overall assessment
        overallAssessment: '',

        // Signature
        evaluatorSignature: '',
        signatureDate: '',

        // Official use
        chairpersonSignature: '',
        deanSignature: '',
        officialRemarks: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 2;

    //   Prefill form fields from user prop
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                studentName: (user.first_name && user.last_name) ? `${user.first_name} ${user.last_name}` : prev.studentName || '',
                studentId: user.student_id || user.studentId || prev.studentId || ''
            }));
        }
    }, [user]);


    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleRadioChange = (question, value) => {
        setFormData(prev => ({
            ...prev,
            [question]: value
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
                <p className="text-lg">Thesis Evaluation has been submitted.</p>
            </div>
        );
    }

    const renderPage1 = () => (
        <>
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
                {/* Logo place holder */}
                <div className="logo-placeholder"></div>
                {/* Page number and form name */}
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="text-lg font-bold">PHDEE-E4 Form</div>
                </div>
                <h1 className="text-lg font-bold mb-2">INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB, Lahore, Pakistan</h1>
                <h2 className="text-base font-bold">PHD THESIS EVALUATION FORM (FOR EXTERNAL EVALUATORS)</h2>
            </div>

            {/* Part-I: Logistical details */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">Part-I: Logistical details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block mb-2 font-semibold">Evaluator's name</label>
                        <input
                            type="text"
                            value={formData.evaluatorName}
                            onChange={(e) => handleInputChange('evaluatorName', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">Evaluator's institutional email address</label>
                        <input
                            type="email"
                            value={formData.evaluatorEmail}
                            onChange={(e) => handleInputChange('evaluatorEmail', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Evaluator's designation</label>
                        <input
                            type="text"
                            value={formData.evaluatorDesignation}
                            onChange={(e) => handleInputChange('evaluatorDesignation', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">Evaluator's institute of affiliation</label>
                        <input
                            type="text"
                            value={formData.evaluatorInstitute}
                            onChange={(e) => handleInputChange('evaluatorInstitute', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block mb-2 font-semibold">Evaluator's mailing address</label>
                    <textarea
                        value={formData.evaluatorAddress}
                        onChange={(e) => handleInputChange('evaluatorAddress', e.target.value)}
                        className="border border-black w-full h-20 p-2 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-semibold">Name of the PhD student</label>
                        <input
                            disabled
                            readOnly
                            type="text"
                            value={formData.studentName}
                            onChange={(e) => handleInputChange('studentName', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold">Student ID</label>
                        <input
                            disabled
                            readOnly
                            type="text"
                            value={formData.studentId}
                            onChange={(e) => handleInputChange('studentId', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Part-II: Quantitative assessment */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">
                    Part-II: Quantitative assessment
                </h3>
                <p className="mb-4 italic">
                    Please rate the PhD thesis under consideration on a scale of 1-5 (with 1 being the lowest score and 5 being the highest score)
                </p>

                <div className="space-y-6">
                    {/* Question 1 */}
                    <div>
                        <p className="mb-2 font-semibold">
                            1. The thesis addresses a novel and challenging problem in the said domain.
                        </p>
                        <div className="flex justify-between items-center max-w-md">
                            {[1, 2, 3, 4, 5].map(num => (
                                <label key={`q1-${num}`} className="flex flex-col items-center">
                                    <span>{num}</span>
                                    <input
                                        type="radio"
                                        name="question1"
                                        value={num}
                                        checked={formData.question1 === num.toString()}
                                        onChange={() => handleRadioChange('question1', num.toString())}
                                        className="mt-1"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 2 */}
                    <div>
                        <p className="mb-2 font-semibold">
                            2. The thesis describes the related work/prior art in a comprehensive manner.
                        </p>
                        <div className="flex justify-between items-center max-w-md">
                            {[1, 2, 3, 4, 5].map(num => (
                                <label key={`q2-${num}`} className="flex flex-col items-center">
                                    <span>{num}</span>
                                    <input
                                        type="radio"
                                        name="question2"
                                        value={num}
                                        checked={formData.question2 === num.toString()}
                                        onChange={() => handleRadioChange('question2', num.toString())}
                                        className="mt-1"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 3 */}
                    <div>
                        <p className="mb-2 font-semibold">
                            3. The thesis research advances the state of the art significantly.
                        </p>
                        <div className="flex justify-between items-center max-w-md">
                            {[1, 2, 3, 4, 5].map(num => (
                                <label key={`q3-${num}`} className="flex flex-col items-center">
                                    <span>{num}</span>
                                    <input
                                        type="radio"
                                        name="question3"
                                        value={num}
                                        checked={formData.question3 === num.toString()}
                                        onChange={() => handleRadioChange('question3', num.toString())}
                                        className="mt-1"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Question 4 */}
                    <div>
                        <p className="mb-2 font-semibold">
                            4. The thesis is well written, diagrams/figures are clear, tables are well presented, and thesis chapters are well organized.
                        </p>
                        <div className="flex justify-between items-center max-w-md">
                            {[1, 2, 3, 4, 5].map(num => (
                                <label key={`q4-${num}`} className="flex flex-col items-center">
                                    <span>{num}</span>
                                    <input
                                        type="radio"
                                        name="question4"
                                        value={num}
                                        checked={formData.question4 === num.toString()}
                                        onChange={() => handleRadioChange('question4', num.toString())}
                                        className="mt-1"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <div></div> {/* Spacer */}
                <button
                    type="button"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setCurrentPage(2)}
                >
                    Next Page →
                </button>
            </div>
        </>
    );

    const renderPage2 = () => (
        <>
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
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="text-lg font-bold">PHDEE-E4 Form</div>
                </div>
                <h1 className="text-lg font-bold mb-2">INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB, Lahore, Pakistan</h1>
                <h2 className="text-base font-bold">PHD THESIS EVALUATION FORM (FOR EXTERNAL EVALUATORS)</h2>
            </div>

            {/* Continuation of Part-II */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">
                    Part-II: Quantitative assessment (continued)
                </h3>

                {/* Question 5 */}
                <div>
                    <p className="mb-2 font-semibold">
                        5. The research contributions made in the thesis are strong enough to warrant a PhD degree.
                    </p>
                    <div className="flex justify-between items-center max-w-md mb-4">
                        {[1, 2, 3, 4, 5].map(num => (
                            <label key={`q5-${num}`} className="flex flex-col items-center">
                                <span>{num}</span>
                                <input
                                    type="radio"
                                    name="question5"
                                    value={num}
                                    checked={formData.question5 === num.toString()}
                                    onChange={() => handleRadioChange('question5', num.toString())}
                                    className="mt-1"
                                />
                            </label>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs max-w-md mx-auto">
                        <span>strongly disagree</span>
                        <span>strongly agree</span>
                    </div>
                </div>
            </div>

            {/* Part-III: Detailed feedback */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">
                    Part-III: Detailed technical comments/feedback
                </h3>
                <p className="mb-4 italic">
                    Please provide your detailed technical comments/feedback here (at least 200 words)
                </p>
                <textarea
                    value={formData.detailedFeedback}
                    onChange={(e) => handleInputChange('detailedFeedback', e.target.value)}
                    className="border border-black w-full h-48 p-2 focus:outline-none"
                />
            </div>

            {/* Part-IV: Overall assessment */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">
                    Part-IV: Overall assessment
                </h3>
                <p className="mb-4 italic">What is your overall assessment of the thesis?</p>

                <div className="space-y-3">
                    {[
                        "The thesis does not merit the award of the degree in its current form and should undergo major revision and be resubmitted to the undersigned for another review.",
                        "The thesis does not merit the award of the degree in its current form and should undergo minor revision and be resubmitted to the undersigned for another review.",
                        "The thesis does not merit the award of the degree in its current form but will if the changes suggested by the undersigned are made to the satisfaction of the advisor and the graduate examination committee.",
                        "The thesis is acceptable in its current form and merits the award of the degree in its current form."
                    ].map((option, index) => (
                        <label key={index} className="flex items-start mb-3">
                            <input
                                type="radio"
                                name="overallAssessment"
                                value={index}
                                checked={formData.overallAssessment === index.toString()}
                                onChange={() => handleInputChange('overallAssessment', index.toString())}
                                className="mt-1 mr-2"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Signature */}
            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 border-b-2 border-black pb-2">
                    Evaluator's Signature and Stamp with Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 font-semibold">Signature</label>
                        <input
                            type="text"
                            value={formData.evaluatorSignature}
                            onChange={(e) => handleInputChange('evaluatorSignature', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 font-semibold">Date</label>
                        <input
                            type="text"
                            value={formData.signatureDate}
                            onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                            className="border-b border-black w-full focus:outline-none"
                            placeholder="Date"
                        />
                    </div>
                </div>
            </div>

            {/* Official Use Only */}
            <div className="mb-6 border-t-2 border-black pt-4">
                <h3 className="font-bold mb-4 text-center">(FOR OFFICIAL USE ONLY)</h3>
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Approved by</label>
                    <div className="flex justify-between gap-4">
                        <div className="w-1/2">
                            <label className="block mb-1">Chairperson, Electrical Engineering Department (Signature & Date Received)</label>
                            <input
                                type="text"
                                value={formData.chairpersonSignature}
                                onChange={(e) => handleInputChange('chairpersonSignature', e.target.value)}
                                className="border-b border-black w-full focus:outline-none"
                            />
                        </div>
                        <div className="w-1/2">
                            <label className="block mb-1">Dean, Faculty of Engineering (Signature & Date)</label>
                            <input
                                type="text"
                                value={formData.deanSignature}
                                onChange={(e) => handleInputChange('deanSignature', e.target.value)}
                                className="border-b border-black w-full focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-semibold">Remarks:</label>
                    <textarea
                        value={formData.officialRemarks}
                        onChange={(e) => handleInputChange('officialRemarks', e.target.value)}
                        className="border border-black w-full h-20 p-2 focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    type="button"
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={() => setCurrentPage(1)}
                >
                    ← Previous Page
                </button>
                <button
                    type="button"
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                </button>
            </div>
        </>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white relative">
            {currentPage === 1 ? renderPage1() : renderPage2()}
            <div className="text-right text-sm mt-4">
                <strong>PHDEE-E4 Form</strong>
            </div>
        </div>
    );
};

export default PHDEE_E4;