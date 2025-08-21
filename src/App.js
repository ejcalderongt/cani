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
import SignosVitales from './components/SignosVitales';
import Medicamentos from './components/Medicamentos';
import NuevoMedicamento from './components/NuevoMedicamento';
import MantenimientoUsuarios from './components/MantenimientoUsuarios';
import MantenimientoTerapeutas from './components/MantenimientoTerapeutas';
import ConfiguracionSistema from './components/ConfiguracionSistema';
import ConfiguracionHospital from './components/ConfiguracionHospital';
import ConfiguracionFacturacion from './components/ConfiguracionFacturacion';
import Autocobro from './components/Autocobro';
import ImprimirNotas from './components/ImprimirNotas';
import CambiarClave from './components/CambiarClave';
import NotasActuales from './components/NotasActuales';

// Configure axios globally to include credentials
axios.defaults.withCredentials = true;

// Simple axios setup - only relative URLs
axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;

// Determinar la URL base de la API
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : window.location.origin;

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/status', {
        withCredentials: true,
        timeout: 10000
      });

      if (response.data.authenticated) {
        const userData = {
          ...response.data.usuario,
          // Ensure admin always has billing access
          can_manage_billing: response.data.usuario.rol === 'admin' ? true : response.data.usuario.can_manage_billing
        };
        setUser(userData);
        setIsAuthenticated(true);
        setRequirePasswordChange(response.data.requiere_cambio_clave || false);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setRequirePasswordChange(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
      setIsAuthenticated(false);
      setRequirePasswordChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setRequirePasswordChange(userData.requiere_cambio_clave || false);
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      setIsAuthenticated(false);
      setRequirePasswordChange(false);
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

  if (requirePasswordChange) {
    return (
      <Router>
        <Routes>
          <Route path="/cambiar-clave" element={<CambiarClave onPasswordChangeSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="*" element={<Navigate to="/cambiar-clave" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        {user && <Navbar enfermero={user} onLogout={handleLogout} />}

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
            element={<ImprimirNotas />}
          />
            <Route path="/notas-actuales" element={<NotasActuales />} />

          <Route
            path="/admin/usuarios"
            element={
              user?.rol === 'admin' ? <MantenimientoUsuarios /> : <Navigate to="/" />
            }
          />

          <Route
            path="/admin/sistema"
            element={
              user?.rol === 'admin' ? <ConfiguracionSistema /> : <Navigate to="/" />
            }
          />
          <Route
            path="/mantenimiento-terapeutas"
            element={<MantenimientoTerapeutas />}
          />
          <Route
            path="/autocobro"
            element={
              (user?.rol === 'admin' || user?.can_manage_billing) ? <Autocobro /> : <Navigate to="/" />
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