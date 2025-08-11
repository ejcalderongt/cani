import React, { useState } from 'react';
import axios from 'axios';
import CambiarClave from './CambiarClave';

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

      // Create axios instance with proper configuration for Replit
      const axiosInstance = axios.create({
        baseURL: window.location.origin.replace(':3001', ':3002'), // Use port 3002 which maps to 5001
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
          // Normal login flow
          onLogin(response.data.enfermero);
        }
      } else {
        setError(response.data.message || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Login error:', error);

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
      <CambiarClave 
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

        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(15, 118, 110, 0.05)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          <strong>Credenciales de prueba:</strong><br />
          <strong>Admin:</strong> <code style={{ background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: '4px' }}>admin</code> / <code style={{ background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: '4px' }}>Admin1965!*</code><br />
          <strong>Usuarios:</strong> <code style={{ background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: '4px' }}>erick</code>, <code style={{ background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: '4px' }}>cintia</code> / <code style={{ background: 'var(--bg-elev)', padding: '2px 6px', borderRadius: '4px' }}>abc123</code><br />
          <small><em>Los usuarios deben cambiar su contraseña en el primer acceso.</em></small>
        </div>
      </div>
    </div>
  );
}

export default Login;