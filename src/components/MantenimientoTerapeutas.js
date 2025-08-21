
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Row, Col, Alert, Modal } from 'react-bootstrap';
import axios from 'axios';

function MantenimientoTerapeutas() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [terapeutas, setTerapeutas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTerapeuta, setEditingTerapeuta] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    fecha_nacimiento: '',
    numero_colegiado: '',
    especialidad: '',
    telefono: '',
    email: '',
    activo: true
  });

  useEffect(() => {
    fetchTerapeutas();
  }, []);

  const fetchTerapeutas = async () => {
    try {
      setLoadingData(true);
      const response = await axios.get('/api/admin/terapeutas');
      setTerapeutas(response.data);
    } catch (error) {
      console.error('Error fetching terapeutas:', error);
      setError('Error al cargar la lista de terapeutas');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingTerapeuta) {
        const response = await axios.put(`/api/admin/terapeutas/${editingTerapeuta.id}`, formData);
        setSuccess('Terapeuta actualizado correctamente');
      } else {
        const response = await axios.post('/api/admin/terapeutas', formData);
        setSuccess('Terapeuta creado correctamente');
      }
      
      fetchTerapeutas();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving terapeuta:', error);
      if (error.response?.status === 401) {
        setError('No tiene autorización para realizar esta acción');
      } else if (error.response?.status === 403) {
        setError('Solo los administradores pueden gestionar terapeutas');
      } else {
        setError(error.response?.data?.error || 'Error al guardar el terapeuta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (terapeuta) => {
    setEditingTerapeuta(terapeuta);
    setFormData({
      nombre: terapeuta.nombre,
      apellidos: terapeuta.apellidos,
      fecha_nacimiento: terapeuta.fecha_nacimiento || '',
      numero_colegiado: terapeuta.numero_colegiado || '',
      especialidad: terapeuta.especialidad || '',
      telefono: terapeuta.telefono || '',
      email: terapeuta.email || '',
      activo: terapeuta.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de desactivar este terapeuta?')) {
      try {
        await axios.delete(`/api/admin/terapeutas/${id}`);
        setSuccess('Terapeuta desactivado correctamente');
        fetchTerapeutas();
      } catch (error) {
        console.error('Error deactivating terapeuta:', error);
        setError('Error al desactivar el terapeuta');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTerapeuta(null);
    setFormData({
      nombre: '',
      apellidos: '',
      fecha_nacimiento: '',
      numero_colegiado: '',
      especialidad: '',
      telefono: '',
      email: '',
      activo: true
    });
  };

  const handleNewTerapeuta = () => {
    setEditingTerapeuta(null);
    setFormData({
      nombre: '',
      apellidos: '',
      fecha_nacimiento: '',
      numero_colegiado: '',
      especialidad: '',
      telefono: '',
      email: '',
      activo: true
    });
    setShowModal(true);
  };

  if (loadingData) {
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
        <h1>Mantenimiento de Terapeutas</h1>
        <Button variant="primary" onClick={handleNewTerapeuta}>
          Agregar Terapeuta
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <h5 className="mb-0">Lista de Terapeutas</h5>
        </Card.Header>
        <Card.Body>
          {terapeutas.length === 0 ? (
            <p className="text-muted">No hay terapeutas registrados.</p>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellidos</th>
                  <th>N° Colegiado</th>
                  <th>Especialidad</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {terapeutas.map(terapeuta => (
                  <tr key={terapeuta.id}>
                    <td>{terapeuta.nombre}</td>
                    <td>{terapeuta.apellidos}</td>
                    <td>{terapeuta.numero_colegiado || '-'}</td>
                    <td>{terapeuta.especialidad || '-'}</td>
                    <td>{terapeuta.telefono || '-'}</td>
                    <td>{terapeuta.email || '-'}</td>
                    <td>
                      <span className={`badge ${terapeuta.activo ? 'bg-success' : 'bg-danger'}`}>
                        {terapeuta.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => handleEdit(terapeuta)}
                        >
                          Editar
                        </Button>
                        {terapeuta.activo && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(terapeuta.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal para crear/editar terapeuta */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTerapeuta ? 'Editar Terapeuta' : 'Agregar Terapeuta'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos *</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Colegiado</Form.Label>
                  <Form.Control
                    type="text"
                    name="numero_colegiado"
                    value={formData.numero_colegiado}
                    onChange={handleInputChange}
                    placeholder="Ej: 12345"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Especialidad</Form.Label>
                  <Form.Control
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    placeholder="Ej: Psicología Clínica, Terapia Familiar"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej: 8888-1234"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="terapeuta@hospital.com"
              />
            </Form.Group>

            {editingTerapeuta && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Activo"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleInputChange}
                />
              </Form.Group>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (editingTerapeuta ? 'Actualizar' : 'Crear')}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default MantenimientoTerapeutas;
