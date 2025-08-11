
import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevoMedicamento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/medicamentos', formData);
      navigate('/medicamentos');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al crear medicamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nuevo Medicamento</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Medicamento *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Unidad de Medida *</Form.Label>
              <Form.Select
                name="unidad_medida"
                value={formData.unidad_medida}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="tabletas">tabletas</option>
                <option value="cápsulas">cápsulas</option>
                <option value="gotas">gotas</option>
                <option value="unidades">unidades</option>
                <option value="ampolletas">ampolletas</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Medicamento'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => navigate('/medicamentos')}
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

export default NuevoMedicamento;
