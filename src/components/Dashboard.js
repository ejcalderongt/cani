
import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <Container className="mt-4">
      <h1 className="mb-4">Panel de Control</h1>
      
      <Row>
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Pacientes</Card.Title>
              <Card.Text>
                Gestionar información de pacientes internos y ambulatorios
              </Card.Text>
              <Button as={Link} to="/pacientes" variant="primary">
                Ver Pacientes
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Notas de Enfermería</Card.Title>
              <Card.Text>
                Registrar y consultar notas de enfermería diarias
              </Card.Text>
              <Button as={Link} to="/notas" variant="primary">
                Ver Notas
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Medicamentos</Card.Title>
              <Card.Text>
                Gestionar catálogo de medicamentos y tratamientos
              </Card.Text>
              <Button as={Link} to="/medicamentos" variant="primary">
                Ver Medicamentos
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
