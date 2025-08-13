import React, { useState } from 'react';
import axios from 'axios';
import CambiarPassword from './CambiarPassword';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({ codigo: '', clave: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState(null);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { codigo: formData.codigo });

      // Create axios instance with proper configuration
      const getBackendURL = () => {
        // For Replit environment, use same origin
        if (window.location.hostname.includes('replit.dev')) {
          return window.location.origin;
        }
        
        // For local development
        if (window.location.hostname === 'localhost') {
          return 'http://localhost:5001';
        }
        
        return window.location.origin;
      };

      const axiosInstance = axios.create({
        baseURL: getBackendURL(),
        withCredentials: true,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const response = await axiosInstance.post('/api/login', formData);

      if (response.data.success) {
        if (response.data.requiere_cambio_clave) {
          // User needs to change password
          setUserForPasswordChange(response.data.enfermero);
          setShowPasswordChange(true);
        } else {
          // Get complete user session data after login
          try {
            const sessionResponse = await axiosInstance.get('/api/status');
            if (sessionResponse.data.session) {
              onLogin(sessionResponse.data.session);
            } else {
              onLogin(response.data.enfermero);
            }
          } catch (error) {
            // Fallback to login response data
            onLogin(response.data.enfermero);
          }
        }
      } else {
        setError(response.data.message || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });

      if (error.code === 'ECONNABORTED') {
        setError('Tiempo de espera agotado. Verifica tu conexión.');
      } else if (error.response) {
        setError(error.response.data?.message || 'Credenciales incorrectas');
      } else if (error.request) {
        setError('No se puede conectar al servidor. Intenta más tarde.');
      } else {
        setError('Error inesperado. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setShowPasswordChange(false);
    setUserForPasswordChange(null);
    setFormData({ codigo: '', clave: '' });
    setSuccess('Contraseña cambiada correctamente. Por favor inicia sesión nuevamente.');
    setTimeout(() => setSuccess(''), 5000);
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordChange(false);
    setUserForPasswordChange(null);
    setFormData({ codigo: '', clave: '' });
  };

  if (showPasswordChange && userForPasswordChange) {
    return (
      <CambiarPassword
        enfermero={userForPasswordChange}
        onPasswordChanged={handlePasswordChanged}
        onCancel={handlePasswordChangeCancel}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="medical-card login-card">
        <div className="login-header">
          <h1 className="login-title">Sistema Hospitalario</h1>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            <strong>Éxito:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="codigo" className="form-label">
              Código de Usuario
            </label>
            <input
              id="codigo"
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu código"
              required
              autoComplete="username"
              aria-describedby="codigo-help"
            />
            <div id="codigo-help" className="form-text">
              Usa tu código de empleado asignado
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="clave" className="form-label">
              Contraseña
            </label>
            <input
              id="clave"
              type="password"
              name="clave"
              value={formData.clave}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
            disabled={loading || !formData.codigo || !formData.clave}
            style={{ width: '100%', marginTop: 'var(--space-6)' }}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>


      </div>
    </div>
  );
}

export default Login;