
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Alert, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NotasActuales() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Set default dates (yesterday and today)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [fechaInicio, setFechaInicio] = useState(yesterday.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    // Load notes automatically with default date range
    buscarNotas();
  }, []);

  const buscarNotas = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/notas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      setNotas(response.data);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      setError('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
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

  const agruparNotasPorFecha = (notas) => {
    return notas.reduce((grupos, nota) => {
      const fecha = nota.fecha;
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(nota);
      return grupos;
    }, {});
  };

  const notasAgrupadas = agruparNotasPorFecha(notas);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Notas Actuales</h1>
        <Button 
          variant="secondary"
          onClick={() => navigate('/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Filtrar Notas por Rango de Fechas</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form>
            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={buscarNotas}
                  disabled={loading}
                  className="mb-3"
                >
                  {loading ? 'Cargando...' : 'Buscar Notas'}
                </Button>
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {notas.length === 0 && !loading ? (
        <Alert variant="info">
          No se encontraron notas en el rango de fechas seleccionado.
        </Alert>
      ) : (
        Object.keys(notasAgrupadas)
          .sort((a, b) => new Date(b) - new Date(a))
          .map(fecha => (
            <Card key={fecha} className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {new Date(fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h5>
                  <Badge bg="primary">
                    {notasAgrupadas[fecha].length} nota(s)
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Enfermero(a)</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasAgrupadas[fecha]
                      .sort((a, b) => b.hora.localeCompare(a.hora))
                      .map((nota) => (
                        <tr key={nota.id}>
                          <td>
                            <strong>{nota.hora}</strong>
                          </td>
                          <td>
                            <strong>{nota.paciente_nombre} {nota.paciente_apellidos}</strong>
                            <br />
                            <small className="text-muted">Exp: {nota.paciente_expediente}</small>
                          </td>
                          <td>{nota.enfermero_nombre} {nota.enfermero_apellidos}</td>
                          <td>
                            <div style={{ maxWidth: '400px' }}>
                              {nota.observaciones.length > 100 
                                ? `${nota.observaciones.substring(0, 100)}...` 
                                : nota.observaciones
                              }
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ))
      )}

      {loading && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando notas...</span>
          </div>
        </div>
      )}
    </Container>
  );
}

export default NotasActuales;
