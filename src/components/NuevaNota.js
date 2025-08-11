
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevaNota() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].slice(0, 5),
    paciente_id: '',
    observaciones: '',
    medicamentos_administrados: '',
    tratamientos: ''
  });

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await axios.get('/api/pacientes');
        setPacientes(response.data);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
      }
    };

    fetchPacientes();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/notas', formData);
      navigate('/notas');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nueva Nota de Enfermería</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

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

            <Form.Group className="mb-3">
              <Form.Label>Observaciones *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Medicamentos Administrados</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="medicamentos_administrados"
                value={formData.medicamentos_administrados}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tratamientos</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="tratamientos"
                value={formData.tratamientos}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Nota'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => navigate('/notas')}
              >
                Cancelar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default NuevaNota;
