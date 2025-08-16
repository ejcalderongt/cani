
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Image } from 'react-bootstrap';
import axios from 'axios';

function ConfiguracionHospital() {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [config, setConfig] = useState({
    nombre_hospital: '',
    logo_base64: '',
    direccion: '',
    telefono: '',
    email: '',
    sitio_web: ''
  });
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      setLoadingConfig(true);
      const response = await axios.get('/api/configuracion-hospital');
      setConfig(response.data);
      setLogoPreview(response.data.logo_base64);
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setError('Error al cargar la configuración del hospital');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('El archivo del logo debe ser menor a 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        setConfig({
          ...config,
          logo_base64: base64
        });
        setLogoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setConfig({
      ...config,
      logo_base64: ''
    });
    setLogoPreview('');
    // Clear file input
    const fileInput = document.getElementById('logoInput');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('/api/configuracion-hospital', config);
      setSuccess('Configuración del hospital actualizada correctamente');
      setConfig(response.data);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('hospitalConfigUpdated', {
        detail: response.data
      }));
      
    } catch (error) {
      console.error('Error updating configuration:', error);
      
      if (error.response?.status === 401) {
        setError('No tiene autorización para realizar esta acción');
      } else if (error.response?.status === 403) {
        setError('Solo los administradores pueden actualizar la configuración del hospital');
      } else {
        setError(error.response?.data?.error || 'Error al actualizar la configuración');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
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
        <h1>Configuración del Hospital/Clínica</h1>
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
          <h5 className="mb-0">Información de la Institución</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre del Hospital/Clínica *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre_hospital"
                    value={config.nombre_hospital}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    placeholder="Ej: Hospital San Rafael"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="direccion"
                    value={config.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección completa del hospital/clínica"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        type="text"
                        name="telefono"
                        value={config.telefono}
                        onChange={handleInputChange}
                        maxLength={50}
                        placeholder="Ej: +505 2222-3333"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={config.email}
                        onChange={handleInputChange}
                        maxLength={100}
                        placeholder="info@hospital.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Sitio Web</Form.Label>
                  <Form.Control
                    type="url"
                    name="sitio_web"
                    value={config.sitio_web}
                    onChange={handleInputChange}
                    maxLength={200}
                    placeholder="https://www.hospital.com"
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Logo</Form.Label>
                  <div className="text-center">
                    {logoPreview && (
                      <div className="mb-3">
                        <Image
                          src={logoPreview}
                          alt="Logo preview"
                          fluid
                          style={{ maxHeight: '150px', border: '1px solid #dee2e6' }}
                        />
                        <div className="mt-2">
                          <Button variant="outline-danger" size="sm" onClick={removeLogo}>
                            Quitar Logo
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Form.Control
                      type="file"
                      id="logoInput"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                    <Form.Text className="text-muted">
                      Formatos soportados: JPG, PNG, GIF. Máximo 2MB.
                    </Form.Text>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={fetchConfiguration}
                disabled={loading}
              >
                Recargar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="mt-4">
        <Alert variant="info">
          <strong>Nota:</strong> Los cambios en el nombre del hospital se reflejarán inmediatamente 
          en todas las pantallas del sistema. El logo y demás información podrán ser utilizados 
          en futuros reportes y documentos.
        </Alert>
      </div>
    </Container>
  );
}

export default ConfiguracionHospital;
