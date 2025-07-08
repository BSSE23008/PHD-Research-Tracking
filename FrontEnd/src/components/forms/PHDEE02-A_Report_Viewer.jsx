import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export const InputField = ({
  label,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder = '',
  required = false,
  error
}) => {
  const hasValue = type === 'checkbox' ? value : String(value).length > 0;
  const isValid = hasValue && !error;

  const baseInputClasses = `w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    error
      ? 'border-red-300 bg-red-50'
      : isValid
      ? 'border-green-300 bg-green-50'
      : 'border-slate-300 bg-white hover:border-slate-400'
  }`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${baseInputClasses} min-h-[120px] resize-y`}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClasses}
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
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-slate-700 leading-relaxed">{label}</span>
          </div>
        );

      default:
        return (
          <input
            type={type}
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseInputClasses}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className="space-y-2">
        {renderInput()}
        {error && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        {renderInput()}
        
        {/* Status indicator */}
        {(hasValue || error) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {error ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : isValid ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};