import React, { useState, useEffect } from 'react';
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function NavbarComponent({ enfermero, onLogout }) {
  const [hospitalConfig, setHospitalConfig] = useState({
    nombre_hospital: 'Sistema Hospitalario'
  });

  // Use enfermero directly instead of creating a separate 'user' variable
  const user = enfermero;

  useEffect(() => {
    fetchHospitalConfig();

    // Listen for hospital config updates
    const handleConfigUpdate = (event) => {
      setHospitalConfig(event.detail);
    };

    window.addEventListener('hospitalConfigUpdated', handleConfigUpdate);

    return () => {
      window.removeEventListener('hospitalConfigUpdated', handleConfigUpdate);
    };
  }, []);

  const fetchHospitalConfig = async () => {
    try {
      const response = await axios.get('/api/configuracion-hospital');
      setHospitalConfig(response.data);
    } catch (error) {
      console.error('Error fetching hospital config:', error);
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          {hospitalConfig.nombre_hospital}
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
            <Nav.Link as={Link} to="/pacientes">Pacientes</Nav.Link>
            <Nav.Link as={Link} to="/notas">📝 Notas</Nav.Link>
            <Nav.Link as={Link} to="/signos-vitales">❤️ Signos Vitales</Nav.Link>
            <Nav.Link as={Link} to="/medicamentos">💊 Medicamentos</Nav.Link>
            <Nav.Link as={Link} to="/imprimir-notas">Imprimir Notas</Nav.Link>

            {(user.can_manage_billing || user.rol === 'admin') && (
              <Nav.Link as={Link} to="/autocobro">Autocobro</Nav.Link>
            )}

            {user.rol === 'admin' && (
              <NavDropdown title="Administración" id="admin-nav-dropdown">
                <NavDropdown.Item as={Link} to="/admin/usuarios">
                  Gestión de Usuarios
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/mantenimiento-terapeutas">
                  Mantenimiento de Terapeutas
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/configuracion-facturacion">Configuración de Facturación</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/sistema">
                  Configuración del Sistema
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>

          <Nav>
            <Navbar.Text className="me-3">
              👤 {user.nombre && user.apellidos
                ? `${user.nombre} ${user.apellidos}`
                : user.codigo || 'Usuario'}
            </Navbar.Text>
            <Nav.Link onClick={onLogout}>
              Cerrar Sesión
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;