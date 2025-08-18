import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Form, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';

function MantenimientoUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    clave: '',
    nombre: '',
    apellidos: '',
    turno: 'mañana',
    activo: true,
    debe_cambiar_clave: false,
    rol: '', // Added rol
    can_manage_billing: false // Added billing permission
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get('/api/admin/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      setError('Error al cargar usuarios');
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  // Renamed handleInputChange to handleChange to match the usage
  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        await axios.put(`/api/admin/usuarios/${editingUser.id}`, formData, {
          withCredentials: true
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        await axios.post('/api/admin/usuarios', formData, {
          withCredentials: true
        });
        setSuccess('Usuario creado correctamente');
      }

      setShowModal(false);
      setEditingUser(null);
      clearForm(); // Use clearForm to reset
      fetchUsuarios();
    } catch (error) {
      setError(error.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleEdit = (user) => {
    setFormData({
      codigo: user.codigo,
      clave: '', // Don't pre-fill password for security
      nombre: user.nombre,
      apellidos: user.apellidos,
      turno: user.turno,
      activo: user.activo,
      debe_cambiar_clave: user.debe_cambiar_clave || false,
      rol: user.rol, // Added rol
      can_manage_billing: user.can_manage_billing || false // Added billing permission
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleDeactivate = async (id, codigo) => {
    if (codigo === 'admin') {
      setError('No se puede desactivar el usuario administrador');
      return;
    }

    if (window.confirm('¿Está seguro de que desea desactivar este usuario?')) {
      try {
        await axios.delete(`/api/admin/usuarios/${id}`, {
          withCredentials: true
        });
        setSuccess('Usuario desactivado correctamente');
        fetchUsuarios();
      } catch (error) {
        setError(error.response?.data?.error || 'Error al desactivar usuario');
      }
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    clearForm(); // Use clearForm to reset
    setShowModal(true);
  };

  const clearForm = () => {
    setFormData({
      codigo: '',
      clave: '',
      nombre: '',
      apellidos: '',
      turno: 'mañana',
      activo: true,
      debe_cambiar_clave: false,
      rol: '', // Reset rol
      can_manage_billing: false // Reset billing permission
    });
    setEditingUser(null);
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

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mantenimiento de Usuarios</h1>
        <Button variant="primary" onClick={openCreateModal}>
          Nuevo Usuario
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Apellidos</th>
                <th>Turno</th>
                <th>Estado</th>
                <th>Permisos</th> {/* Added Permisos column */}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.codigo}</strong></td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.apellidos}</td>
                  <td className="text-capitalize">{usuario.turno}</td>
                  <td>
                    <Badge bg={usuario.activo ? 'success' : 'secondary'}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td> {/* Permissions cell */}
                    {usuario.rol === 'admin' && (
                      <Badge bg="warning" className="me-1">Admin</Badge>
                    )}
                    {(usuario.can_manage_billing || usuario.rol === 'admin') && (
                      <Badge bg="info">Facturación</Badge>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEdit(usuario)}
                    >
                      Editar
                    </Button>
                    {usuario.codigo !== 'admin' && usuario.activo && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeactivate(usuario.id, usuario.codigo)}
                      >
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Código de Usuario *</Form.Label>
                  <Form.Control
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    required
                    disabled={editingUser?.codigo === 'admin'}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Turno *</Form.Label>
                  <Form.Select
                    name="turno"
                    value={formData.turno}
                    onChange={handleChange}
                    required
                  >
                    <option value="mañana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                    <option value="todos">Todos</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nombre *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Apellidos *</Form.Label>
                  <Form.Control
                    type="text"
                    name="apellidos"
                    value={formData.apellidos}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>
                {editingUser ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña *'}
              </Form.Label>
              <Form.Control
                type="password"
                name="clave"
                value={formData.clave}
                onChange={handleChange}
                required={!editingUser}
                minLength={6}
              />
              {!editingUser && (
                <Form.Text className="text-muted">
                  Mínimo 6 caracteres
                </Form.Text>
              )}
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                {/* Rol input */}
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar rol</option>
                    <option value="admin">Administrador</option>
                    <option value="medico">Médico</option>
                    <option value="enfermero">Enfermero</option>
                    <option value="staff">Staff</option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                {/* Billing permission checkbox */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    name="can_manage_billing"
                    checked={formData.can_manage_billing || false}
                    onChange={handleInputChange}
                    label="Puede ver y gestionar facturación"
                    disabled={formData.rol === 'admin'} // Admin always has billing access
                  />
                  <Form.Text className="text-muted">
                    {formData.rol === 'admin'
                      ? 'Los administradores tienen acceso automático a la facturación'
                      : 'Permite al usuario acceder al módulo de autocobro y generar documentos'
                    }
                  </Form.Text>
                </Form.Group>
              </div>
            </div>

            {editingUser && (
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                      label="Usuario activo"
                      disabled={editingUser?.codigo === 'admin'}
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="debe_cambiar_clave"
                      checked={formData.debe_cambiar_clave}
                      onChange={handleChange}
                      label="Debe cambiar contraseña"
                      disabled={editingUser?.codigo === 'admin'}
                    />
                  </Form.Group>
                </div>
              </div>
            )}

            {!editingUser && (
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="debe_cambiar_clave"
                  checked={formData.debe_cambiar_clave}
                  onChange={handleChange}
                  label="Debe cambiar contraseña al iniciar sesión"
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default MantenimientoUsuarios;