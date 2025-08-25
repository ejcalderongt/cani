import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevoPaciente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [terapeutas, setTerapeutas] = useState([]);
  const [formData, setFormData] = useState({
    numero_expediente: '',
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    dia_nacimiento: '',
    mes_nacimiento: '',
    year_nacimiento: '',
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
    fecha_ingreso: new Date().toISOString().slice(0, 16), // Default to current date and time
    motivo_ingreso: '',
    fase_tratamiento: '',
    unidad_cama: '',
    medico_tratante: '',
    terapeuta_tratante_id: '',
    equipo_tratante: '',
    riesgo_suicidio: false,
    riesgo_violencia: false,
    riesgo_fuga: false,
    riesgo_caidas: false
  });

  useEffect(() => {
    fetchTerapeutas();
  }, []);

  const fetchTerapeutas = async () => {
    try {
      const response = await axios.get('/api/terapeutas');
      setTerapeutas(response.data);
    } catch (error) {
      console.error('Error fetching terapeutas:', error);
    }
  };

  // Generate expedition number suggestion based on birth date
  const generateExpeditionNumber = (birthDate) => {
    if (!birthDate) return '';
    const date = new Date(birthDate);
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `EXP${day}${month}${year}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = type === 'checkbox' ? checked : value;

    const newFormData = {
      ...formData,
      [name]: newValue
    };

    // Auto-suggest expedition number when birth date changes
    if (name === 'fecha_nacimiento' && value) {
      newFormData.numero_expediente = generateExpeditionNumber(value);
    }

    // Construct fecha_nacimiento from individual fields
    if (name === 'dia_nacimiento' || name === 'mes_nacimiento' || name === 'year_nacimiento') {
      const day = newFormData.dia_nacimiento || '01';
      const month = newFormData.mes_nacimiento || '01';
      const year = newFormData.year_nacimiento || '1900';
      newFormData.fecha_nacimiento = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (newFormData.fecha_nacimiento) {
        newFormData.numero_expediente = generateExpeditionNumber(newFormData.fecha_nacimiento);
      }
    }


    setFormData(newFormData);
  };

  const validateRequiredFields = () => {
    const requiredFields = [
      'numero_expediente',
      'nombre',
      'apellidos',
      'fecha_nacimiento',
      'sexo',
      'documento_identidad',
      'nacionalidad',
      'tipo_paciente',
      'fecha_ingreso',
      'telefono_principal'
    ];

    for (let field of requiredFields) {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validación básica de campos obligatorios
    if (!validateRequiredFields()) {
      setError('Por favor, completa todos los campos obligatorios marcados con *');
      setLoading(false);
      return;
    }

    // Preparar datos para envío, convirtiendo valores vacíos y nulos apropiadamente
    const dataToSend = {
      numero_expediente: formData.numero_expediente?.trim() || '',
      nombre: formData.nombre?.trim() || '',
      apellidos: formData.apellidos?.trim() || '',
      fecha_nacimiento: formData.fecha_nacimiento || '',
      sexo: formData.sexo || '',
      documento_identidad: formData.documento_identidad?.trim() || '',
      nacionalidad: formData.nacionalidad?.trim() || '',
      contacto_emergencia_nombre: formData.contacto_emergencia_nombre?.trim() || '',
      contacto_emergencia_telefono: formData.contacto_emergencia_telefono?.trim() || '',
      telefono_principal: formData.telefono_principal?.trim() || '',
      telefono_secundario: formData.telefono_secundario?.trim() || '',
      tipo_sangre: formData.tipo_sangre || '',
      peso: formData.peso ? parseFloat(formData.peso) : null,
      estatura: formData.estatura ? parseFloat(formData.estatura) : null,
      padecimientos: formData.padecimientos?.trim() || '',
      informacion_general: formData.informacion_general?.trim() || '',
      tipo_paciente: formData.tipo_paciente || 'ambulatorio',
      cuarto_asignado: formData.cuarto_asignado?.trim() || '',
      fecha_ingreso: formData.fecha_ingreso || new Date().toISOString().slice(0, 16),
      motivo_ingreso: formData.motivo_ingreso || '',
      fase_tratamiento: formData.fase_tratamiento || '',
      unidad_cama: formData.unidad_cama?.trim() || '',
      medico_tratante: formData.medico_tratante?.trim() || '',
      terapeuta_tratante_id: formData.terapeuta_tratante_id ? parseInt(formData.terapeuta_tratante_id) : null,
      equipo_tratante: formData.equipo_tratante?.trim() || '',
      riesgo_suicidio: Boolean(formData.riesgo_suicidio),
      riesgo_violencia: Boolean(formData.riesgo_violencia),
      riesgo_fuga: Boolean(formData.riesgo_fuga),
      riesgo_caidas: Boolean(formData.riesgo_caidas)
    };

    try {
      const response = await axios.post('/api/pacientes', dataToSend);
      setSuccess('Paciente registrado exitosamente');

      // Reset form
      setFormData({
        numero_expediente: '',
        nombre: '',
        apellidos: '',
        fecha_nacimiento: '',
        dia_nacimiento: '',
        mes_nacimiento: '',
        year_nacimiento: '',
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
        fecha_ingreso: new Date().toISOString().slice(0, 16), // Reset to current date and time
        motivo_ingreso: '',
        fase_tratamiento: '',
        unidad_cama: '',
        medico_tratante: '',
        terapeuta_tratante_id: '',
        equipo_tratante: '',
        riesgo_suicidio: false,
        riesgo_violencia: false,
        riesgo_fuga: false,
        riesgo_caidas: false
      });

      // Redirect to patient list after 2 seconds
      setTimeout(() => {
        navigate('/pacientes');
      }, 2000);
    } catch (error) {
      console.error('Error creating patient:', error);
      if (error.response) {
        if (error.response.status === 400) {
          setError('Error de validación: ' + (error.response.data.error || 'Datos inválidos'));
        } else if (error.response.status === 500) {
          setError('Error interno del servidor. Por favor, intenta nuevamente.');
        } else {
          setError('Error al registrar el paciente: ' + (error.response.data.error || 'Error desconocido'));
        }
      } else if (error.request) {
        setError('Error de conexión. Verifica tu conexión a internet.');
      } else {
        setError('Error al registrar el paciente');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nuevo Paciente - Clínica de Tratamiento de Adicciones</h1>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <h5 className="text-primary mb-3">
              Datos Básicos
              <small className="text-muted"> - Los campos marcados con <span style={{color: 'red'}}>*</span> son obligatorios</small>
            </h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Expediente <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_expediente"
                    value={formData.numero_expediente}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.numero_expediente && error ? 'red' : ''}}
                  />
                  <Form.Text className="text-muted">
                    Se sugiere automáticamente al ingresar la fecha de nacimiento
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Paciente <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Select
                    name="tipo_paciente"
                    value={formData.tipo_paciente}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.tipo_paciente && error ? 'red' : ''}}
                  >
                    <option value="ambulatorio">Ambulatorio</option>
                    <option value="interno">Interno</option>
                    <option value="externo">Externo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.nombre && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.apellidos && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Día de Nacimiento <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="dia_nacimiento"
                    value={formData.dia_nacimiento}
                    onChange={handleChange}
                    required
                    min="1"
                    max="31"
                    placeholder="Día"
                    style={{borderColor: !formData.dia_nacimiento && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Mes de Nacimiento <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="mes_nacimiento"
                    value={formData.mes_nacimiento}
                    onChange={handleChange}
                    required
                    min="1"
                    max="12"
                    placeholder="Mes"
                    style={{borderColor: !formData.mes_nacimiento && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Año de Nacimiento <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="year_nacimiento"
                    value={formData.year_nacimiento}
                    onChange={handleChange}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                    placeholder="Año"
                    style={{borderColor: !formData.year_nacimiento && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sexo al Nacer <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Select
                    name="sexo"
                    value={formData.sexo}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.sexo && error ? 'red' : ''}}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Documento de Identidad <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="documento_identidad"
                    value={formData.documento_identidad}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.documento_identidad && error ? 'red' : ''}}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nacionalidad <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nacionalidad"
                    value={formData.nacionalidad}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.nacionalidad && error ? 'red' : ''}}
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
                    min="0"
                    max="500"
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
                    min="0"
                    max="3"
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
                  <Form.Label>Teléfono Principal <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono_principal"
                    value={formData.telefono_principal}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.telefono_principal && error ? 'red' : ''}}
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
                  <Form.Label>Fecha/Hora de Ingreso <span style={{color: 'red'}}>*</span></Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="fecha_ingreso"
                    value={formData.fecha_ingreso}
                    onChange={handleChange}
                    required
                    style={{borderColor: !formData.fecha_ingreso && error ? 'red' : ''}}
                  />
                  <Form.Text className="text-muted">
                    Por defecto se establece la fecha y hora actual
                  </Form.Text>
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
                    <option value="consulta_externa">Consulta Externa</option>
                    <option value="crisis_psiquiatrica">Crisis Psiquiátrica</option>
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
                    <option value="fase_1">Fase 1</option>
                    <option value="fase_2">Fase 2</option>
                    <option value="seguimiento">Seguimiento</option>
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
                  <Form.Label>Terapeuta Tratante</Form.Label>
                  <Form.Select
                    name="terapeuta_tratante_id"
                    value={formData.terapeuta_tratante_id}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar terapeuta...</option>
                    {terapeutas.map(terapeuta => (
                      <option key={terapeuta.id} value={terapeuta.id}>
                        {terapeuta.nombre} {terapeuta.apellidos}
                        {terapeuta.especialidad && ` - ${terapeuta.especialidad}`}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Si no encuentra el terapeuta, contacte al administrador para agregarlo
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={12}>
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
                  onChange={handleChange}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Violencia"
                  name="riesgo_violencia"
                  checked={formData.riesgo_violencia}
                  onChange={handleChange}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Fuga"
                  name="riesgo_fuga"
                  checked={formData.riesgo_fuga}
                  onChange={handleChange}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Riesgo de Caídas"
                  name="riesgo_caidas"
                  checked={formData.riesgo_caidas}
                  onChange={handleChange}
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