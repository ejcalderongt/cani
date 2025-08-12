import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Pacientes from './components/Pacientes';
import NuevoPaciente from './components/NuevoPaciente';
import VerPaciente from './components/VerPaciente';
import NotasEnfermeria from './components/NotasEnfermeria';
import NuevaNota from './components/NuevaNota';
import SignosVitales from './components/SignosVitales'; // Assuming SignosVitales component will be created
import Medicamentos from './components/Medicamentos';
import NuevoMedicamento from './components/NuevoMedicamento';
import MantenimientoUsuarios from './components/MantenimientoUsuarios';
import ConfiguracionSistema from './components/ConfiguracionSistema';
import ImprimirNotas from './components/ImprimirNotas';
import CambiarClave from './components/CambiarClave';

// Configure axios defaults
const getBaseURL = () => {
  // In Replit environment, the backend runs on the same domain
  if (window.location.hostname.includes('replit.dev')) {
    return '';
  }

  // For local development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5001';
  }

  // Production - same domain
  return '';
};

// Set up axios with retry logic for Replit
const setupAxios = () => {
  const baseURL = getBaseURL();
  
  axios.defaults.baseURL = baseURL;
  axios.defaults.withCredentials = true;
  axios.defaults.timeout = 10000;

  // Add request interceptor for debugging
  axios.interceptors.request.use(
    (config) => {
      console.log('Making request to:', config.baseURL + config.url);
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Response error:', error.message);
      if (error.code === 'ERR_NETWORK') {
        console.error('Network error - check if backend server is running');
      }
      return Promise.reject(error);
    }
  );
};

setupAxios();

function App() {
  const [enfermero, setEnfermero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in by checking session status
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/status');
        if (response.data.session?.enfermero_id) {
          // User has a valid session
          setEnfermero(response.data.session);
        }
      } catch (error) {
        // User is not authenticated, that's fine
        console.log('User not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (enfermeroData) => {
    setEnfermero(enfermeroData);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setEnfermero(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {enfermero && <Navbar enfermero={enfermero} onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={
              enfermero ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            }
          />

          <Route
            path="/"
            element={
              enfermero ? <Dashboard /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes"
            element={
              enfermero ? <Pacientes /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes/nuevo"
            element={
              enfermero ? <NuevoPaciente /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes/:id"
            element={
              enfermero ? <VerPaciente /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/notas"
            element={
              enfermero ? <NotasEnfermeria /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/notas/nueva"
            element={
              enfermero ? <NuevaNota /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/signos-vitales"
            element={
              enfermero ? <SignosVitales /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/medicamentos"
            element={
              enfermero ? <Medicamentos /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/medicamentos/nuevo"
            element={
              enfermero ? <NuevoMedicamento /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/imprimir-notas"
            element={
              enfermero ? <ImprimirNotas /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/admin/usuarios"
            element={
              enfermero?.codigo === 'admin' ? <MantenimientoUsuarios /> : <Navigate to="/" />
            }
          />

          <Route
            path="/admin/sistema"
            element={
              enfermero?.codigo === 'admin' ? <ConfiguracionSistema /> : <Navigate to="/" />
            }
          />

          <Route
            path="/cambiar-clave"
            element={
              enfermero ? <CambiarClave /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;