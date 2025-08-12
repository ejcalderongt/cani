
import React, { useState } from 'react';

function CambiarPassword({ enfermero, onPasswordChanged, onCancel }) {
  const [formData, setFormData] = useState({
    claveActual: '',
    nuevaClave: '',
    confirmarClave: ''
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

    if (formData.nuevaClave.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.nuevaClave !== formData.confirmarClave) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (formData.claveActual === formData.nuevaClave) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/cambiar-clave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          codigo: enfermero.codigo,
          claveActual: formData.claveActual,
          nuevaClave: formData.nuevaClave
        }),
      });

      const data = await response.json();

      if (data.success) {
        onPasswordChanged();
      } else {
        setError(data.message || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Error de conexión. Intenta más tarde.');
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
            Por políticas de seguridad, debes cambiar tu contraseña antes de continuar
          </p>
          <div style={{
            background: 'rgba(15, 118, 110, 0.1)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)'
          }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
              <strong>Usuario:</strong> {enfermero.nombre} {enfermero.apellidos} ({enfermero.codigo})
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="claveActual" className="form-label">
              Contraseña Actual *
            </label>
            <input
              id="claveActual"
              type="password"
              name="claveActual"
              value={formData.claveActual}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu contraseña actual"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nuevaClave" className="form-label">
              Nueva Contraseña *
            </label>
            <input
              id="nuevaClave"
              type="password"
              name="nuevaClave"
              value={formData.nuevaClave}
              onChange={handleChange}
              className="form-control"
              placeholder="Ingresa tu nueva contraseña"
              required
              minLength={6}
            />
            <div className="form-text">
              Mínimo 6 caracteres
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarClave" className="form-label">
              Confirmar Nueva Contraseña *
            </label>
            <input
              id="confirmarClave"
              type="password"
              name="confirmarClave"
              value={formData.confirmarClave}
              onChange={handleChange}
              className="form-control"
              placeholder="Confirma tu nueva contraseña"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || !formData.claveActual || !formData.nuevaClave || !formData.confirmarClave}
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
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={loading}
              style={{ flex: '0 0 auto' }}
            >
              Cancelar
            </button>
          </div>
        </form>

        <div style={{ 
          marginTop: 'var(--space-6)', 
          padding: 'var(--space-4)', 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderRadius: 'var(--radius)', 
          fontSize: 'var(--text-sm)', 
          color: 'var(--muted)' 
        }}>
          <strong>⚠️ Importante:</strong><br />
          Después de cambiar tu contraseña, deberás iniciar sesión nuevamente con tu nueva contraseña.
        </div>
      </div>
    </div>
  );
}

export default CambiarPassword;
