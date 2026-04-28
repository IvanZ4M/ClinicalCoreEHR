import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import AppointmentRow from '../components/dashboard/AppointmentRow';
import AlertCard from '../components/dashboard/AlertCard';

export default function Dashboard() {
  // Datos simulados para demostración
  const appointments = [
    { time: '09:00 AM', patientName: 'Juan Pérez', patientId: '#4521', reason: 'Consulta General', status: 'completed' },
    { time: '10:30 AM', patientName: 'María González', patientId: '#4522', reason: 'Seguimiento HTA', status: 'in_progress' },
    { time: '11:45 AM', patientName: 'Carlos López', patientId: '#4523', reason: 'Evaluación Diabética', status: 'pending' },
    { time: '01:00 PM', patientName: 'Ana Martínez', patientId: '#4524', reason: 'Revisión Postoperatoria', status: 'pending' },
    { time: '02:30 PM', patientName: 'Roberto Sánchez', patientId: '#4525', reason: 'Consulta Preventiva', status: 'pending' },
  ];

  const diagnostics = [
    { name: 'Hipertensión', percentage: 42 },
    { name: 'Diabetes Mellitus', percentage: 28 },
    { name: 'Dislipidemia', percentage: 35 },
    { name: 'Obesidad', percentage: 22 },
  ];

  const alerts = [
    { title: 'Resultados Lab: Paciente #4421', description: 'Niveles anormales de potasio detectados.', severity: 'critical' },
    { title: 'Registro sin Firma: Visita Clínica', description: 'Firma requerida para completar facturación.', severity: 'warning' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Buen día, Dr. Harrison</h2>
          <p className="text-gray-500 mt-1">Aquí está su resumen clínico para hoy, 24 de abril de 2026.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center gap-2 hover:bg-gray-50 font-medium transition-colors">
            📅 Nueva Cita
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white flex items-center gap-2 hover:bg-gray-50 font-medium transition-colors">
            👤 Registrar Paciente
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon="👥"
          label="Total de Pacientes"
          value="1.248"
          trend="+4%"
          trendValue="esta semana"
          trendColor="text-green-700 bg-green-50"
        />
        <StatCard
          icon="📅"
          label="Citas Hoy"
          value="18"
          trend="12"
          trendValue="restantes"
          trendColor="text-blue-700 bg-blue-50"
        />
        <StatCard
          icon="📄"
          label="Informes Pendientes"
          value="9"
          trend="3"
          trendValue="Urgentes"
          trendColor="text-red-700 bg-red-50"
        />
      </div>

      {/* Contenido Principal (Grilla 2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Citas de Hoy (Ocupa 2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Citas de Hoy</h3>
            <a href="/appointments" className="text-blue-600 text-sm font-medium hover:underline">
              Ver Agenda Completa →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Motivo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, idx) => (
                  <AppointmentRow
                    key={idx}
                    time={apt.time}
                    patientName={apt.patientName}
                    patientId={apt.patientId}
                    reason={apt.reason}
                    status={apt.status}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Diagnósticos y Alertas (Ocupa 1/3) */}
        <div className="flex flex-col gap-6">
          {/* Diagnósticos Frecuentes */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Diagnósticos Frecuentes</h3>
            <div className="space-y-4">
              {diagnostics.map((diag, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{diag.name}</span>
                    <span className="font-medium text-gray-900">{diag.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${diag.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-blue-600 text-sm font-medium hover:underline">
              Ver Análisis Detallado →
            </button>
          </div>

          {/* Alertas Críticas */}
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">
              ⚠️ Alertas Críticas
            </h3>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <AlertCard
                  key={idx}
                  title={alert.title}
                  description={alert.description}
                  severity={alert.severity}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
