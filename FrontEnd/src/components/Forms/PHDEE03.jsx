import React from 'react';
import './PHDEE03.css';

// A reusable component for the text fields with an underline
const FormInputRow = ({ label, fullWidth = false }) => (
  <div className={`form-input-row ${fullWidth ? 'full-width' : ''}`}>
    <label>{label}</label>
    <input type="text" className="text-input" />
  </div>
);

// A reusable component for the grid-based fields (like in the tables)
const FormField = ({ label, children, colSpan = 1 }) => (
  <div className="form-field" style={{ gridColumn: `span ${colSpan}` }}>
    <div className="field-label">{label}</div>
    {children ? (
      <div className="field-content">{children}</div>
    ) : (
      <input type="text" className="text-input" />
    )}
  </div>
);

// A reusable component for a single committee member block
const CommitteeMember = () => (
  <div className="committee-member-grid">
    <FormField label="Name" />
    <FormField label="Department & Institute" />
    <FormField label="Email" />
    <FormField label="Contact #" />
    <FormField label="Signature with date:" colSpan={2} />
  </div>
);

const PHDEE03 = () => {
  return (
    <div className="page-background">
      <div className="form-container">

        <header className="form-header">
          <div className="logo-container">
            <div className="logo-placeholder"></div>
          </div>
          <div className="header-text">
            <h1>INFORMATION TECHNOLOGY UNIVERSITY OF THE PUNJAB</h1>
            <h2>PHD GRADUATE EXAMINATION COMMITTEE - FORMATION FORM</h2>
          </div>
          <div className="form-code">PhDEE03-B Form</div>
        </header>

        <section className="form-row top-info-row">
          <FormInputRow label="Degree" />
          <FormInputRow label="Session" />
          <FormInputRow label="Student ID" />
        </section>

        <section className="info-section student-info">
          <FormInputRow label="Student Name:" fullWidth={true} />
          <FormInputRow label="Area of Research:" fullWidth={true} />
          <FormInputRow label="Student Signature with date:" fullWidth={true} />
        </section>

        <section className="supervisor-grid">
          <FormField label="Supervisor" />
          <div className="form-field full-span">
            <label>Supervisor's Signature with date:</label>
            <input type="text" className="text-input" />
          </div>
        </section>

        <section className="co-supervisor-grid">
          <FormField label="Co-Supervisor (If any)">
            <input type="text" className="text-input" placeholder="Shall also be part of GEC" />
          </FormField>
          <FormField label="Department" />
          <FormField label="Email" />
          <FormField label="Contact #" />
          <FormField label="Co-Supervisor's Signature with date:" colSpan={2} />
        </section>

        <section className="committee-section">
          <h3>Graduate Examination Committee</h3>
          <div className="committee-members-container">
            <CommitteeMember />
            <CommitteeMember />
            <CommitteeMember />
          </div>
        </section>

        <section className="official-use-section">
          <div className="official-use-title">(FOR OFFICIAL USE ONLY)</div>

          <div className="recommendation-row">
            <div className="checkbox-container">
              <input type="checkbox" id="recommended" />
              <label htmlFor="recommended">Recommended</label>
            </div>
            <div className="checkbox-container">
              <input type="checkbox" id="not-recommended" />
              <label htmlFor="not-recommended">Not-Recommended</label>
            </div>
          </div>

          <div className="remarks-container">
            <label>Remarks:</label>
            <textarea rows="4" className="text-area"></textarea>
          </div>

          <footer className="signature-footer">
            <div className="signature-box">
              <p>Graduate Program Coordinator</p>
              <span>(Signature & Date)</span>
            </div>
            <div className="signature-box">
              <p>Graduate Program Advisor</p>
              <span>(Signature & Date)</span>
            </div>
            <div className="signature-box">
              <p>Chairperson EE/Dean</p>
              <span>(Signature & Date)</span>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default PHDEE03;
