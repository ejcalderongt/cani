
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
    sexo: '',
    documento_identidad: '',
    nacionalidad: '',
    contacto_emergencia_nombre: '',
    contacto_emergencia_telefono: '',
    telefono_principal: '',
    telefono_secundario: '',
    tipo_sangre: '',
    peso: '',
    estatura: '',
    padecimientos: '',
    informacion_general: '',
    tipo_paciente: 'ambulatorio',
    cuarto_asignado: '',
    fecha_ingreso: '',
    motivo_ingreso: '',
    fase_tratamiento: '',
    unidad_cama: '',
    medico_tratante: '',
    equipo_tratante: '',
    riesgo_suicidio: false,
    riesgo_violencia: false,
    riesgo_fuga: false,
    riesgo_caidas: false
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
      // Set fecha_ingreso to current datetime if not provided
      const dataToSend = {
        ...formData,
        fecha_ingreso: formData.fecha_ingreso || new Date().toISOString()
      };
      await axios.post('/api/pacientes', dataToSend);
      navigate('/pacientes');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nuevo Paciente - Clínica de Tratamiento de Adicciones</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <h5 className="text-primary mb-3">Datos Básicos</h5>
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
              <Col md={4}>
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
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexo al Nacer</Form.Label>
                  <Form.Select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
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
                  <Form.Label>Peso (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="peso"
                    value={formData.peso}
                    onChange={handleChange}
                    placeholder="Ej: 70.5"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estatura (m)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="estatura"
                    value={formData.estatura}
                    onChange={handleChange}
                    placeholder="Ej: 1.75"
                  />
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

            <h5 className="text-primary mb-3 mt-4">Información del Episodio</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha/Hora de Ingreso</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Motivo de Ingreso</Form.Label>
                  <Form.Select
                    name="motivo_ingreso"
                    value={formData.motivo_ingreso}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="desintoxicacion">Desintoxicación</option>
                    <option value="recaida">Recaída</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fase de Tratamiento</Form.Label>
                  <Form.Select
                    name="fase_tratamiento"
                    value={formData.fase_tratamiento}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="intoxicacion_aguda">Intoxicación Aguda</option>
                    <option value="abstinencia">Abstinencia</option>
                    <option value="estabilizacion">Estabilización</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Unidad/Cama</Form.Label>
                  <Form.Control
                    type="text"
                    name="unidad_cama"
                    value={formData.unidad_cama}
                    onChange={handleChange}
                    placeholder="Ej: Unidad A - Cama 12"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Médico Tratante</Form.Label>
                  <Form.Control
                    type="text"
                    name="medico_tratante"
                    value={formData.medico_tratante}
                    onChange={handleChange}
                    placeholder="Dr. Nombre Apellido"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Equipo Tratante</Form.Label>
                  <Form.Control
                    type="text"
                    name="equipo_tratante"
                    value={formData.equipo_tratante}
                    onChange={handleChange}
                    placeholder="Psicólogo, Trabajador Social, etc."
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="text-warning mb-3">Riesgos al Ingreso</h6>
            <Row>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Suicidio/Autoagresión"
                  name="riesgo_suicidio"
                  checked={formData.riesgo_suicidio}
                  onChange={(e) => setFormData({...formData, riesgo_suicidio: e.target.checked})}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Violencia"
                  name="riesgo_violencia"
                  checked={formData.riesgo_violencia}
                  onChange={(e) => setFormData({...formData, riesgo_violencia: e.target.checked})}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Fuga"
                  name="riesgo_fuga"
                  checked={formData.riesgo_fuga}
                  onChange={(e) => setFormData({...formData, riesgo_fuga: e.target.checked})}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Caídas"
                  name="riesgo_caidas"
                  checked={formData.riesgo_caidas}
                  onChange={(e) => setFormData({...formData, riesgo_caidas: e.target.checked})}
                />
              </Col>
            </Row>

            {formData.tipo_paciente === 'interno' && (
              <Form.Group className="mb-3 mt-3">
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
