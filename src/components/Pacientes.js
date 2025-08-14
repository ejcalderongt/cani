
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({
    fecha_salida: '',
    observaciones_alta: '',
    medico_autoriza: '',
    enfermero_autoriza: '',
    director_autoriza: ''
  });
  const [dischargeError, setDischargeError] = useState('');
  const [dischargeSuccess, setDischargeSuccess] = useState('');

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

  const handleDischarge = (paciente) => {
    setSelectedPaciente(paciente);
    setDischargeForm({
      fecha_salida: new Date().toISOString().split('T')[0],
      observaciones_alta: '',
      medico_autoriza: '',
      enfermero_autoriza: '',
      director_autoriza: ''
    });
    setShowDischargeModal(true);
    setDischargeError('');
    setDischargeSuccess('');
  };

  const handleDischargeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update patient with discharge information
      await axios.put(`/api/pacientes/${selectedPaciente.id}/alta`, dischargeForm);
      
      // Generate PDF
      await generateDischargePDF();
      
      setDischargeSuccess('Paciente dado de alta exitosamente. PDF generado.');
      setTimeout(() => {
        setShowDischargeModal(false);
        fetchPacientes(); // Refresh list
      }, 2000);
    } catch (error) {
      setDischargeError('Error al dar de alta al paciente: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateDischargePDF = () => {
    const paciente = selectedPaciente;
    const today = new Date();
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Alta Médica - ${paciente.nombre} ${paciente.apellidos}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0F766E;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #0F766E;
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              color: #666;
              margin: 10px 0;
              font-size: 18px;
            }
            .patient-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
              border: 2px solid #0F766E;
            }
            .discharge-section {
              margin: 25px 0;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .signatures {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 2px solid #333;
              margin-top: 50px;
              padding-top: 5px;
              font-weight: bold;
            }
            .info-row {
              margin-bottom: 8px;
            }
            .label {
              font-weight: bold;
              color: #0F766E;
            }
            @media print {
              body { margin: 0; }
              .signatures { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CLÍNICA DE TRATAMIENTO DE ADICCIONES</h1>
            <h2>DOCUMENTO DE ALTA MÉDICA</h2>
            <p>Fecha de emisión: ${today.toLocaleDateString('es-ES')}</p>
          </div>

          <div class="patient-section">
            <h3 style="color: #0F766E; margin-bottom: 15px;">INFORMACIÓN DEL PACIENTE</h3>
            <div class="info-row">
              <span class="label">Expediente:</span> ${paciente.numero_expediente}
            </div>
            <div class="info-row">
              <span class="label">Nombre completo:</span> ${paciente.nombre} ${paciente.apellidos}
            </div>
            <div class="info-row">
              <span class="label">Documento de identidad:</span> ${paciente.documento_identidad}
            </div>
            <div class="info-row">
              <span class="label">Fecha de nacimiento:</span> ${new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES')}
            </div>
            <div class="info-row">
              <span class="label">Tipo de paciente:</span> ${paciente.tipo_paciente}
            </div>
            <div class="info-row">
              <span class="label">Fecha de ingreso:</span> ${new Date(paciente.fecha_ingreso).toLocaleDateString('es-ES')}
            </div>
            <div class="info-row">
              <span class="label">Motivo de ingreso:</span> ${paciente.motivo_ingreso || 'N/A'}
            </div>
          </div>

          <div class="discharge-section">
            <h3 style="color: #0F766E; margin-bottom: 15px;">INFORMACIÓN DEL ALTA</h3>
            <div class="info-row">
              <span class="label">Fecha de alta:</span> ${new Date(dischargeForm.fecha_salida).toLocaleDateString('es-ES')}
            </div>
            <div class="info-row" style="margin-top: 15px;">
              <span class="label">Observaciones del alta:</span>
              <div style="margin-top: 8px; padding: 10px; background: white; border: 1px solid #ddd; border-radius: 4px;">
                ${dischargeForm.observaciones_alta || 'Sin observaciones especiales.'}
              </div>
            </div>
          </div>

          <div class="discharge-section">
            <h3 style="color: #0F766E; margin-bottom: 15px;">CONDICIÓN AL ALTA</h3>
            <p>El paciente es dado de alta en condiciones estables, habiendo completado satisfactoriamente el tratamiento prescrito en esta institución.</p>
            <p>Se recomienda continuar con las indicaciones médicas y seguimiento ambulatorio según corresponda.</p>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line">${dischargeForm.medico_autoriza}</div>
              <div><strong>MÉDICO TRATANTE</strong></div>
              <div>Cédula Profesional</div>
            </div>
            
            <div class="signature-box">
              <div class="signature-line">${dischargeForm.enfermero_autoriza}</div>
              <div><strong>ENFERMERO(A)</strong></div>
              <div>Cédula Profesional</div>
            </div>
            
            <div class="signature-box">
              <div class="signature-line">${dischargeForm.director_autoriza}</div>
              <div><strong>DIRECTOR MÉDICO</strong></div>
              <div>Cédula Profesional</div>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            <p>Este documento certifica el alta médica del paciente mencionado.</p>
            <p>Documento generado el ${today.toLocaleDateString('es-ES')} a las ${today.toLocaleTimeString('es-ES')}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const fetchPacientes = async () => {
    try {
      const response = await axios.get('/api/pacientes');
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const toggleActiveStatus = async (paciente) => {
    try {
      const newStatus = !paciente.activo;
      await axios.put(`/api/pacientes/${paciente.id}/activo`, { activo: newStatus });
      
      // Update local state
      setPacientes(pacientes.map(p => 
        p.id === paciente.id ? { ...p, activo: newStatus } : p
      ));
    } catch (error) {
      console.error('Error al cambiar estado del paciente:', error);
    }
  };

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
                  <th>Estado</th>
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
                      <div className="d-flex flex-column gap-1">
                        <Badge bg={paciente.fecha_salida ? 'success' : 'primary'}>
                          {paciente.fecha_salida ? 'Alta' : 'Activo'}
                        </Badge>
                        {!paciente.fecha_salida && (
                          <Badge bg={paciente.activo ? 'success' : 'warning'} className="small">
                            {paciente.activo ? 'Vigente' : 'Inactivo'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          as={Link}
                          to={`/pacientes/${paciente.id}`}
                          variant="outline-primary"
                          size="sm"
                        >
                          Ver
                        </Button>
                        {!paciente.fecha_salida && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleDischarge(paciente)}
                            >
                              Alta
                            </Button>
                            <Button
                              variant={paciente.activo ? "outline-warning" : "outline-success"}
                              size="sm"
                              onClick={() => toggleActiveStatus(paciente)}
                            >
                              {paciente.activo ? 'Inactivar' : 'Activar'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Discharge Modal */}
      <Modal show={showDischargeModal} onHide={() => setShowDischargeModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Dar de Alta - {selectedPaciente?.nombre} {selectedPaciente?.apellidos}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDischargeSubmit}>
          <Modal.Body>
            {dischargeError && <Alert variant="danger">{dischargeError}</Alert>}
            {dischargeSuccess && <Alert variant="success">{dischargeSuccess}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Fecha de Alta</Form.Label>
              <Form.Control
                type="date"
                value={dischargeForm.fecha_salida}
                onChange={(e) => setDischargeForm({...dischargeForm, fecha_salida: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones del Alta</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={dischargeForm.observaciones_alta}
                onChange={(e) => setDischargeForm({...dischargeForm, observaciones_alta: e.target.value})}
                placeholder="Descripción del estado del paciente al momento del alta, recomendaciones, etc."
                required
              />
            </Form.Group>

            <h6 className="text-primary mb-3">Autorización del Alta</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Médico que Autoriza</Form.Label>
              <Form.Control
                type="text"
                value={dischargeForm.medico_autoriza}
                onChange={(e) => setDischargeForm({...dischargeForm, medico_autoriza: e.target.value})}
                placeholder="Dr. Nombre Completo"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Enfermero(a) que Autoriza</Form.Label>
              <Form.Control
                type="text"
                value={dischargeForm.enfermero_autoriza}
                onChange={(e) => setDischargeForm({...dischargeForm, enfermero_autoriza: e.target.value})}
                placeholder="Enf. Nombre Completo"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Director que Autoriza</Form.Label>
              <Form.Control
                type="text"
                value={dischargeForm.director_autoriza}
                onChange={(e) => setDischargeForm({...dischargeForm, director_autoriza: e.target.value})}
                placeholder="Dr. Nombre Completo - Director"
                required
              />
            </Form.Group>

            <Alert variant="info">
              <strong>Nota:</strong> Al confirmar el alta se generará automáticamente un documento PDF 
              con toda la información del paciente y las firmas de autorización.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDischargeModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="success">
              Confirmar Alta y Generar PDF
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Pacientes;
