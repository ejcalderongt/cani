import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function Login({ onLogin }) {
  const [codigo, setCodigo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ codigo: '', clave: '' }); // State to hold form data

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', { codigo: formData.codigo });

      // Try multiple base URLs for Replit environment
      const baseURLs = [
        '', // Current domain
        `${window.location.protocol}//${window.location.hostname}:3002`,
        `${window.location.protocol}//${window.location.hostname}:5001`,
        `${window.location.protocol}//${window.location.hostname}`
      ];

      let response = null;
      let lastError = null;

      for (const baseURL of baseURLs) {
        try {
          console.log('Trying baseURL:', baseURL);
          const axiosInstance = axios.create({
            baseURL: baseURL,
            withCredentials: true,
            timeout: 10000
          });

          response = await axiosInstance.post('/api/login', formData);

          if (response.data.success) {
            // Update the global axios instance to use this working URL
            axios.defaults.baseURL = baseURL;
            onLogin(response.data.enfermero);
            return;
          } else {
            setError(response.data.message || 'Error al iniciar sesión');
            return;
          }
        } catch (err) {
          lastError = err;
          console.log('Failed with baseURL:', baseURL, err.message);
          continue;
        }
      }

      // If we get here, all attempts failed
      throw lastError;

    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Error de conexión. Verifique que el servidor esté ejecutándose.');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    // Also update local state if you still need it for other purposes
    if (name === 'codigo') setCodigo(value);
    if (name === 'clave') setClave(value);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card style={{ width: '400px' }}>
        <Card.Header>
          <h4 className="text-center mb-0">Iniciar Sesión</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Código</Form.Label>
              <Form.Control
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Clave</Form.Label>
              <Form.Control
                type="password"
                name="clave"
                value={formData.clave}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;