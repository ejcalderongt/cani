
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, ProgressBar, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function NotasEnfermeria() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNota, setSelectedNota] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [estadoLlenado, setEstadoLlenado] = useState({});

  // Configuración para hoja legal estándar
  const CARACTERES_POR_HOJA = 2000;

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get('/api/notas');
        const notasData = response.data;
        setNotas(notasData);
        
        // Calcular estado de llenado por paciente para el día actual
        calcularEstadoLlenado(notasData);
      } catch (error) {
        console.error('Error al cargar notas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, []);

  const calcularEstadoLlenado = (notasData) => {
    const hoy = new Date().toISOString().split('T')[0];
    const estadoPorPaciente = {};

    // Agrupar notas por paciente para el día actual
    notasData.forEach(nota => {
      if (nota.fecha === hoy) {
        const pacienteId = nota.paciente_id;
        if (!estadoPorPaciente[pacienteId]) {
          estadoPorPaciente[pacienteId] = {
            nombre: `${nota.paciente_nombre} ${nota.paciente_apellidos}`,
            expediente: nota.paciente_expediente,
            caracteresTotales: 0,
            cantidadNotas: 0
          };
        }
        estadoPorPaciente[pacienteId].caracteresTotales += (nota.observaciones?.length || 0);
        estadoPorPaciente[pacienteId].cantidadNotas += 1;
      }
    });

    setEstadoLlenado(estadoPorPaciente);
  };

  const getPorcentajeLlenado = (pacienteId) => {
    const estado = estadoLlenado[pacienteId];
    if (!estado) return 0;
    return Math.min((estado.caracteresTotales / CARACTERES_POR_HOJA) * 100, 100);
  };

  const getVarianteLlenado = (porcentaje) => {
    if (porcentaje >= 85) return 'danger';
    if (porcentaje >= 60) return 'warning';
    return 'success';
  };

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

      {/* Mostrar estado de llenado del día actual */}
      {Object.keys(estadoLlenado).length > 0 && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Estado de Llenado de Hojas - Día Actual</h5>
          </Card.Header>
          <Card.Body>
            {Object.entries(estadoLlenado).map(([pacienteId, estado]) => {
              const porcentaje = getPorcentajeLlenado(pacienteId);
              return (
                <div key={pacienteId} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small>
                      <strong>{estado.nombre}</strong> (Exp: {estado.expediente})
                    </small>
                    <small>
                      {Math.round(porcentaje)}% - {estado.cantidadNotas} nota(s)
                    </small>
                  </div>
                  <ProgressBar
                    now={porcentaje}
                    variant={getVarianteLlenado(porcentaje)}
                    size="sm"
                  />
                  {porcentaje >= 85 && (
                    <Alert variant="warning" className="mt-2 mb-0 py-2">
                      <small>⚠️ Hoja casi llena - Se recomienda imprimir</small>
                    </Alert>
                  )}
                </div>
              );
            })}
            <div className="text-end mt-3">
              <Button
                as={Link}
                to="/imprimir-notas"
                variant="outline-primary"
                size="sm"
              >
                📄 Imprimir Notas
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

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
                  <th>Estado Hoja</th>
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
                    <td style={{ width: '120px' }}>
                      {nota.fecha === new Date().toISOString().split('T')[0] && (
                        <div>
                          <small className="text-muted d-block">
                            {Math.round(getPorcentajeLlenado(nota.paciente_id))}%
                          </small>
                          <ProgressBar
                            now={getPorcentajeLlenado(nota.paciente_id)}
                            variant={getVarianteLlenado(getPorcentajeLlenado(nota.paciente_id))}
                            size="sm"
                            style={{ height: '6px' }}
                          />
                        </div>
                      )}
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
