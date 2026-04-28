import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/reports" element={<div className="text-center py-10"><h1 className="text-2xl font-bold">Módulo de Informes - En Desarrollo</h1></div>} />
          <Route path="/settings" element={<div className="text-center py-10"><h1 className="text-2xl font-bold">Configuración - En Desarrollo</h1></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
