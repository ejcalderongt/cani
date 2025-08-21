
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
  const [notasUsadas, setNotasUsadas] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  // Configuración para hoja carta estándar (basado en análisis del PDF real)
  const NOTAS_POR_HOJA = 10; // Máximo 10 notas por hoja según formato oficial
  const MAX_ENTERS_CONSECUTIVOS = 2;

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await axios.get('/api/pacientes?activos_solo=true');
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
    // El conteo se actualiza solo cuando cambia el paciente
    // No necesitamos recalcular en tiempo real por cada carácter
  }, [formData.observaciones]);

  const fetchNotasPaciente = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${formData.paciente_id}`);
      const notas = response.data.notas || [];
      setNotasExistentes(notas);

      // Calcular número de notas del día actual
      const hoy = new Date().toISOString().split('T')[0];
      const notasHoy = notas.filter(nota => nota.fecha === hoy);
      
      setNotasUsadas(notasHoy.length);
    } catch (error) {
      console.error('Error al cargar notas del paciente:', error);
    }
  };

  const calcularPorcentajeHoja = () => {
    return Math.min((notasUsadas / NOTAS_POR_HOJA) * 100, 100);
  };

  const debeImprimir = () => {
    return notasUsadas >= NOTAS_POR_HOJA * 0.8; // 80% de capacidad (8 notas)
  };

  const generarPreview = () => {
    window.open(`/imprimir-notas?paciente=${formData.paciente_id}&preview=true`, '_blank');
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
        successMessage += '. ⚠️ ATENCIÓN: Ya tiene 8+ notas. Se recomienda imprimir la hoja antes de continuar.';
      }

      setSuccess(successMessage);
      setShowPreview(true); // Mostrar opción de previsualización

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

      // Redireccionar a la visualización de notas para ver el grado de llenado
      setTimeout(() => {
        navigate('/notas');
      }, 1500);
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
          {success && (
            <Alert variant={debeImprimir() ? "warning" : "success"} dismissible onClose={() => {setSuccess(''); setShowPreview(false);}}>
              {success}
              {showPreview && (
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline-primary" 
                    onClick={generarPreview}
                    className="me-2"
                  >
                    👁️ Ver Preview de la Hoja
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => navigate('/imprimir-notas')}
                  >
                    📄 Ir a Imprimir
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {formData.paciente_id && (
            <Card className="mb-3" style={{ backgroundColor: debeImprimir() ? '#fff3cd' : '#e7f3ff' }}>
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small><strong>Capacidad de Hoja Carta (máx. 10 notas):</strong></small>
                  <small>{notasUsadas}/{NOTAS_POR_HOJA} notas ({Math.round(calcularPorcentajeHoja())}%)</small>
                </div>
                <ProgressBar
                  now={calcularPorcentajeHoja()}
                  variant={calcularPorcentajeHoja() > 80 ? "danger" : calcularPorcentajeHoja() > 60 ? "warning" : "success"}
                />
                {debeImprimir() && (
                  <Alert variant="warning" className="mt-2 mb-0 py-2">
                    <small>⚠️ <strong>Hoja casi llena</strong> - {notasUsadas} de {NOTAS_POR_HOJA} notas utilizadas</small>
                  </Alert>
                )}
                <div className="text-end mt-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => navigate('/imprimir-notas')}
                    className="me-2"
                  >
                    📄 Imprimir Notas
                  </Button>
                  {notasUsadas > 0 && (
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={generarPreview}
                    >
                      👁️ Preview Hoja
                    </Button>
                  )}
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
              <Form.Label>Paciente Activo *</Form.Label>
              <Form.Select
                name="paciente_id"
                value={formData.paciente_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar paciente activo...</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos} 
                    {paciente.tipo_paciente === 'interno' ? ' (Interno)' : ' (Ambulatorio)'}
                    {paciente.cuarto_asignado ? ` - ${paciente.cuarto_asignado}` : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Solo se muestran pacientes activos (sin fecha de salida)
              </Form.Text>
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
                Máximo 2 enters consecutivos | 
                Recuerde: máximo 10 notas por hoja carta
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
