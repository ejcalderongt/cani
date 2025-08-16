
import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function CambiarClave({ usuario, onPasswordChanged, onCancel }) {
  const [formData, setFormData] = useState({
    clave_actual: '',
    clave_nueva: '',
    confirmar_clave: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Validate passwords match
    if (formData.clave_nueva !== formData.confirmar_clave) {
      setError('Las contraseñas nuevas no coinciden');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.clave_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/cambiar-mi-clave', {
        claveActual: formData.clave_actual,
        nuevaClave: formData.clave_nueva
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        onPasswordChanged();
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="medical-card login-card">
        <div className="login-header">
          <h1 className="login-title">Cambio de Contraseña Obligatorio</h1>
          <p className="login-subtitle">
            Hola <strong>{usuario.nombre}</strong>, por seguridad debes cambiar tu contraseña antes de continuar.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="clave_actual" className="form-label">
              Contraseña Actual
            </label>
            <input
              id="clave_actual"
              type="password"
              name="clave_actual"
              value={formData.clave_actual}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu contraseña actual"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clave_nueva" className="form-label">
              Nueva Contraseña
            </label>
            <input
              id="clave_nueva"
              type="password"
              name="clave_nueva"
              value={formData.clave_nueva}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu nueva contraseña"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <div className="form-text">
              Mínimo 6 caracteres
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmar_clave" className="form-label">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirmar_clave"
              type="password"
              name="confirmar_clave"
              value={formData.confirmar_clave}
              onChange={handleChange}
              className="form-control"
              placeholder="Confirma tu nueva contraseña"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || !formData.clave_actual || !formData.clave_nueva || !formData.confirmar_clave}
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </button>
            
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
              style={{ flex: '0 0 auto' }}
            >
              Cancelar
            </button>
          </div>
        </form>

        <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          <strong>Política de Seguridad:</strong><br />
          Por seguridad, todos los usuarios deben cambiar su contraseña por defecto en el primer acceso al sistema.
          Después del cambio, deberás iniciar sesión nuevamente con tu nueva contraseña.
        </div>
      </div>
    </div>
  );
}

export default CambiarClave;
