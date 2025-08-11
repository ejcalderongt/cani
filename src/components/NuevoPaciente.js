
import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevoPaciente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    numero_expediente: '',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    documento_identidad: '',
    nacionalidad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    telefono_principal: '',
    telefono_secundario: '',
    tipo_sangre: '',
    padecimientos: '',
    informacion_general: '',
    tipo_paciente: 'ambulatorio',
    cuarto_asignado: ''
  });

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
      await axios.post('/api/pacientes', formData);
      navigate('/pacientes');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nuevo Paciente</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Expediente</Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_expediente"
                    value={formData.numero_expediente}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Paciente</Form.Label>
                  <Form.Select
                    name="tipo_paciente"
                    value={formData.tipo_paciente}
                    onChange={handleChange}
                    required
                  >
                    <option value="ambulatorio">Ambulatorio</option>
                    <option value="interno">Interno</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de Nacimiento</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento de Identidad</Form.Label>
                  <Form.Control
                    type="text"
                    name="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nacionalidad</Form.Label>
                  <Form.Control
                    type="text"
                    name="nacionalidad"
                    value={formData.nacionalidad}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Sangre</Form.Label>
                  <Form.Select
                    name="tipo_sangre"
                    value={formData.tipo_sangre}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono Principal</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono_principal"
                    value={formData.telefono_principal}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono Secundario</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono_secundario"
                    value={formData.telefono_secundario}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contacto de Emergencia - Nombre</Form.Label>
                  <Form.Control
                    type="text"
                    name="contacto_emergencia_nombre"
                    value={formData.contacto_emergencia_nombre}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contacto de Emergencia - Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    name="contacto_emergencia_telefono"
                    value={formData.contacto_emergencia_telefono}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {formData.tipo_paciente === 'interno' && (
              <Form.Group className="mb-3">
                <Form.Label>Cuarto Asignado</Form.Label>
                <Form.Control
                  type="text"
                  name="cuarto_asignado"
                  value={formData.cuarto_asignado}
                  onChange={handleChange}
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Padecimientos</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="padecimientos"
                value={formData.padecimientos}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Información General</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="informacion_general"
                value={formData.informacion_general}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Paciente'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => navigate('/pacientes')}
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

export default NuevoPaciente;
