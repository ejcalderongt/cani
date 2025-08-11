
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function Navbar({ enfermero, onLogout }) {
  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          Sistema Hospitalario
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/pacientes">
              Pacientes
            </Nav.Link>
            <Nav.Link as={Link} to="/notas">
              Notas de Enfermería
            </Nav.Link>
            <Nav.Link as={Link} to="/medicamentos">
              Medicamentos
            </Nav.Link>
          </Nav>
          
          <Nav>
            <BootstrapNavbar.Text className="me-3">
              {enfermero.nombre} {enfermero.apellidos}
            </BootstrapNavbar.Text>
            <Nav.Link onClick={onLogout}>
              Cerrar Sesión
            </Nav.Link>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;
