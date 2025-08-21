
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, ProgressBar, Alert, Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function NotasEnfermeria() {
  const [notas, setNotas] = useState([]);
  const [notasFiltradas, setNotasFiltradas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNota, setSelectedNota] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [estadoLlenado, setEstadoLlenado] = useState({});

  // Filtros
  const [filtros, setFiltros] = useState({
    paciente_id: '',
    fecha_inicio: getFirstDayOfCurrentMonth(),
    fecha_fin: getLastDayOfCurrentMonth()
  });

  // Configuración para hoja carta estándar (basado en análisis del PDF real)
  const NOTAS_POR_HOJA = 10; // Máximo 10 notas por hoja según formato oficial

  // Función para obtener el primer día del mes actual
  function getFirstDayOfCurrentMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }

  // Función para obtener el último día del mes actual
  function getLastDayOfCurrentMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchNotas(), fetchPacientes()]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [notas, filtros]);

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

  const fetchPacientes = async () => {
    try {
      const response = await axios.get('/api/pacientes');
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const aplicarFiltros = () => {
    let notasFiltradasTemp = [...notas];

    // Filtrar por paciente
    if (filtros.paciente_id) {
      notasFiltradasTemp = notasFiltradasTemp.filter(nota => 
        nota.paciente_id.toString() === filtros.paciente_id.toString()
      );
    }

    // Filtrar por rango de fechas
    if (filtros.fecha_inicio) {
      notasFiltradasTemp = notasFiltradasTemp.filter(nota => 
        nota.fecha >= filtros.fecha_inicio
      );
    }

    if (filtros.fecha_fin) {
      notasFiltradasTemp = notasFiltradasTemp.filter(nota => 
        nota.fecha <= filtros.fecha_fin
      );
    }

    // Ordenar por fecha y hora (más recientes primero)
    notasFiltradasTemp.sort((a, b) => {
      const fechaHoraA = new Date(a.fecha + 'T' + a.hora);
      const fechaHoraB = new Date(b.fecha + 'T' + b.hora);
      return fechaHoraB - fechaHoraA;
    });

    setNotasFiltradas(notasFiltradasTemp);
    
    // Recalcular estado de llenado con notas filtradas
    calcularEstadoLlenado(notasFiltradasTemp);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      paciente_id: '',
      fecha_inicio: getFirstDayOfCurrentMonth(),
      fecha_fin: getLastDayOfCurrentMonth()
    });
  };

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
            cantidadNotas: 0
          };
        }
        estadoPorPaciente[pacienteId].cantidadNotas += 1;
      }
    });

    setEstadoLlenado(estadoPorPaciente);
  };

  const getPorcentajeLlenado = (pacienteId) => {
    const estado = estadoLlenado[pacienteId];
    if (!estado) return 0;
    return Math.min((estado.cantidadNotas / NOTAS_POR_HOJA) * 100, 100);
  };

  const getVarianteLlenado = (porcentaje) => {
    if (porcentaje >= 85) return 'danger';
    if (porcentaje >= 60) return 'warning';
    return 'success';
  };

  const formatDateTime = (fecha, hora) => {
    try {
      // Asegurar que la fecha esté en formato correcto
      let fechaToProcess = fecha;
      if (fechaToProcess && fechaToProcess.includes('T')) {
        fechaToProcess = fechaToProcess.split('T')[0];
      }
      
      if (!fechaToProcess || !hora) {
        return 'Fecha/Hora inválida';
      }

      const fechaObj = new Date(fechaToProcess + 'T' + hora);
      
      // Verificar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        return `${fechaToProcess} ${hora}`;
      }

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

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filtros de Búsqueda</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Paciente</Form.Label>
                <Form.Select
                  value={filtros.paciente_id}
                  onChange={(e) => handleFiltroChange('paciente_id', e.target.value)}
                >
                  <option value="">Todos los pacientes</option>
                  {pacientes.map((paciente) => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={limpiarFiltros}
                className="mb-3"
                size="sm"
              >
                Limpiar
              </Button>
            </Col>
          </Row>
          <div className="text-muted small">
            Mostrando {notasFiltradas.length} de {notas.length} notas
          </div>
        </Card.Body>
      </Card>

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
                      {estado.cantidadNotas}/{NOTAS_POR_HOJA} notas ({Math.round(porcentaje)}%)
                    </small>
                  </div>
                  <ProgressBar
                    now={porcentaje}
                    variant={getVarianteLlenado(porcentaje)}
                    size="sm"
                  />
                  {porcentaje >= 80 && (
                    <Alert variant="warning" className="mt-2 mb-0 py-2">
                      <small>⚠️ Hoja casi llena - {estado.cantidadNotas} de {NOTAS_POR_HOJA} notas</small>
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
          {notasFiltradas.length === 0 ? (
            <Alert variant="info">
              No se encontraron notas que coincidan con los filtros aplicados.
            </Alert>
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
                {notasFiltradas.map((nota) => (
                  <tr 
                    key={nota.id} 
                    onClick={() => handleRowClick(nota)}
                    style={{ cursor: 'pointer' }}
                    className="table-row-hover"
                  >
                    <td>
                      <strong>{formatDateTime(nota.fecha, nota.hora)}</strong>
                    </td>
                    <td>
                      <strong>{nota.paciente_nombre} {nota.paciente_apellidos}</strong>
                      <br />
                      <small className="text-muted">Exp: {nota.paciente_expediente}</small>
                    </td>
                    <td>{nota.enfermero_nombre} {nota.enfermero_apellidos}</td>
                    <td>
                      {nota.observaciones && nota.observaciones.length > 80 
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
