
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function NotasEnfermeria() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNota, setSelectedNota] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get('/api/notas');
        setNotas(response.data);
      } catch (error) {
        console.error('Error al cargar notas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, []);

  const formatDateTime = (fecha, hora) => {
    try {
      const fechaObj = new Date(fecha + 'T' + hora);
      return fechaObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return `${fecha} ${hora}`;
    }
  };

  const handleRowClick = (nota) => {
    setSelectedNota(nota);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNota(null);
  };

  if (loading) {
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
        <h1>Notas de Enfermería</h1>
        <Button as={Link} to="/notas/nueva" variant="primary">
          Nueva Nota
        </Button>
      </div>

      <Card>
        <Card.Body>
          {notas.length === 0 ? (
            <p className="text-muted">No hay notas registradas</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Paciente</th>
                  <th>Enfermero(a)</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => (
                  <tr 
                    key={nota.id} 
                    onClick={() => handleRowClick(nota)}
                    style={{ cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    <td>{formatDateTime(nota.fecha, nota.hora)}</td>
                    <td>
                      <strong>{nota.paciente_nombre} {nota.paciente_apellidos}</strong>
                      <br />
                      <small className="text-muted">Exp: {nota.paciente_expediente}</small>
                    </td>
                    <td>{nota.enfermero_nombre} {nota.enfermero_apellidos}</td>
                    <td>
                      {nota.observaciones.length > 80 
                        ? `${nota.observaciones.substring(0, 80)}...` 
                        : nota.observaciones
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para ver nota completa */}
      <Modal show={showModal} onHide={closeModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nota de Enfermería - Solo Lectura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNota && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Fecha y Hora:</strong>
                  <br />
                  {formatDateTime(selectedNota.fecha, selectedNota.hora)}
                </div>
                <div className="col-md-6">
                  <strong>Enfermero(a):</strong>
                  <br />
                  {selectedNota.enfermero_nombre} {selectedNota.enfermero_apellidos}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Paciente:</strong>
                <br />
                {selectedNota.paciente_nombre} {selectedNota.paciente_apellidos}
                <br />
                <small className="text-muted">Expediente: {selectedNota.paciente_expediente}</small>
              </div>

              <div className="mb-3">
                <strong>Observaciones:</strong>
                <div 
                  className="border rounded p-3 mt-2" 
                  style={{ 
                    backgroundColor: '#f8f9fa',
                    minHeight: '150px',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {selectedNota.observaciones}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .table-row-hover:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </Container>
  );
}

export default NotasEnfermeria;
