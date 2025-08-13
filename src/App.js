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
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname.includes('replit.dev');

  if (isDevelopment) {
    // In development, backend runs on port 5001
    if (window.location.hostname.includes('replit.dev')) {
      return window.location.origin.replace(':3001', ':5001');
    }
    return 'http://localhost:5001';
  }

  return '';
};

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
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State to manage authentication status

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/status');
        if (response.data.session && !response.data.requiere_cambio_clave) {
          setEnfermero(response.data.session);
          setIsAuthenticated(true);
        } else if (response.data.requiere_cambio_clave) {
          // User needs to change password, keep them in login flow
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogin = (enfermeroData) => {
    setEnfermero(enfermeroData);
    setIsAuthenticated(true); // Set isAuthenticated to true upon successful login
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setEnfermero(null);
      setIsAuthenticated(false); // Set isAuthenticated to false on logout
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

  // Determine if the user needs to change password
  const requiresPasswordChange = !loading && !isAuthenticated && enfermero === null; // Simplified check, might need refinement based on API response

  return (
    <Router>
      <div className="App">
        {enfermero && <Navbar enfermero={enfermero} onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            }
          />

          <Route
            path="/"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes"
            element={
              isAuthenticated ? <Pacientes /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes/nuevo"
            element={
              isAuthenticated ? <NuevoPaciente /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/pacientes/:id"
            element={
              isAuthenticated ? <VerPaciente /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/notas"
            element={
              isAuthenticated ? <NotasEnfermeria /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/notas/nueva"
            element={
              isAuthenticated ? <NuevaNota /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/signos-vitales"
            element={
              isAuthenticated ? <SignosVitales /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/medicamentos"
            element={
              isAuthenticated ? <Medicamentos /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/medicamentos/nuevo"
            element={
              isAuthenticated ? <NuevoMedicamento /> : <Navigate to="/login" />
            }
          />

          <Route
            path="/imprimir-notas"
            element={
              isAuthenticated ? <ImprimirNotas /> : <Navigate to="/login" />
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
              isAuthenticated ? <CambiarClave /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;