import React, { useState } from 'react';
import { Container, Card, Button, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';

function ConfiguracionSistema() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleResetDatabase = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/reset-database', {}, {
        withCredentials: true
      });
      setSuccess(response.data.message);
      setShowConfirmModal(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al reinicializar la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const insertSampleData = async () => {
    if (!window.confirm('¿Está seguro de que desea cargar datos de ejemplo? Esto añadirá pacientes y notas de prueba.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/admin/insert-sample-data', {}, {
        withCredentials: true
      });
      setSuccess(response.data.message);
    } catch (error) {
      setError(error.response?.data?.error || 'Error al insertar los datos de ejemplo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Configuración del Sistema</h1>
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

      <div className="row">
        <div className="col-md-6">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Base de Datos</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted mb-3">
                Reinicializar la base de datos eliminará todos los pacientes, notas de enfermería 
                y medicamentos personalizados. Los usuarios del sistema se mantendrán intactos.
              </p>

              <div className="alert alert-warning">
                <strong>⚠️ Advertencia:</strong> Esta acción es irreversible. 
                Asegúrese de tener un respaldo si es necesario.
              </div>

              <Button
                variant="danger"
                onClick={openConfirmModal}
                disabled={loading}
                className="me-2"
              >
                {loading ? 'Reinicializando...' : 'Reinicializar Base de Datos'}
              </Button>
              <Button 
                variant="success" 
                onClick={insertSampleData}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Cargar Datos de Ejemplo'}
              </Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-6">
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Información del Sistema</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Versión:</strong> 1.0.0
              </div>
              <div className="mb-3">
                <strong>Base de Datos:</strong> PostgreSQL
              </div>
              <div className="mb-3">
                <strong>Estado:</strong> <span className="badge bg-success">Activo</span>
              </div>
              <div className="mb-3">
                <strong>Último Mantenimiento:</strong> Sistema nuevo
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={closeConfirmModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Reinicialización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
            </div>
            <h5>¿Está seguro de que desea reinicializar la base de datos?</h5>
            <p className="text-muted">
              Esta acción eliminará permanentemente:
            </p>
            <ul className="text-start text-muted">
              <li>Todos los pacientes registrados</li>
              <li>Todas las notas de enfermería</li>
              <li>Todos los medicamentos personalizados</li>
              <li>Todas las asignaciones de medicamentos</li>
            </ul>
            <p className="text-success">
              <strong>Los usuarios del sistema se mantendrán intactos.</strong>
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirmModal}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleResetDatabase}
            disabled={loading}
          >
            {loading ? 'Reinicializando...' : 'Sí, Reinicializar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ConfiguracionSistema;