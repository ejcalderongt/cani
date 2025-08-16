import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Alert, Badge, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NotasActuales() {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNota, setSelectedNota] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  const [formatoImpresion] = useState('con-lineas'); // Only official format
  const navigate = useNavigate();

  // Set default dates (yesterday and today)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [fechaInicio, setFechaInicio] = useState(yesterday.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);

  useEffect(() => {
    // Load notes automatically with default date range
    buscarNotas();
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const response = await axios.get('/api/pacientes');
      setPacientes(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const buscarNotas = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/notas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      setNotas(response.data);
    } catch (error) {
      console.error('Error al cargar notas:', error);
      setError('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (fecha, hora) => {
    try {
      const fechaObj = new Date(fecha + 'T' + hora);
      return fechaObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return `${fecha} ${hora}`;
    }
  };

  const agruparNotasPorFecha = (notas) => {
    return notas.reduce((grupos, nota) => {
      const fecha = nota.fecha;
      if (!grupos[fecha]) {
        grupos[fecha] = [];
      }
      grupos[fecha].push(nota);
      return grupos;
    }, {});
  };

  const handleRowClick = (nota) => {
    setSelectedNota(nota);
    setShowModal(true);
  };

  const imprimirNotaPaciente = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!paciente) return;

    // Get notes for this patient in the current date range
    const notasPaciente = notas.filter(nota => nota.paciente_id === pacienteId);

    if (notasPaciente.length === 0) {
      setError('No hay notas para imprimir de este paciente');
      return;
    }

    // Generate and print PDF
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML(paciente, notasPaciente);

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const generatePrintHTML = (paciente, notas) => {
    const fechaImpresion = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format notes with date and time
    const notasFormateadas = notas.map(nota => {
      const fechaObj = new Date(nota.fecha + 'T' + nota.hora);
      const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const horaFormateada = nota.hora.substring(0, 5);

      return {
        ...nota,
        fechaFormateada,
        horaFormateada
      };
    }).sort((a, b) => {
      const fechaA = new Date(a.fecha + 'T' + a.hora);
      const fechaB = new Date(b.fecha + 'T' + b.hora);
      return fechaA - fechaB;
    });

    const buildTableRows = (notas) => {
      return notas.map((nota) => {
        const observacionesLimpias = nota.observaciones
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s{2,}/g, ' ')
          .trim();

        const rowContent = `
          <tr>
            <td style="text-align: center; border-left: 1px solid #000; border-right: 1px solid #000; padding: 5px; vertical-align: top;">${nota.fechaFormateada}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 5px; vertical-align: top;">${nota.horaFormateada}</td>
            <td style="border-right: 1px solid #000; padding: 5px; vertical-align: top;">${observacionesLimpias.replace(/\n/g, '<br>')}</td>
            <td style="text-align: center; border-right: 1px solid #000; padding: 5px; vertical-align: top;">
              ${nota.enfermero_nombre} ${nota.enfermero_apellidos}
            </td>
          </tr>
        `;

        if (formatoImpresion === 'con-lineas') {
          return rowContent;
        } else {
          // For simplified format, don't add extra horizontal rules or complex cell structures if not needed
          // For now, let's just return the content within a single row, no explicit dividing lines between rows
          return rowContent; // Simplification logic could be more complex if needed
        }
      }).join('');
    };

    const tableBody = buildTableRows(notasFormateadas);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Notas de Enfermería - ${paciente?.nombre} ${paciente?.apellidos}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 10mm;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              color: #0F766E;
            }
            .header h2 {
              margin: 5px 0;
              font-size: 14px;
              color: #666;
            }
            .patient-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
              border: 1px solid #dee2e6;
            }
            .form-header {
              border: 2px solid #000;
              padding: 10px;
              margin: 20px 0;
            }
            .notes-section table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000; /* Outer border for the table */
            }
            .notes-section th {
              background-color: #f0f0f0;
              border: 1px solid #000;
              padding: 5px;
              text-align: center;
              font-size: 10px;
            }
            ${formatoImpresion === 'con-lineas' ? `
              .notes-section td {
                border-right: 1px solid #000; /* Keep vertical lines */
                border-left: 1px solid #000; /* Keep vertical lines */
                border-bottom: none; /* Remove horizontal lines between rows */
                border-top: none; /* Remove horizontal lines between rows */
                padding: 5px;
                vertical-align: top;
                font-size: 9px;
              }
              .notes-section tbody tr:first-child td {
                border-top: 1px solid #000; /* Keep top border for first row */
              }
              .notes-section tbody tr:last-child td {
                border-bottom: 1px solid #000; /* Keep bottom border for last row */
              }
              .notes-section td:first-child {
                border-left: 1px solid #000; /* Ensure left border on first column */
              }
              .notes-section td:last-child {
                border-right: 1px solid #000; /* Ensure right border on last column */
              }
            ` : `
              .notes-section td {
                border-right: 1px solid #000; /* Keep vertical lines */
                border-left: 1px solid #000; /* Keep vertical lines */
                border-bottom: none; /* Remove horizontal lines */
                border-top: none; /* Remove horizontal lines */
                padding: 5px;
                vertical-align: top;
                font-size: 9px;
              }
              .notes-section tbody tr:first-child td {
                border-top: 1px solid #000; /* Keep top border for first row */
              }
              .notes-section tbody tr:last-child td {
                border-bottom: 1px solid #000; /* Keep bottom border for last row */
              }
            `}
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SISTEMA HOSPITALARIO</h1>
            <h2>NOTAS DE ENFERMERÍA</h2>
          </div>

          <div class="patient-info">
            <h3>INFORMACIÓN DEL PACIENTE</h3>
            <p><strong>Expediente:</strong> ${paciente?.numero_expediente || 'N/A'}</p>
            <p><strong>Nombre:</strong> ${paciente?.nombre || ''} ${paciente?.apellidos || ''}</p>
            <p><strong>Período:</strong> ${fechaInicio} al ${fechaFin}</p>
          </div>

          <div class="form-header">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 70%; border-right: 1px solid #000; padding-right: 10px;">
                  <strong>Nombre y apellidos del paciente:</strong><br>
                  <span style="font-size: 14px;">${paciente?.nombre || ''} ${paciente?.apellidos || ''}</span>
                </td>
                <td style="width: 30%; padding-left: 10px; text-align: center;">
                  <strong>No. Expediente:</strong><br>
                  <span style="font-size: 14px;">${paciente?.numero_expediente || 'N/A'}</span>
                </td>
              </tr>
            </table>
          </div>

          <div class="notes-section">
            <table>
              <thead>
                <tr>
                  <th style="width: 10%;">Fecha</th>
                  <th style="width: 7%;">Hora</th>
                  <th style="width: 63%;">Observaciones y Cuidados de Enfermería</th>
                  <th style="width: 20%;">Nombre</th>
                </tr>
              </thead>
              <tbody>
                ${tableBody}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 30px; text-align: center; font-size: 8px; color: #666;">
            Documento generado automáticamente el ${fechaImpresion}<br>
            Sistema Hospitalario - Notas de Enfermería
          </div>
        </body>
      </html>
    `;
  };

  const notasAgrupadas = agruparNotasPorFecha(notas);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Notas Actuales</h1>
        <Button
          variant="secondary"
          onClick={() => navigate('/dashboard')}
        >
          Volver al Dashboard
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h5>Filtros y Configuración de Impresión</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form>
            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Inicio</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <Button
                  variant="primary"
                  onClick={buscarNotas}
                  disabled={loading}
                  className="mb-3"
                >
                  {loading ? 'Cargando...' : 'Buscar Notas'}
                </Button>
              </div>
            </div>

            
          </Form>
        </Card.Body>
      </Card>

      {notas.length === 0 && !loading ? (
        <Alert variant="info">
          No se encontraron notas en el rango de fechas seleccionado.
        </Alert>
      ) : (
        Object.keys(notasAgrupadas)
          .sort((a, b) => new Date(b) - new Date(a))
          .map(fecha => (
            <Card key={fecha} className="mb-4">
              <Card.Header>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    {new Date(fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h5>
                  <div className="d-flex align-items-center gap-2">
                    <Badge bg="primary">
                      {notasAgrupadas[fecha].length} nota(s)
                    </Badge>
                    {notasAgrupadas[fecha].length > 0 && (
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => {
                          const pacienteId = notasAgrupadas[fecha][0].paciente_id;
                          imprimirNotaPaciente(pacienteId);
                        }}
                        title="Imprimir notas de este paciente"
                      >
                        📄 PDF
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Paciente</th>
                      <th>Enfermero(a)</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notasAgrupadas[fecha]
                      .sort((a, b) => b.hora.localeCompare(a.hora))
                      .map((nota) => (
                        <tr
                          key={nota.id}
                          onClick={() => handleRowClick(nota)}
                          style={{ cursor: 'pointer' }}
                          className="table-row-hover"
                        >
                          <td>
                            <strong>{nota.hora}</strong>
                          </td>
                          <td>
                            <strong>{nota.paciente_nombre} {nota.paciente_apellidos}</strong>
                            <br />
                            <small className="text-muted">Exp: {nota.paciente_expediente}</small>
                          </td>
                          <td>{nota.enfermero_nombre} {nota.enfermero_apellidos}</td>
                          <td>
                            <div style={{ maxWidth: '400px' }}>
                              {nota.observaciones.length > 100
                                ? `${nota.observaciones.substring(0, 100)}...`
                                : nota.observaciones
                              }
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ))
      )}

      {loading && (
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando notas...</span>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la nota */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalle de Nota de Enfermería</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNota && (
            <div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Paciente:</strong><br />
                  {selectedNota.paciente_nombre} {selectedNota.paciente_apellidos}<br />
                  <small className="text-muted">Expediente: {selectedNota.paciente_expediente}</small>
                </div>
                <div className="col-md-6">
                  <strong>Enfermero(a):</strong><br />
                  {selectedNota.enfermero_nombre} {selectedNota.enfermero_apellidos}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Fecha:</strong> {formatDateTime(selectedNota.fecha, selectedNota.hora)}
                </div>
              </div>

              <div className="mb-3">
                <strong>Observaciones:</strong>
                <div className="border rounded p-3 mt-2" style={{ backgroundColor: '#f8f9fa' }}>
                  {selectedNota.observaciones.split('\n').map((linea, index) => (
                    <div key={index}>{linea}</div>
                  ))}
                </div>
              </div>

              {selectedNota.medicamentos_administrados && (
                <div className="mb-3">
                  <strong>Medicamentos Administrados:</strong>
                  <div className="border rounded p-3 mt-2" style={{ backgroundColor: '#f8f9fa' }}>
                    {selectedNota.medicamentos_administrados}
                  </div>
                </div>
              )}

              {selectedNota.tratamientos && (
                <div className="mb-3">
                  <strong>Tratamientos:</strong>
                  <div className="border rounded p-3 mt-2" style={{ backgroundColor: '#f8f9fa' }}>
                    {selectedNota.tratamientos}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          {selectedNota && (
            <Button
              variant="success"
              onClick={() => {
                imprimirNotaPaciente(selectedNota.paciente_id);
                setShowModal(false);
              }}
            >
              📄 Imprimir PDF
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default NotasActuales;