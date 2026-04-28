import React, { useState } from 'react';

export default function Patients() {
  const [patients, setPatients] = useState([
    { id: 1, name: 'Juan Pérez García', cedula: '12345678', email: 'juan@example.com', phone: '+34 612 345 678', lastVisit: '2026-04-20', status: 'activo' },
    { id: 2, name: 'María González López', cedula: '87654321', email: 'maria@example.com', phone: '+34 623 456 789', lastVisit: '2026-04-22', status: 'activo' },
    { id: 3, name: 'Carlos López Martínez', cedula: '11223344', email: 'carlos@example.com', phone: '+34 634 567 890', lastVisit: '2026-04-18', status: 'inactivo' },
    { id: 4, name: 'Ana Martínez Fernández', cedula: '55667788', email: 'ana@example.com', phone: '+34 645 678 901', lastVisit: '2026-04-23', status: 'activo' },
    { id: 5, name: 'Roberto Sánchez García', cedula: '99887766', email: 'roberto@example.com', phone: '+34 656 789 012', lastVisit: '2026-04-17', status: 'activo' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cedula.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h2>
          <p className="text-gray-500 mt-1">Módulo de administración de expedientes clínicos (NOM-024)</p>
        </div>
        <button className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors flex items-center gap-2">
          ➕ Nuevo Paciente
        </button>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Tabla de Pacientes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cédula</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Última Visita</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.cedula}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{patient.lastVisit}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      patient.status === 'activo' 
                        ? 'bg-green-50 text-green-700' 
                        : 'bg-gray-50 text-gray-700'
                    }`}>
                      {patient.status === 'activo' ? '✓ Activo' : '○ Inactivo'}
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
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-600">
          Mostrando {filteredPatients.length} de {patients.length} pacientes
        </div>
      </div>
    </div>
  );
}
