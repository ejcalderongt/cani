import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Badge, Nav, Tab, Button, Form, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';

function VerPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  // Photo states
  const [photos, setPhotos] = useState({ pertenencias: [], medicamentos: [] });
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState('');
  const [newPhoto, setNewPhoto] = useState({ file: null, descripcion: '' });

  // Calendar states
  const [citas, setCitas] = useState([]);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [citaForm, setCitaForm] = useState({
    doctor: '',
    hora: '',
    motivo: '',
    anotaciones: ''
  });
  const [editingCita, setEditingCita] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Doping tests states
  const [dopingTests, setDopingTests] = useState([]);
  const [showDopingModal, setShowDopingModal] = useState(false);
  const [dopingForm, setDopingForm] = useState({
    fecha: '',
    tipo: 'orina',
    resultado: 'negativo',
    observaciones: ''
  });

  useEffect(() => {
    fetchPaciente();
    fetchPhotos();
    fetchCitas();
    fetchDopingTests();
  }, [id]);

  const fetchPaciente = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}`);
      setPaciente(response.data);
    } catch (error) {
      setError('Error al cargar paciente');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}/photos`);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const fetchCitas = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}/citas`);
      setCitas(response.data);
    } catch (error) {
      console.error('Error fetching citas:', error);
    }
  };

  const fetchDopingTests = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}/doping-tests`);
      setDopingTests(response.data);
    } catch (error) {
      console.error('Error fetching doping tests:', error);
    }
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!newPhoto.file) return;

    const formData = new FormData();
    formData.append('photo', newPhoto.file);
    formData.append('tipo', photoType);
    formData.append('descripcion', newPhoto.descripcion);

    try {
      await axios.post(`/api/pacientes/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchPhotos();
      setShowPhotoModal(false);
      setNewPhoto({ file: null, descripcion: '' });
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleCitaSubmit = async (e) => {
    e.preventDefault();
    try {
      const citaData = {
        ...citaForm,
        fecha: selectedDate,
        paciente_id: id
      };

      if (editingCita) {
        await axios.put(`/api/citas/${editingCita.id}`, citaData);
      } else {
        await axios.post('/api/citas', citaData);
      }

      fetchCitas();
      setShowCitaModal(false);
      setCitaForm({ doctor: '', hora: '', motivo: '', anotaciones: '' });
      setEditingCita(null);
    } catch (error) {
      console.error('Error saving cita:', error);
    }
  };

  const handleDopingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/pacientes/${id}/doping-tests`, dopingForm);
      fetchDopingTests();
      setShowDopingModal(false);
      setDopingForm({ fecha: '', tipo: 'orina', resultado: 'negativo', observaciones: '' });
    } catch (error) {
      console.error('Error saving doping test:', error);
    }
  };

  const openPhotoModal = (type) => {
    setPhotoType(type);
    setShowPhotoModal(true);
  };

  const openCitaModal = (date, cita = null) => {
    setSelectedDate(date);
    setEditingCita(cita);
    if (cita) {
      setCitaForm({
        doctor: cita.doctor || '',
        hora: cita.hora || '',
        motivo: cita.motivo || '',
        anotaciones: cita.anotaciones || ''
      });
    }
    setShowCitaModal(true);
  };

  // Calendar functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getCitasForDate = (date) => {
    const dateStr = formatDate(date);
    return citas.filter(cita => cita.fecha === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateStr = formatDate(date);
      const citasForDay = getCitasForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? 'today' : ''}`}
          onClick={() => openCitaModal(dateStr)}
        >
          <div className="day-number">{day}</div>
          {citasForDay.map((cita, idx) => (
            <div
              key={idx}
              className="cita-item"
              onDoubleClick={(e) => {
                e.stopPropagation();
                openCitaModal(dateStr, cita);
              }}
            >
              {cita.hora} - {cita.doctor}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !paciente) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || 'Paciente no encontrado'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/pacientes')}>
          Volver a Pacientes
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Paciente: {paciente.nombre} {paciente.apellidos}</h1>
        <Button variant="secondary" onClick={() => navigate('/pacientes')}>
          Volver a Pacientes
        </Button>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="general">Información General</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pertenencias">Pertenencias</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="medicamentos">Medicamentos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="citas">Citas de Seguimiento</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="doping">Pruebas de Doping</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="general">
            <Card className="medical-card">
              <Card.Header>
                <h5>Información General</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Número de Expediente:</strong> {paciente.numero_expediente}</p>
                    <p><strong>Fecha de Nacimiento:</strong> {new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES')}</p>
                    <p><strong>Documento de Identidad:</strong> {paciente.documento_identidad}</p>
                    <p><strong>Nacionalidad:</strong> {paciente.nacionalidad}</p>
                    <p><strong>Tipo de Sangre:</strong> <Badge bg="info">{paciente.tipo_sangre}</Badge></p>
                    {paciente.peso && <p><strong>Peso:</strong> {paciente.peso} kg</p>}
                    {paciente.estatura && <p><strong>Estatura:</strong> {paciente.estatura} m</p>}
                  </Col>
                  <Col md={6}>
                    <p><strong>Teléfono Principal:</strong> {paciente.telefono_principal}</p>
                    {paciente.telefono_secundario && (
                      <p><strong>Teléfono Secundario:</strong> {paciente.telefono_secundario}</p>
                    )}
                    <p><strong>Tipo de Paciente:</strong> <Badge bg="primary">{paciente.tipo_paciente}</Badge></p>
                    {paciente.cuarto_asignado && (
                      <p><strong>Cuarto Asignado:</strong> {paciente.cuarto_asignado}</p>
                    )}
                  </Col>
                </Row>

                {/* Addiction Treatment Information */}
                <hr />
                <h6 className="text-primary mb-3">Información del Tratamiento</h6>
                <Row>
                  <Col md={6}>
                    {paciente.fecha_ingreso && (
                      <p><strong>Fecha/Hora Ingreso:</strong> {new Date(paciente.fecha_ingreso).toLocaleString('es-ES')}</p>
                    )}
                    {paciente.motivo_ingreso && (
                      <p><strong>Motivo:</strong> <Badge bg="info">{paciente.motivo_ingreso}</Badge></p>
                    )}
                    {paciente.fase_tratamiento && (
                      <p><strong>Fase:</strong> <Badge bg="warning">{paciente.fase_tratamiento}</Badge></p>
                    )}
                  </Col>
                  <Col md={6}>
                    {paciente.unidad_cama && <p><strong>Unidad/Cama:</strong> {paciente.unidad_cama}</p>}
                    {paciente.medico_tratante && <p><strong>Médico Tratante:</strong> {paciente.medico_tratante}</p>}
                    {paciente.equipo_tratante && <p><strong>Equipo Tratante:</strong> {paciente.equipo_tratante}</p>}
                  </Col>
                </Row>

                {paciente.contacto_emergencia_nombre && (
                  <div className="mt-3">
                    <strong>Contacto de Emergencia:</strong>
                    <p>{paciente.contacto_emergencia_nombre} - {paciente.contacto_emergencia_telefono}</p>
                  </div>
                )}

                {/* Risks Assessment */}
                {(paciente.riesgo_suicidio || paciente.riesgo_violencia || paciente.riesgo_fuga || paciente.riesgo_caidas) && (
                  <>
                    <hr />
                    <h6 className="text-warning mb-3">Riesgos al Ingreso</h6>
                    <Row>
                      <Col md={12}>
                        {paciente.riesgo_suicidio && (
                          <Badge bg="danger" className="me-2 mb-2">Riesgo de Suicidio/Autoagresión</Badge>
                        )}
                        {paciente.riesgo_violencia && (
                          <Badge bg="danger" className="me-2 mb-2">Riesgo de Violencia</Badge>
                        )}
                        {paciente.riesgo_fuga && (
                          <Badge bg="warning" className="me-2 mb-2">Riesgo de Fuga</Badge>
                        )}
                        {paciente.riesgo_caidas && (
                          <Badge bg="warning" className="me-2 mb-2">Riesgo de Caídas</Badge>
                        )}
                      </Col>
                    </Row>
                  </>
                )}

                {paciente.padecimientos && (
                  <div className="mt-3">
                    <strong>Padecimientos:</strong>
                    <p>{paciente.padecimientos}</p>
                  </div>
                )}

                {paciente.informacion_general && (
                  <div className="mt-3">
                    <strong>Información General:</strong>
                    <p>{paciente.informacion_general}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="pertenencias">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Pertenencias Personales</h5>
                <Button size="sm" onClick={() => openPhotoModal('pertenencias')}>
                  Agregar Foto
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  {photos.pertenencias?.map((photo, idx) => (
                    <Col md={4} key={idx} className="mb-3">
                      <div className="photo-item">
                        <img src={photo.url} alt={photo.descripcion} />
                        <div className="photo-description">
                          <small>{photo.descripcion}</small>
                          <br />
                          <small className="text-muted">
                            {new Date(photo.fecha_registro).toLocaleDateString('es-ES')}
                          </small>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
                {(!photos.pertenencias || photos.pertenencias.length === 0) && (
                  <p className="text-muted">No hay fotos de pertenencias registradas.</p>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="medicamentos">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Medicamentos Recibidos</h5>
                <Button size="sm" onClick={() => openPhotoModal('medicamentos')}>
                  Agregar Foto
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  {photos.medicamentos?.map((photo, idx) => (
                    <Col md={4} key={idx} className="mb-3">
                      <div className="photo-item">
                        <img src={photo.url} alt={photo.descripcion} />
                        <div className="photo-description">
                          <small>{photo.descripcion}</small>
                          <br />
                          <small className="text-muted">
                            {new Date(photo.fecha_registro).toLocaleDateString('es-ES')}
                          </small>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
                {(!photos.medicamentos || photos.medicamentos.length === 0) && (
                  <p className="text-muted">No hay fotos de medicamentos registradas.</p>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="citas">
            <Card className="medical-card">
              <Card.Header>
                <h5>Calendario de Citas de Seguimiento</h5>
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    &lt;
                  </Button>
                  <h6>{currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h6>
                  <Button 
                    size="sm" 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    &gt;
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="calendar-container">
                  <div className="calendar-header">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {renderCalendar()}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="doping">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5>Pruebas de Doping</h5>
                <Button size="sm" onClick={() => setShowDopingModal(true)}>
                  Nueva Prueba
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Resultado</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dopingTests.map((test, idx) => (
                        <tr key={idx}>
                          <td>{new Date(test.fecha).toLocaleDateString('es-ES')}</td>
                          <td>
                            <Badge bg={test.tipo === 'sangre' ? 'danger' : 'info'}>
                              {test.tipo}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={test.resultado === 'positivo' ? 'danger' : 'success'}>
                              {test.resultado}
                            </Badge>
                          </td>
                          <td>{test.observaciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {dopingTests.length === 0 && (
                  <p className="text-muted">No hay pruebas de doping registradas.</p>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>

      {/* Photo Modal */}
      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Foto - {photoType === 'pertenencias' ? 'Pertenencias' : 'Medicamentos'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePhotoSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Seleccionar Foto</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => setNewPhoto({...newPhoto, file: e.target.files[0]})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                value={newPhoto.descripcion}
                onChange={(e) => setNewPhoto({...newPhoto, descripcion: e.target.value})}
                rows={3}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Foto
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Cita Modal */}
      <Modal show={showCitaModal} onHide={() => setShowCitaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCita ? 'Editar Cita' : 'Nueva Cita'} - {selectedDate}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCitaSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Doctor</Form.Label>
              <Form.Control
                type="text"
                value={citaForm.doctor}
                onChange={(e) => setCitaForm({...citaForm, doctor: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Hora</Form.Label>
              <Form.Control
                type="time"
                value={citaForm.hora}
                onChange={(e) => setCitaForm({...citaForm, hora: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Motivo</Form.Label>
              <Form.Control
                type="text"
                value={citaForm.motivo}
                onChange={(e) => setCitaForm({...citaForm, motivo: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Anotaciones del Doctor</Form.Label>
              <Form.Control
                as="textarea"
                value={citaForm.anotaciones}
                onChange={(e) => setCitaForm({...citaForm, anotaciones: e.target.value})}
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCitaModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingCita ? 'Actualizar' : 'Guardar'} Cita
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Doping Test Modal */}
      <Modal show={showDopingModal} onHide={() => setShowDopingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva Prueba de Doping</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDopingSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Fecha</Form.Label>
              <Form.Control
                type="date"
                value={dopingForm.fecha}
                onChange={(e) => setDopingForm({...dopingForm, fecha: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Muestra</Form.Label>
              <Form.Select
                value={dopingForm.tipo}
                onChange={(e) => setDopingForm({...dopingForm, tipo: e.target.value})}
                required
              >
                <option value="orina">Orina</option>
                <option value="sangre">Sangre</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Resultado</Form.Label>
              <Form.Select
                value={dopingForm.resultado}
                onChange={(e) => setDopingForm({...dopingForm, resultado: e.target.value})}
                required
              >
                <option value="negativo">Negativo</option>
                <option value="positivo">Positivo</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                value={dopingForm.observaciones}
                onChange={(e) => setDopingForm({...dopingForm, observaciones: e.target.value})}
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDopingModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Prueba
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default VerPaciente;