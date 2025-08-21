
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

  // Generate expedition number suggestion based on birth date
  const generateExpeditionNumber = (birthDate) => {
    if (!birthDate) return '';
    const date = new Date(birthDate);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${year}${month}${day}${random}`;
  };

  const handleChange = (e) => {
    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value
    };

    // Auto-suggest expedition number when birth date changes
    if (e.target.name === 'fecha_nacimiento' && e.target.value) {
      newFormData.numero_expediente = generateExpeditionNumber(e.target.value);
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    const requiredFields = [
      { field: 'numero_expediente', name: 'Número de Expediente' },
      { field: 'nombre', name: 'Nombre' },
      { field: 'apellidos', name: 'Apellidos' },
      { field: 'fecha_nacimiento', name: 'Fecha de Nacimiento' },
      { field: 'sexo', name: 'Sexo' },
      { field: 'documento_identidad', name: 'Documento de Identidad' },
      { field: 'nacionalidad', name: 'Nacionalidad' },
      { field: 'telefono_principal', name: 'Teléfono Principal' },
      { field: 'tipo_paciente', name: 'Tipo de Paciente' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      setError(`Los siguientes campos son obligatorios: ${missingFields.map(({ name }) => name).join(', ')}`);
      setLoading(false);
      return;
    }

    // Validate numeric fields if provided
    if (formData.peso && (isNaN(formData.peso) || parseFloat(formData.peso) <= 0)) {
      setError('El peso debe ser un número positivo');
      setLoading(false);
      return;
    }

    if (formData.estatura && (isNaN(formData.estatura) || parseFloat(formData.estatura) <= 0)) {
      setError('La estatura debe ser un número positivo');
      setLoading(false);
      return;
    }

    // Validate birth date is not in the future
    if (new Date(formData.fecha_nacimiento) > new Date()) {
      setError('La fecha de nacimiento no puede ser en el futuro');
      setLoading(false);
      return;
    }

    try {
      // Prepare data with proper formatting
      const dataToSend = {
        ...formData,
        // Ensure empty strings are converted to null for optional fields
        contacto_emergencia_nombre: formData.contacto_emergencia_nombre || null,
        contacto_emergencia_telefono: formData.contacto_emergencia_telefono || null,
        telefono_secundario: formData.telefono_secundario || null,
        tipo_sangre: formData.tipo_sangre || null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        estatura: formData.estatura ? parseFloat(formData.estatura) : null,
        padecimientos: formData.padecimientos || null,
        informacion_general: formData.informacion_general || null,
        cuarto_asignado: formData.cuarto_asignado || null,
        fecha_ingreso: formData.fecha_ingreso || new Date().toISOString(),
        motivo_ingreso: formData.motivo_ingreso || null,
        fase_tratamiento: formData.fase_tratamiento || null,
        unidad_cama: formData.unidad_cama || null,
        medico_tratante: formData.medico_tratante || null,
        equipo_tratante: formData.equipo_tratante || null
      };

      const response = await axios.post('/api/pacientes', dataToSend);
      
      // Show success message briefly before redirecting
      setError('');
      alert('Paciente creado exitosamente');
      navigate('/pacientes');
    } catch (error) {
      console.error('Error creating patient:', error);
      
      let errorMessage = 'Error al crear paciente';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Error en los datos enviados. Verifique los campos obligatorios.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Contacte al administrador.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Error de conexión. Verifique su conexión a internet.';
      }
      
      setError(errorMessage);
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
                  <Form.Text className="text-muted">
                    Se sugiere automáticamente al ingresar la fecha de nacimiento
                  </Form.Text>
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
                  <Form.Label>Tipo de Sangre (Opcional)</Form.Label>
                  <Form.Select
                    name="tipo_sangre"
                    value={formData.tipo_sangre}
                    onChange={handleChange}
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

            <h5 className="text-primary mb-3 mt-4">Información del Episodio <small className="text-muted">(Opcional)</small></h5>
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
                  <Form.Label>Motivo de Ingreso (Opcional)</Form.Label>
                  <Form.Select
                    name="motivo_ingreso"
                    value={formData.motivo_ingreso}
                    onChange={handleChange}
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
                  <Form.Label>Fase de Tratamiento (Opcional)</Form.Label>
                  <Form.Select
                    name="fase_tratamiento"
                    value={formData.fase_tratamiento}
                    onChange={handleChange}
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
