
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Medicamentos() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedicamentos = async () => {
      try {
        const response = await axios.get('/api/medicamentos');
        setMedicamentos(response.data);
      } catch (error) {
        console.error('Error al cargar medicamentos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicamentos();
  }, []);

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
        <h1>Medicamentos</h1>
        <Button as={Link} to="/medicamentos/nuevo" variant="primary">
          Nuevo Medicamento
        </Button>
      </div>

      <Card>
        <Card.Body>
          {medicamentos.length === 0 ? (
            <p className="text-muted">No hay medicamentos registrados</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Unidad de Medida</th>
                </tr>
              </thead>
              <tbody>
                {medicamentos.map((medicamento) => (
                  <tr key={medicamento.id}>
                    <td><strong>{medicamento.nombre}</strong></td>
                    <td>{medicamento.descripcion || 'N/A'}</td>
                    <td>{medicamento.unidad_medida}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Medicamentos;
