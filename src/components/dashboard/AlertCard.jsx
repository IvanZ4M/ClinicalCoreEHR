import React from 'react';

export default function AlertCard({ title, description, severity = 'info' }) {
  const severityColors = {
    critical: 'bg-red-50 border-red-100',
    warning: 'bg-yellow-50 border-yellow-100',
    info: 'bg-blue-50 border-blue-100',
  };

  const dotColors = {
    critical: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  return (
    <div className={`bg-white p-3 rounded border ${severityColors[severity]}`}>
      <p className="text-sm font-bold text-gray-900">
        <span className={`${dotColors[severity]} mr-2`}>●</span>
        {title}
      </p>
      <p className="text-xs text-gray-600 mt-1 ml-4">{description}</p>
    </div>
  );
}
