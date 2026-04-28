import React, { useState } from 'react';

export default function Appointments() {
  const [appointments, setAppointments] = useState([
    { id: 1, date: '2026-04-24', time: '09:00', patient: 'Juan Pérez García', type: 'Consulta General', doctor: 'Dr. Harrison', status: 'completed', room: 'Consultorio 1' },
    { id: 2, date: '2026-04-24', time: '10:30', patient: 'María González López', type: 'Seguimiento HTA', doctor: 'Dr. Harrison', status: 'in_progress', room: 'Consultorio 2' },
    { id: 3, date: '2026-04-24', time: '11:45', patient: 'Carlos López Martínez', type: 'Evaluación Diabética', doctor: 'Dra. López', status: 'pending', room: 'Consultorio 3' },
    { id: 4, date: '2026-04-24', time: '01:00 PM', patient: 'Ana Martínez Fernández', type: 'Revisión Postoperatoria', doctor: 'Dr. García', status: 'pending', room: 'Consultorio 1' },
    { id: 5, date: '2026-04-25', time: '09:30', patient: 'Roberto Sánchez García', type: 'Consulta Preventiva', doctor: 'Dr. Harrison', status: 'scheduled', room: 'Consultorio 2' },
  ]);

  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === filterStatus);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendiente' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completada' },
      in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'En Progreso' },
      scheduled: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Programada' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Cancelada' },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Citas</h2>
          <p className="text-gray-500 mt-1">Módulo de consultas y signos vitales</p>
        </div>
        <button className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors flex items-center gap-2">
          ➕ Nueva Cita
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex gap-3">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilterStatus('in_progress')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'in_progress'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          En Progreso
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'completed'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completadas
        </button>
      </div>

      {/* Tabla de Citas */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fecha y Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paciente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tipo de Cita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Médico</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Consultorio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => {
                const badge = getStatusBadge(appointment.status);
                return (
                  <tr key={appointment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {appointment.date} {appointment.time}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.patient}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.doctor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{appointment.room}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 text-sm font-medium hover:underline mr-3">
                        Ver
                      </button>
                      <button className="text-gray-600 text-sm font-medium hover:text-gray-900">
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
          Mostrando {filteredAppointments.length} de {appointments.length} citas
        </div>
      </div>
    </div>
  );
}
