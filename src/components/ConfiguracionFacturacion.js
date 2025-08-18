
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table, Modal } from 'react-bootstrap';
import axios from 'axios';

function ConfiguracionFacturacion() {
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    server_monthly_fee: 20.00,
    annual_maintenance_fee: 150.00,
    per_patient_fee: 10.00,
    currency: 'USD',
    prorate_annual_maintenance: true,
    active_patient_rule: 'status_active'
  });
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchAuditLog();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await axios.get('/api/admin/billing-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      if (error.response?.status === 404) {
        setError('Configuración de facturación no encontrada');
      } else {
        setError('Error al cargar la configuración de facturación');
      }
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await axios.get('/api/admin/billing-settings/audit');
      setAuditLog(response.data);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put('/api/admin/billing-settings', settings);
      setSuccess('Configuración de facturación actualizada correctamente');
      fetchAuditLog(); // Refresh audit log
    } catch (error) {
      console.error('Error updating billing settings:', error);
      setError(error.response?.data?.error || 'Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  if (loadingSettings) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Configuración de Facturación</h1>
        <Button variant="outline-info" onClick={() => setShowAudit(true)}>
          Ver Historial
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Parámetros de Facturación</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Cargo Fijo del Servidor (Mensual)</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="server_monthly_fee"
                      value={settings.server_monthly_fee}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="input-group-text">{settings.currency}</span>
                  </div>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Mantenimiento Anual</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="annual_maintenance_fee"
                      value={settings.annual_maintenance_fee}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="input-group-text">{settings.currency}</span>
                  </div>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Costo por Paciente Activo (Mensual)</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="per_patient_fee"
                      value={settings.per_patient_fee}
                      onChange={handleInputChange}
                      required
                    />
                    <span className="input-group-text">{settings.currency}</span>
                  </div>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Moneda</Form.Label>
                  <Form.Select
                    name="currency"
                    value={settings.currency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="USD">USD - Dólar Estadounidense</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="COP">COP - Peso Colombiano</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="prorate_annual_maintenance"
                    checked={settings.prorate_annual_maintenance}
                    onChange={handleInputChange}
                    label="Prorratear mantenimiento anual mensualmente"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Regla de Paciente Activo</Form.Label>
                  <Form.Select
                    name="active_patient_rule"
                    value={settings.active_patient_rule}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="status_active">Estado Activo</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Define cómo se cuenta un paciente como "activo" para facturación
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={fetchSettings}
                disabled={loading}
              >
                Recargar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {settings.updated_by_name && (
        <div className="mt-3">
          <small className="text-muted">
            Última modificación: {new Date(settings.updated_at).toLocaleString('es-ES')} por {settings.updated_by_name}
          </small>
        </div>
      )}

      <Modal show={showAudit} onHide={() => setShowAudit(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Historial de Cambios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.changed_at).toLocaleString('es-ES')}</td>
                  <td>{entry.user_name || 'Usuario desconocido'}</td>
                  <td>{entry.action}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          {auditLog.length === 0 && (
            <p className="text-center text-muted">No hay cambios registrados</p>
          )}
        </Modal.Body>
      </Modal>

      <div className="mt-4">
        <Alert variant="info">
          <strong>Información:</strong> Estos parámetros determinan cómo se calcula el costo mensual 
          de la plataforma. Los cambios se aplicarán a los nuevos documentos de facturación generados.
        </Alert>
      </div>
    </Container>
  );
}

export default ConfiguracionFacturacion;
