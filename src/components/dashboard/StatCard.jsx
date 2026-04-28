import React from 'react';

export default function StatCard({ icon, label, value, trend, trendValue, trendColor }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 text-2xl">
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium px-2 py-1 rounded ${trendColor}`}>
            {trend} {trendValue}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
        {label}
      </p>
      <h3 className="text-4xl font-bold text-gray-900">{value}</h3>
    </div>
  );
}
