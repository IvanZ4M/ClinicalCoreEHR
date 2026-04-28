import React from 'react';

export default function AppointmentRow({ time, patientName, patientId, reason, status }) {
  const statusColors = {
    pending: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    in_progress: 'bg-blue-50 text-blue-700',
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">{time}</td>
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-medium text-gray-900">{patientName}</p>
          <p className="text-xs text-gray-500">ID: {patientId}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{reason}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-50 text-gray-700'}`}>
          {status === 'pending' && 'Pendiente'}
          {status === 'completed' && 'Completada'}
          {status === 'cancelled' && 'Cancelada'}
          {status === 'in_progress' && 'En Progreso'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-blue-600 text-sm font-medium hover:underline">
          Ver Detalles
        </button>
      </td>
    </tr>
  );
}
