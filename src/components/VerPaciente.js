
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button, Nav, Tab, Form, Modal, Alert } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function VerPaciente() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // Photo states
  const [fotosPertenencias, setFotosPertenencias] = useState([]);
  const [fotosMedicamentos, setFotosMedicamentos] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoType, setPhotoType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [photoDescription, setPhotoDescription] = useState('');
  
  // Appointments states
  const [citas, setCitas] = useState([]);
  const [showCitaModal, setShowCitaModal] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [citaForm, setCitaForm] = useState({
    nombre_doctor: '',
    fecha_cita: '',
    hora_cita: '',
    anotaciones: ''
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Doping tests states
  const [pruebasDoping, setPruebasDoping] = useState([]);
  const [showDopingModal, setShowDopingModal] = useState(false);
  const [dopingForm, setDopingForm] = useState({
    fecha_prueba: '',
    hora_prueba: '',
    tipo_muestra: '',
    resultado: '',
    sustancias_detectadas: '',
    observaciones: ''
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const response = await axios.get(`/api/pacientes/${id}`);
        setData(response.data);
        
        // Fetch additional data
        fetchFotos();
        fetchCitas();
        fetchPruebasDoping();
      } catch (error) {
        console.error('Error al cargar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaciente();
  }, [id]);

  const fetchFotos = async () => {
    try {
      const [pertenenciasRes, medicamentosRes] = await Promise.all([
        axios.get(`/api/pacientes/${id}/fotos-pertenencias`),
        axios.get(`/api/pacientes/${id}/fotos-medicamentos`)
      ]);
      setFotosPertenencias(pertenenciasRes.data);
      setFotosMedicamentos(medicamentosRes.data);
    } catch (error) {
      console.error('Error al cargar fotos:', error);
    }
  };

  const fetchCitas = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}/citas`);
      setCitas(response.data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    }
  };

  const fetchPruebasDoping = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${id}/pruebas-doping`);
      setPruebasDoping(response.data);
    } catch (error) {
      console.error('Error al cargar pruebas de doping:', error);
    }
  };

  const savePruebaDoping = async () => {
    try {
      await axios.post(`/api/pruebas-doping`, {
        ...dopingForm,
        paciente_id: id
      });
      
      setShowDopingModal(false);
      setDopingForm({
        fecha_prueba: '',
        hora_prueba: '',
        tipo_muestra: '',
        resultado: '',
        sustancias_detectadas: '',
        observaciones: ''
      });
      fetchPruebasDoping();
    } catch (error) {
      console.error('Error al guardar prueba de doping:', error);
      setError('Error al guardar la prueba de doping');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFile(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = async () => {
    if (!selectedFile) return;
    
    try {
      const endpoint = photoType === 'pertenencias' ? 'fotos-pertenencias' : 'fotos-medicamentos';
      await axios.post(`/api/pacientes/${id}/${endpoint}`, {
        nombre_archivo: `foto_${Date.now()}.jpg`,
        descripcion: photoDescription,
        datos_imagen: selectedFile
      });
      
      setShowPhotoModal(false);
      setSelectedFile(null);
      setPhotoDescription('');
      fetchFotos();
    } catch (error) {
      console.error('Error al guardar foto:', error);
      setError('Error al guardar la foto');
    }
  };

  const openPhotoModal = (type) => {
    setPhotoType(type);
    setShowPhotoModal(true);
  };

  const openCitaModal = (cita = null) => {
    if (cita) {
      setEditingCita(cita);
      setCitaForm({
        nombre_doctor: cita.nombre_doctor,
        fecha_cita: cita.fecha_cita,
        hora_cita: cita.hora_cita,
        anotaciones: cita.anotaciones || ''
      });
    } else {
      setEditingCita(null);
      setCitaForm({
        nombre_doctor: '',
        fecha_cita: '',
        hora_cita: '',
        anotaciones: ''
      });
    }
    setShowCitaModal(true);
  };

  const saveCita = async () => {
    try {
      if (editingCita) {
        await axios.put(`/api/citas/${editingCita.id}`, {
          ...citaForm,
          estado: 'programada'
        });
      } else {
        await axios.post(`/api/pacientes/${id}/citas`, citaForm);
      }
      
      setShowCitaModal(false);
      fetchCitas();
    } catch (error) {
      console.error('Error al guardar cita:', error);
      setError('Error al guardar la cita');
    }
  };

  const deleteCita = async (citaId) => {
    if (window.confirm('¿Está seguro de eliminar esta cita?')) {
      try {
        await axios.delete(`/api/citas/${citaId}`);
        fetchCitas();
      } catch (error) {
        console.error('Error al eliminar cita:', error);
        setError('Error al eliminar la cita');
      }
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCitasForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return citas.filter(cita => cita.fecha_cita === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const citasDelDia = getCitasForDate(day);
      days.push(
        <div key={day} className="calendar-day" onClick={() => openCitaModal()}>
          <div className="day-number">{day}</div>
          {citasDelDia.map((cita, index) => (
            <div 
              key={index} 
              className="cita-item"
              onDoubleClick={(e) => {
                e.stopPropagation();
                openCitaModal(cita);
              }}
            >
              <small>{cita.hora_cita} - Dr. {cita.nombre_doctor}</small>
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
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">Paciente no encontrado</div>
      </Container>
    );
  }

  const { paciente, notas, medicamentos } = data;

  return (
    <Container className="mt-4" style={{ padding: '0 15px' }}>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h1 className="mb-2 mb-md-0">Paciente: {paciente.nombre} {paciente.apellidos}</h1>
        <Button as={Link} to="/pacientes" variant="secondary" size="sm">
          Volver a Pacientes
        </Button>
      </div>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Nav variant="tabs" className="mb-4 flex-wrap">
          <Nav.Item>
            <Nav.Link eventKey="info">📋 Información</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="pertenencias">🎒 Pertenencias</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="medicamentos-fotos">💊 Medicamentos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="doping">🧪 Pruebas Doping</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="citas">📅 Citas</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="info">
            <Row>
              <Col lg={8} className="mb-4">
                <Card className="medical-card">
                  <Card.Header>
                    <h5>Datos Generales</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <p><strong>Expediente:</strong> {paciente.numero_expediente}</p>
                        <p><strong>Nombre:</strong> {paciente.nombre} {paciente.apellidos}</p>
                        <p><strong>Fecha de Nacimiento:</strong> {paciente.fecha_nacimiento}</p>
                        <p><strong>Sexo:</strong> {paciente.sexo || 'No especificado'}</p>
                        <p><strong>Documento:</strong> {paciente.documento_identidad}</p>
                        <p><strong>Nacionalidad:</strong> {paciente.nacionalidad}</p>
                      </Col>
                      <Col md={6}>
                        <p><strong>Tipo:</strong> <Badge bg={paciente.tipo_paciente === 'interno' ? 'danger' : 'success'}>{paciente.tipo_paciente}</Badge></p>
                        <p><strong>Tipo de Sangre:</strong> {paciente.tipo_sangre}</p>
                        {paciente.peso && <p><strong>Peso:</strong> {paciente.peso} kg</p>}
                        {paciente.estatura && <p><strong>Estatura:</strong> {paciente.estatura} m</p>}
                        <p><strong>Teléfono Principal:</strong> {paciente.telefono_principal}</p>
                        {paciente.cuarto_asignado && <p><strong>Cuarto:</strong> {paciente.cuarto_asignado}</p>}
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

                    {/* Risk Factors */}
                    {(paciente.riesgo_suicidio || paciente.riesgo_violencia || paciente.riesgo_fuga || paciente.riesgo_caidas) && (
                      <>
                        <hr />
                        <h6 className="text-warning mb-3">⚠️ Riesgos Identificados</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {paciente.riesgo_suicidio && <Badge bg="danger">Suicidio/Autoagresión</Badge>}
                          {paciente.riesgo_violencia && <Badge bg="danger">Violencia</Badge>}
                          {paciente.riesgo_fuga && <Badge bg="warning">Fuga</Badge>}
                          {paciente.riesgo_caidas && <Badge bg="secondary">Caídas</Badge>}
                        </div>
                      </>
                    )}
                    </Row>
                    {paciente.contacto_emergencia_nombre && (
                      <div className="mt-3">
                        <strong>Contacto de Emergencia:</strong>
                        <p>{paciente.contacto_emergencia_nombre} ({paciente.contacto_emergencia_telefono})</p>
                      </div>
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

                <Card className="medical-card mt-4">
                  <Card.Header>
                    <h5>Medicamentos Asignados</h5>
                  </Card.Header>
                  <Card.Body>
                    {medicamentos.length === 0 ? (
                      <p className="text-muted">No hay medicamentos asignados</p>
                    ) : (
                      medicamentos.map((medicamento, index) => (
                        <div key={index} className="border-bottom mb-2 pb-2">
                          <strong>{medicamento.medicamento_nombre}</strong> - {medicamento.dosis}<br />
                          <small className="text-muted">{medicamento.frecuencia} | Horarios: {medicamento.horarios}</small>
                        </div>
                      ))
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="medical-card">
                  <Card.Header>
                    <h5>Notas de Enfermería Recientes</h5>
                  </Card.Header>
                  <Card.Body>
                    {notas.length === 0 ? (
                      <p className="text-muted">No hay notas registradas</p>
                    ) : (
                      notas.slice(0, 5).map((nota, index) => (
                        <div key={index} className="border-bottom mb-2 pb-2">
                          <div className="d-flex justify-content-between flex-wrap">
                            <strong>{nota.fecha} - {nota.hora}</strong>
                            <small className="text-muted">{nota.enfermero_nombre} {nota.enfermero_apellidos}</small>
                          </div>
                          <p className="mt-1">{nota.observaciones}</p>
                        </div>
                      ))
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Tab.Pane>

          <Tab.Pane eventKey="pertenencias">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-2 mb-md-0">Fotos de Pertenencias Personales</h5>
                <Button variant="primary" size="sm" onClick={() => openPhotoModal('pertenencias')}>
                  📷 Agregar Foto
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  {fotosPertenencias.map((foto, index) => (
                    <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-3">
                      <Card className="h-100">
                        <Card.Img 
                          variant="top" 
                          src={foto.datos_imagen} 
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <Card.Body>
                          <Card.Text className="small">{foto.descripcion}</Card.Text>
                          <small className="text-muted">{new Date(foto.fecha_registro).toLocaleDateString()}</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {fotosPertenencias.length === 0 && (
                  <p className="text-muted text-center">No hay fotos de pertenencias registradas</p>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="medicamentos-fotos">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-2 mb-md-0">Fotos de Medicamentos Recibidos</h5>
                <Button variant="primary" size="sm" onClick={() => openPhotoModal('medicamentos')}>
                  📷 Agregar Foto
                </Button>
              </Card.Header>
              <Card.Body>
                <Row>
                  {fotosMedicamentos.map((foto, index) => (
                    <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-3">
                      <Card className="h-100">
                        <Card.Img 
                          variant="top" 
                          src={foto.datos_imagen} 
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <Card.Body>
                          <Card.Text className="small">{foto.descripcion}</Card.Text>
                          <small className="text-muted">{new Date(foto.fecha_registro).toLocaleDateString()}</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {fotosMedicamentos.length === 0 && (
                  <p className="text-muted text-center">No hay fotos de medicamentos registradas</p>
                )}
              </Card.Body>
            </Card>
          </Tab.Pane>

          <Tab.Pane eventKey="doping">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-2 mb-md-0">Registro y Control de Pruebas de Doping</h5>
                <Button variant="primary" size="sm" onClick={() => setShowDopingModal(true)}>
                  ➕ Nueva Prueba
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped hover size="sm">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Tipo Muestra</th>
                        <th>Resultado</th>
                        <th>Sustancias</th>
                        <th>Enfermero</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pruebasDoping.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted">
                            No hay pruebas de doping registradas
                          </td>
                        </tr>
                      ) : (
                        pruebasDoping.map((prueba) => (
                          <tr key={prueba.id}>
                            <td>{prueba.fecha_prueba}</td>
                            <td>{prueba.hora_prueba}</td>
                            <td>
                              <Badge bg={prueba.tipo_muestra === 'sangre' ? 'danger' : 'warning'}>
                                {prueba.tipo_muestra}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={prueba.resultado === 'positivo' ? 'danger' : 'success'}>
                                {prueba.resultado}
                              </Badge>
                            </td>
                            <td>{prueba.sustancias_detectadas || '-'}</td>
                            <td>
                              <small>
                                {prueba.enfermero_nombre} {prueba.enfermero_apellidos}
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
          </Tab.Pane>

          <Tab.Pane eventKey="citas">
            <Card className="medical-card">
              <Card.Header className="d-flex justify-content-between align-items-center flex-wrap">
                <h5 className="mb-2 mb-md-0">Control de Citas de Seguimiento</h5>
                <Button variant="primary" size="sm" onClick={() => openCitaModal()}>
                  ➕ Nueva Cita
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="calendar-header d-flex justify-content-between align-items-center mb-3 flex-wrap">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  >
                    ‹ Anterior
                  </Button>
                  <h6 className="mb-0">
                    {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                  </h6>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  >
                    Siguiente ›
                  </Button>
                </div>
                
                <div className="calendar-grid">
                  <div className="calendar-weekdays">
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
        </Tab.Content>
      </Tab.Container>

      {/* Photo Modal */}
      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Agregar Foto de {photoType === 'pertenencias' ? 'Pertenencias' : 'Medicamentos'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Seleccionar Foto</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                capture="environment"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                placeholder="Describe lo que se muestra en la foto..."
              />
            </Form.Group>
            {selectedFile && (
              <div className="text-center">
                <img 
                  src={selectedFile} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={savePhoto} disabled={!selectedFile}>
            Guardar Foto
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Appointment Modal */}
      <Modal show={showCitaModal} onHide={() => setShowCitaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCita ? 'Editar Cita' : 'Nueva Cita de Seguimiento'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Doctor</Form.Label>
              <Form.Control
                type="text"
                value={citaForm.nombre_doctor}
                onChange={(e) => setCitaForm({...citaForm, nombre_doctor: e.target.value})}
                placeholder="Dr. Juan Pérez"
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de la Cita</Form.Label>
                  <Form.Control
                    type="date"
                    value={citaForm.fecha_cita}
                    onChange={(e) => setCitaForm({...citaForm, fecha_cita: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de la Cita</Form.Label>
                  <Form.Control
                    type="time"
                    value={citaForm.hora_cita}
                    onChange={(e) => setCitaForm({...citaForm, hora_cita: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Anotaciones del Doctor</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={citaForm.anotaciones}
                onChange={(e) => setCitaForm({...citaForm, anotaciones: e.target.value})}
                placeholder="Observaciones, indicaciones o notas sobre la cita..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            {editingCita && (
              <Button 
                variant="danger" 
                onClick={() => {
                  deleteCita(editingCita.id);
                  setShowCitaModal(false);
                }}
              >
                🗑️ Eliminar
              </Button>
            )}
          </div>
          <div>
            <Button variant="secondary" onClick={() => setShowCitaModal(false)} className="me-2">
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={saveCita}
              disabled={!citaForm.nombre_doctor || !citaForm.fecha_cita || !citaForm.hora_cita}
            >
              {editingCita ? 'Actualizar' : 'Guardar'} Cita
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Doping Test Modal */}
      <Modal show={showDopingModal} onHide={() => setShowDopingModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nueva Prueba de Doping</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha de la Prueba</Form.Label>
                  <Form.Control
                    type="date"
                    value={dopingForm.fecha_prueba}
                    onChange={(e) => setDopingForm({...dopingForm, fecha_prueba: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora de la Prueba</Form.Label>
                  <Form.Control
                    type="time"
                    value={dopingForm.hora_prueba}
                    onChange={(e) => setDopingForm({...dopingForm, hora_prueba: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Muestra</Form.Label>
                  <Form.Select
                    value={dopingForm.tipo_muestra}
                    onChange={(e) => setDopingForm({...dopingForm, tipo_muestra: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="sangre">Sangre</option>
                    <option value="orina">Orina</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Resultado</Form.Label>
                  <Form.Select
                    value={dopingForm.resultado}
                    onChange={(e) => setDopingForm({...dopingForm, resultado: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="positivo">Positivo</option>
                    <option value="negativo">Negativo</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Sustancias Detectadas</Form.Label>
              <Form.Control
                type="text"
                value={dopingForm.sustancias_detectadas}
                onChange={(e) => setDopingForm({...dopingForm, sustancias_detectadas: e.target.value})}
                placeholder="Cocaína, Marihuana, Alcohol, etc."
              />
              <small className="text-muted">Solo llenar si el resultado es positivo</small>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={dopingForm.observaciones}
                onChange={(e) => setDopingForm({...dopingForm, observaciones: e.target.value})}
                placeholder="Observaciones sobre la prueba..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDopingModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={savePruebaDoping}
            disabled={!dopingForm.fecha_prueba || !dopingForm.hora_prueba || !dopingForm.tipo_muestra || !dopingForm.resultado}
          >
            Guardar Prueba
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default VerPaciente;
