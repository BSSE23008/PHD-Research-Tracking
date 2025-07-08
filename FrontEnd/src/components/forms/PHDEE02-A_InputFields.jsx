import React from 'react';
import { AlertCircle, Check } from 'lucide-react';
import './Forms.css';

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder = '',
  required = false,
  error,
  disabled = false
}) => {
  const hasValue = type === 'checkbox' ? value : String(value).length > 0;
  const isValid = hasValue && !error;

  const getInputClasses = () => {
    let classes = 'form-input';
    
    if (error) {
      classes += ' form-input-error';
    } else if (isValid) {
      classes += ' form-input-valid';
    }
    
    if (disabled) {
      classes += ' form-input-disabled';
    }
    
    return classes;
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${getInputClasses()} form-textarea`}
            rows={4}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={getInputClasses()}
            disabled={disabled}
          >
            <option value="">Select an option...</option>
            {options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="form-checkbox"
              disabled={disabled}
            />
            <span className="checkbox-label">{label}</span>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={getInputClasses()}
            disabled={disabled}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={getInputClasses()}
            disabled={disabled}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={getInputClasses()}
            disabled={disabled}
          />
        );

      default:
        return (
          <input
            type={type}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={getInputClasses()}
            disabled={disabled}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className="form-field checkbox-field">
        {renderInput()}
        {error && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="form-field">
      <label className="form-label">
        {label} {required && <span className="required-indicator">*</span>}
      </label>
      
      <div className="input-container">
        {renderInput()}
        
        {/* Status indicator */}
        {(hasValue || error) && !disabled && (
          <div className="input-status-indicator">
            {error ? (
              <AlertCircle className="status-icon error" />
            ) : isValid ? (
              <Check className="status-icon success" />
            ) : null}
          </div>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          <AlertCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};