
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevaNota() {
  const [pacientes, setPacientes] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    paciente_id: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notasExistentes, setNotasExistentes] = useState([]);
  const [caracteresUsados, setCaracteresUsados] = useState(0);
  const navigate = useNavigate();

  // Configuración para hoja legal estándar
  const CARACTERES_POR_HOJA = 2000; // Ajustado para solo observaciones
  const MAX_ENTERS_CONSECUTIVOS = 2;

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await axios.get('/api/pacientes');
        setPacientes(response.data);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
        setError('Error al cargar la lista de pacientes');
      }
    };

    fetchPacientes();
  }, []);

  useEffect(() => {
    if (formData.paciente_id) {
      fetchNotasPaciente();
    }
  }, [formData.paciente_id]);

  useEffect(() => {
    // Calcular caracteres de la nota actual
    const caracteresTotales = caracteresUsados + formData.observaciones.length;
    setCaracteresUsados(caracteresTotales);
  }, [formData.observaciones]);

  const fetchNotasPaciente = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${formData.paciente_id}`);
      const notas = response.data.notas || [];
      setNotasExistentes(notas);

      // Calcular caracteres de notas existentes del día actual
      const hoy = new Date().toISOString().split('T')[0];
      const notasHoy = notas.filter(nota => nota.fecha === hoy);

      const caracteresHoy = notasHoy.reduce((total, nota) => {
        return total + (nota.observaciones?.length || 0);
      }, 0);

      setCaracteresUsados(caracteresHoy);
    } catch (error) {
      console.error('Error al cargar notas del paciente:', error);
    }
  };

  const calcularPorcentajeHoja = () => {
    return Math.min((caracteresUsados / CARACTERES_POR_HOJA) * 100, 100);
  };

  const debeImprimir = () => {
    return caracteresUsados >= CARACTERES_POR_HOJA * 0.85; // 85% de capacidad
  };

  const controlarEnters = (texto) => {
    // Limitar enters consecutivos a máximo 2
    return texto.replace(/\n{3,}/g, '\n\n');
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    if (e.target.name === 'observaciones') {
      value = controlarEnters(value);
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.observaciones.trim()) {
      setError('Las observaciones son obligatorias');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/notas', formData);

      let successMessage = 'Nota registrada exitosamente';
      if (debeImprimir()) {
        successMessage += '. ⚠️ ATENCIÓN: La hoja está al 85% de capacidad. Se recomienda imprimir las notas para cumplir con los requerimientos legales.';
      }

      setSuccess(successMessage);

      // Reset form
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paciente_id: formData.paciente_id, // Mantener paciente seleccionado
        observaciones: ''
      });

      // Actualizar conteo de notas
      if (formData.paciente_id) {
        fetchNotasPaciente();
      }

      // Redireccionar solo si no hay advertencia de impresión
      if (!debeImprimir()) {
        setTimeout(() => {
          navigate('/notas');
        }, 2000);
      }
    } catch (error) {
      console.error('Error al registrar nota:', error);
      setError('Error al registrar la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nueva Nota de Enfermería</h1>

      <Card>
        <Card.Header>
          <h5>Registro de Observaciones</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant={debeImprimir() ? "warning" : "success"} dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {formData.paciente_id && (
            <Card className="mb-3" style={{ backgroundColor: debeImprimir() ? '#fff3cd' : '#e7f3ff' }}>
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small><strong>Capacidad de Hoja Legal (solo observaciones):</strong></small>
                  <small>{Math.round(calcularPorcentajeHoja())}% utilizado</small>
                </div>
                <ProgressBar
                  now={calcularPorcentajeHoja()}
                  variant={calcularPorcentajeHoja() > 85 ? "danger" : calcularPorcentajeHoja() > 60 ? "warning" : "success"}
                />
                {debeImprimir() && (
                  <Alert variant="warning" className="mt-2 mb-0 py-2">
                    <small>⚠️ <strong>Hoja casi llena</strong> - Se recomienda imprimir las notas antes de continuar.</small>
                  </Alert>
                )}
                <div className="text-end mt-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => navigate('/imprimir-notas')}
                  >
                    📄 Imprimir Notas
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Paciente *</Form.Label>
              <Form.Select
                name="paciente_id"
                value={formData.paciente_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                required
                placeholder="Registre aquí las observaciones de enfermería. Máximo 2 enters consecutivos entre párrafos."
                style={{ resize: 'vertical' }}
              />
              <Form.Text className="text-muted">
                Caracteres: {formData.observaciones.length} | 
                Máximo 2 enters consecutivos entre observaciones
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Nota'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/notas')}
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

export default NuevaNota;
