
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function SignosVitales() {
  const [signosVitales, setSignosVitales] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    paciente_id: '',
    presion_sistolica: '',
    presion_diastolica: '',
    saturacion_oxigeno: '',
    frecuencia_cardiaca: '',
    temperatura: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchSignosVitales();
    fetchPacientes();
  }, []);

  const fetchSignosVitales = async () => {
    try {
      const response = await axios.get('/api/signos-vitales');
      setSignosVitales(response.data);
    } catch (error) {
      console.error('Error al cargar signos vitales:', error);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // When patient is selected, show their info
    if (name === 'paciente_id') {
      const paciente = pacientes.find(p => p.id === parseInt(value));
      setSelectedPaciente(paciente);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/signos-vitales', formData);
      setSuccess('Signos vitales registrados correctamente');
      setFormData({
        paciente_id: '',
        presion_sistolica: '',
        presion_diastolica: '',
        saturacion_oxigeno: '',
        frecuencia_cardiaca: '',
        temperatura: '',
        observaciones: ''
      });
      setSelectedPaciente(null);
      fetchSignosVitales();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al registrar signos vitales');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h1 className="mb-2 mb-md-0">Signos Vitales - Clínica de Adicciones</h1>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Row>
        <Col lg={4} className="mb-4">
          <Card className="medical-card">
            <Card.Header>
              <h5>Registrar Signos Vitales</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Paciente</Form.Label>
                  <Form.Select
                    name="paciente_id"
                    value={formData.paciente_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar paciente...</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedPaciente && (
                  <Card className="mb-3 bg-light">
                    <Card.Body className="py-2">
                      <small>
                        <strong>ID:</strong> {selectedPaciente.id}<br/>
                        <strong>Nombre:</strong> {selectedPaciente.nombre} {selectedPaciente.apellidos}<br/>
                        <strong>Fecha Nacimiento:</strong> {selectedPaciente.fecha_nacimiento}<br/>
                        <strong>Sexo:</strong> {selectedPaciente.sexo || 'No especificado'}
                      </small>
                    </Card.Body>
                  </Card>
                )}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Presión Sistólica (mmHg)</Form.Label>
                      <Form.Control
                        type="number"
                        name="presion_sistolica"
                        value={formData.presion_sistolica}
                        onChange={handleChange}
                        placeholder="120"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Presión Diastólica (mmHg)</Form.Label>
                      <Form.Control
                        type="number"
                        name="presion_diastolica"
                        value={formData.presion_diastolica}
                        onChange={handleChange}
                        placeholder="80"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Saturación de Oxígeno (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    name="saturacion_oxigeno"
                    value={formData.saturacion_oxigeno}
                    onChange={handleChange}
                    placeholder="98.5"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Frecuencia Cardíaca (lpm)</Form.Label>
                  <Form.Control
                    type="number"
                    name="frecuencia_cardiaca"
                    value={formData.frecuencia_cardiaca}
                    onChange={handleChange}
                    placeholder="75"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Temperatura (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    name="temperatura"
                    value={formData.temperatura}
                    onChange={handleChange}
                    placeholder="36.5"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleChange}
                    placeholder="Observaciones adicionales..."
                  />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading} className="w-100">
                  {loading ? 'Registrando...' : 'Registrar Signos Vitales'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="medical-card">
            <Card.Header>
              <h5>Historial de Signos Vitales</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover size="sm">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Paciente</th>
                      <th>PA</th>
                      <th>SatO₂</th>
                      <th>FC</th>
                      <th>Temp</th>
                      <th>Enfermero</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signosVitales.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center text-muted">
                          No hay registros de signos vitales
                        </td>
                      </tr>
                    ) : (
                      signosVitales.map((signo) => (
                        <tr key={signo.id}>
                          <td>{formatDateTime(signo.fecha_registro)}</td>
                          <td>
                            <Link to={`/pacientes/${signo.paciente_id}`} className="text-decoration-none">
                              {signo.paciente_nombre} {signo.paciente_apellidos}
                            </Link>
                            <br />
                            <small className="text-muted">{signo.numero_expediente}</small>
                          </td>
                          <td>
                            {signo.presion_sistolica && signo.presion_diastolica
                              ? `${signo.presion_sistolica}/${signo.presion_diastolica}`
                              : '-'}
                          </td>
                          <td>{signo.saturacion_oxigeno ? `${signo.saturacion_oxigeno}%` : '-'}</td>
                          <td>{signo.frecuencia_cardiaca ? `${signo.frecuencia_cardiaca} lpm` : '-'}</td>
                          <td>{signo.temperatura ? `${signo.temperatura}°C` : '-'}</td>
                          <td>
                            <small>
                              {signo.enfermero_nombre} {signo.enfermero_apellidos}
                            </small>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SignosVitales;
