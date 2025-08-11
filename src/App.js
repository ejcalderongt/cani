
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
import Medicamentos from './components/Medicamentos';
import NuevoMedicamento from './components/NuevoMedicamento';

// Configure axios defaults
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
axios.defaults.withCredentials = true;

function App() {
  const [enfermero, setEnfermero] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const response = await axios.get('/api/pacientes');
        if (response.status === 200) {
          // User is authenticated, but we need to get user info
          setLoading(false);
        }
      } catch (error) {
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
