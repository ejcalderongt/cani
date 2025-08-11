
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function NotasEnfermeria() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get('/api/notas');
        setNotas(response.data);
      } catch (error) {
        console.error('Error al cargar notas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
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
        <h1>Notas de Enfermería</h1>
        <Button as={Link} to="/notas/nueva" variant="primary">
          Nueva Nota
        </Button>
      </div>

      <Card>
        <Card.Body>
          {notas.length === 0 ? (
            <p className="text-muted">No hay notas registradas</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Paciente</th>
                  <th>Enfermero</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {notas.map((nota) => (
                  <tr key={nota.id}>
                    <td>{nota.fecha} {nota.hora}</td>
                    <td>{nota.paciente?.nombre} {nota.paciente?.apellidos}</td>
                    <td>{nota.enfermero?.nombre} {nota.enfermero?.apellidos}</td>
                    <td>{nota.observaciones.length > 100 ? `${nota.observaciones.substring(0, 100)}...` : nota.observaciones}</td>
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

export default NotasEnfermeria;
