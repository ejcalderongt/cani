
import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function VerPaciente() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const response = await axios.get(`/api/pacientes/${id}`);
        setData(response.data);
      } catch (error) {
        console.error('Error al cargar paciente:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaciente();
  }, [id]);

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

  if (!data) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">Paciente no encontrado</div>
      </Container>
    );
  }

  const { paciente, notas, medicamentos } = data;

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Información del Paciente</h1>
        <Button as={Link} to="/pacientes" variant="secondary">
          Volver a Pacientes
        </Button>
      </div>

      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5>Datos Generales</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Expediente:</strong> {paciente.numero_expediente}</p>
                  <p><strong>Nombre:</strong> {paciente.nombre} {paciente.apellidos}</p>
                  <p><strong>Fecha de Nacimiento:</strong> {paciente.fecha_nacimiento}</p>
                  <p><strong>Documento:</strong> {paciente.documento_identidad}</p>
                  <p><strong>Nacionalidad:</strong> {paciente.nacionalidad}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Tipo:</strong> <Badge bg={paciente.tipo_paciente === 'interno' ? 'danger' : 'success'}>{paciente.tipo_paciente}</Badge></p>
                  <p><strong>Tipo de Sangre:</strong> {paciente.tipo_sangre}</p>
                  <p><strong>Teléfono:</strong> {paciente.telefono_principal}</p>
                  {paciente.cuarto_asignado && <p><strong>Cuarto:</strong> {paciente.cuarto_asignado}</p>}
                  <p><strong>Contacto de Emergencia:</strong> {paciente.contacto_emergencia_nombre} ({paciente.contacto_emergencia_telefono})</p>
                </Col>
              </Row>
              {paciente.padecimientos && (
                <div className="mt-3">
                  <strong>Padecimientos:</strong>
                  <p>{paciente.padecimientos}</p>
                </div>
              )}
              {paciente.informacion_general && (
                <div className="mt-3">
                  <strong>Información General:</strong>
                  <p>{paciente.informacion_general}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5>Medicamentos Asignados</h5>
            </Card.Header>
            <Card.Body>
              {medicamentos.length === 0 ? (
                <p className="text-muted">No hay medicamentos asignados</p>
              ) : (
                medicamentos.map((medicamento, index) => (
                  <div key={index} className="border-bottom mb-2 pb-2">
                    <strong>{medicamento.medicamento.nombre}</strong> - {medicamento.dosis}<br />
                    <small className="text-muted">{medicamento.frecuencia} | Horarios: {medicamento.horarios}</small>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>Notas de Enfermería Recientes</h5>
            </Card.Header>
            <Card.Body>
              {notas.length === 0 ? (
                <p className="text-muted">No hay notas registradas</p>
              ) : (
                notas.slice(0, 5).map((nota, index) => (
                  <div key={index} className="border-bottom mb-2 pb-2">
                    <div className="d-flex justify-content-between">
                      <strong>{nota.fecha} - {nota.hora}</strong>
                      <small className="text-muted">{nota.enfermero?.nombre} {nota.enfermero?.apellidos}</small>
                    </div>
                    <p className="mt-1">{nota.observaciones}</p>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default VerPaciente;
