
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await axios.get('/api/pacientes');
        setPacientes(response.data);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPacientes();
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
        <h1>Pacientes</h1>
        <Button as={Link} to="/pacientes/nuevo" variant="primary">
          Nuevo Paciente
        </Button>
      </div>

      <Card>
        <Card.Body>
          {pacientes.length === 0 ? (
            <p className="text-muted">No hay pacientes registrados</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Expediente</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Cuarto</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>{paciente.numero_expediente}</td>
                    <td>{paciente.nombre} {paciente.apellidos}</td>
                    <td>
                      <Badge 
                        bg={paciente.tipo_paciente === 'interno' ? 'danger' : 'success'}
                      >
                        {paciente.tipo_paciente}
                      </Badge>
                    </td>
                    <td>{paciente.cuarto_asignado || 'N/A'}</td>
                    <td>
                      <Button
                        as={Link}
                        to={`/pacientes/${paciente.id}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        Ver
                      </Button>
                    </td>
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

export default Pacientes;
