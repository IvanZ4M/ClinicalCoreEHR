import React from 'react';

export default function TopBar() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <h2 className="text-sm font-medium text-gray-600">Centro Médico - Clínica Integral</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            DH
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Dr. Harrison</p>
            <p className="text-xs text-gray-500">Médico General</p>
          </div>
        </div>
        
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          🔔
        </button>
      </div>
    </header>
  );
}
