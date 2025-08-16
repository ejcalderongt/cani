import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Table } from 'react-bootstrap';
import axios from 'axios';

function ImprimirNotas() {
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default dates: yesterday to today
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [fechaInicio, setFechaInicio] = useState(yesterday.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);
  const [formatoImpresion] = useState('con-lineas'); // Only official format

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchPacientes = async () => {
    try {
      const response = await axios.get('/api/pacientes');
      setPacientes(response.data);
    } catch (error) {
      setError('Error al cargar pacientes');
    }
  };

  const fetchNotasPaciente = async () => {
    if (!selectedPaciente) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/pacientes/${selectedPaciente}`);
      let notasFiltradas = response.data.notas;

      // Filtrar por fechas si se especifican
      if (fechaInicio) {
        notasFiltradas = notasFiltradas.filter(nota => nota.fecha >= fechaInicio);
      }
      if (fechaFin) {
        notasFiltradas = notasFiltradas.filter(nota => nota.fecha <= fechaFin);
      }

      setNotas(notasFiltradas);
    } catch (error) {
      setError('Error al cargar notas del paciente');
    } finally {
      setLoading(false);
    }
  };

  const imprimirPDF = () => {
    if (notas.length === 0) {
      setError('No hay notas para imprimir');
      return;
    }

    const paciente = pacientes.find(p => p.id === parseInt(selectedPaciente));

    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintHTML(paciente, notas);

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Esperar a que se cargue el contenido y luego imprimir
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

    // Formatear cada nota con su fecha y hora específica
    const notasFormateadas = notas.map(nota => {
      let fechaFormateada, horaFormateada;

      try {
        // Handle different date formats more robustly
        let fechaToProcess = nota.fecha;

        // Remove time part if present
        if (fechaToProcess && fechaToProcess.includes('T')) {
          fechaToProcess = fechaToProcess.split('T')[0];
        }

        // Validate and parse date
        if (fechaToProcess && fechaToProcess.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const fechaParts = fechaToProcess.split('-');
          const year = parseInt(fechaParts[0], 10);
          const month = parseInt(fechaParts[1], 10) - 1; // Month is 0-indexed
          const day = parseInt(fechaParts[2], 10);

          // Validate date components
          if (year > 1900 && year < 2100 && month >= 0 && month < 12 && day >= 1 && day <= 31) {
            const fechaObj = new Date(year, month, day);

            // Double check the date is valid (handles Feb 30, etc.)
            if (fechaObj.getFullYear() === year && fechaObj.getMonth() === month && fechaObj.getDate() === day) {
              fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
            } else {
              fechaFormateada = fechaToProcess; // Use original if invalid
            }
          } else {
            fechaFormateada = fechaToProcess; // Use original if out of range
          }
        } else {
          // If date doesn't match expected format, try to parse it directly
          const directParse = new Date(fechaToProcess);
          if (!isNaN(directParse.getTime())) {
            fechaFormateada = directParse.toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } else {
            fechaFormateada = fechaToProcess || 'Fecha no válida';
          }
        }
      } catch (error) {
        console.error('Error formatting date:', error);
        fechaFormateada = nota.fecha || 'Fecha no válida';
      }

      // Format time
      try {
        horaFormateada = nota.hora ? nota.hora.substring(0, 5) : '00:00';
      } catch (error) {
        horaFormateada = '00:00';
      }

      return {
        ...nota,
        fechaFormateada,
        horaFormateada
      };
    }).sort((a, b) => {
      try {
        const fechaA = new Date(a.fecha + 'T' + (a.hora || '00:00'));
        const fechaB = new Date(b.fecha + 'T' + (b.hora || '00:00'));
        return fechaA - fechaB;
      } catch (error) {
        return 0;
      }
    });

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
            .page {
              min-height: 100vh;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            .ruled-lines {
              background-image: repeating-linear-gradient(
                transparent,
                transparent 12px,
                #eee 12px,
                #eee 13px
              );
              min-height: 30px;
              padding: 2px;
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
            .patient-info h3 {
              margin: 0 0 10px 0;
              color: #0F766E;
              font-size: 14px;
            }
            .info-row {
              display: flex;
              margin-bottom: 5px;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
              flex-shrink: 0;
            }
            .notes-section {
              margin-top: 20px;
            }
            .note-item {
              border: 1px solid #dee2e6;
              margin-bottom: 15px;
              border-radius: 5px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .note-header {
              background: #0F766E;
              color: white;
              padding: 8px 12px;
              font-weight: bold;
              font-size: 11px;
            }
            .note-content {
              padding: 12px;
            }
            .note-section {
              margin-bottom: 10px;
            }
            .note-section label {
              font-weight: bold;
              color: #333;
              display: block;
              margin-bottom: 3px;
            }
            .note-section div {
              margin-left: 10px;
              color: #555;
            }
            .footer {
              margin-top: 30px;
              border-top: 1px solid #333;
              padding-top: 15px;
              page-break-inside: avoid;
            }
            .signature-section {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 40px;
              padding-top: 5px;
              font-size: 10px;
            }
            .print-info {
              text-align: right;
              font-size: 10px;
              color: #666;
              margin-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
              .patient-info { page-break-after: avoid; }
              .note-item { page-break-inside: avoid; }
              .footer { page-break-before: avoid; }
            }
          </style>
          <style>
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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SISTEMA HOSPITALARIO</h1>
            <h2>NOTAS DE ENFERMERÍA</h2>
          </div>

          <div class="patient-info">
            <h3>INFORMACIÓN DEL PACIENTE</h3>
            <div class="info-row">
              <span class="info-label">Expediente:</span>
              <span>${paciente?.numero_expediente || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span>${paciente?.nombre || ''} ${paciente?.apellidos || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Nacimiento:</span>
              <span>${paciente?.fecha_nacimiento ? (() => {
                const fecha = new Date(paciente.fecha_nacimiento + 'T00:00:00');
                return fecha.toLocaleDateString('es-ES');
              })() : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo de Sangre:</span>
              <span>${paciente?.tipo_sangre || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tipo de Paciente:</span>
              <span class="text-capitalize">${paciente?.tipo_paciente || 'N/A'}</span>
            </div>
            ${paciente?.cuarto_asignado ? `
            <div class="info-row">
              <span class="info-label">Cuarto:</span>
              <span>${paciente.cuarto_asignado}</span>
            </div>
            ` : ''}
            ${paciente?.peso ? `
            <div class="info-row">
              <span class="info-label">Peso:</span>
              <span>${paciente.peso} kg</span>
            </div>
            ` : ''}
            ${paciente?.estatura ? `
            <div class="info-row">
              <span class="info-label">Estatura:</span>
              <span>${paciente.estatura} m</span>
            </div>
            ` : ''}
          </div>

          <div class="form-header" style="border: 2px solid #000; padding: 10px; margin: 20px 0;">
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
              <tr style="border-top: 1px solid #000;">
                <td style="border-right: 1px solid #000; padding-right: 10px; padding-top: 5px;">
                  <strong>Sala:</strong> ${paciente?.cuarto_asignado || '_____________'}&nbsp;&nbsp;&nbsp;&nbsp;
                  <strong>Cuarto:</strong> ${paciente?.unidad_cama || '_____________'}
                </td>
                <td style="padding-left: 10px; padding-top: 5px; text-align: center;">
                  <strong>No. Cédula:</strong><br>
                  ${paciente?.documento_identidad || '_____________'}
                </td>
              </tr>
            </table>
          </div>

          <div class="notes-section">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000;">
                  <th style="border-right: 1px solid #000; padding: 5px; width: 10%; text-align: center; font-size: 10px;">Fecha</th>
                  <th style="border-right: 1px solid #000; padding: 5px; width: 7%; text-align: center; font-size: 10px;">Hora</th>
                  <th style="border-right: 1px solid #000; padding: 5px; width: 63%; text-align: center; font-size: 10px;">Observaciones y Cuidados de Enfermería</th>
                  <th style="padding: 5px; width: 20%; text-align: center; font-size: 10px;">Nombre</th>
                </tr>
              </thead>
              <tbody>
                ${notasFormateadas.map((nota) => {
                  // Limpiar observaciones: máximo 2 enters consecutivos
                  let observacionesLimpias = '';
                  if (nota.observaciones) {
                    observacionesLimpias = nota.observaciones
                      .replace(/\n{3,}/g, '\n\n')  // Máximo 2 enters
                      .replace(/\s{2,}/g, ' ')     // Simplificar espacios múltiples
                      .trim();
                  }

                  // Format date for table display
                  let fechaMostrar = nota.fechaFormateada;
                  try {
                    if (nota.fecha) {
                      let fechaToProcess = nota.fecha;

                      // Remove time part if present
                      if (fechaToProcess && fechaToProcess.includes('T')) {
                        fechaToProcess = fechaToProcess.split('T')[0];
                      }

                      // Parse date correctly
                      if (fechaToProcess && fechaToProcess.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const fechaParts = fechaToProcess.split('-');
                        const year = parseInt(fechaParts[0], 10);
                        const month = parseInt(fechaParts[1], 10) - 1;
                        const day = parseInt(fechaParts[2], 10);

                        if (year > 1900 && year < 2100 && month >= 0 && month < 12 && day >= 1 && day <= 31) {
                          const fechaObj = new Date(year, month, day);
                          if (fechaObj.getFullYear() === year && fechaObj.getMonth() === month && fechaObj.getDate() === day) {
                            fechaMostrar = fechaObj.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            });
                          }
                        }
                      }
                    }
                  } catch (error) {
                    console.error('Error formatting date for table:', error);
                  }

                  return `
                    <tr style="border-bottom: 1px solid #000;">
                      <td style="border: 1px solid #000; padding: 5px; vertical-align: top; text-align: center; font-size: 9px;">
                        ${fechaMostrar}
                      </td>
                      <td style="border: 1px solid #000; padding: 5px; vertical-align: top; text-align: center; font-size: 9px;">
                        ${nota.horaFormateada}
                      </td>
                      <td style="border: 1px solid #000; padding: 5px; vertical-align: top; font-size: 9px; line-height: 1.3;">
                        ${observacionesLimpias.replace(/\n/g, '<br>')}
                      </td>
                      <td style="border: 1px solid #000; padding: 5px; vertical-align: top; text-align: center; font-size: 8px;">
                        <div style="min-height: 30px;">
                          ${nota.enfermero_nombre} ${nota.enfermero_apellidos}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}

                <!-- Líneas adicionales para llenar la página si es necesario -->
                ${Array(Math.max(15 - notasFormateadas.length, 0)).fill().map(() => `
                  <tr style="border-bottom: 1px solid #000; height: 40px;">
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                    <td style="border: 1px solid #000; padding: 5px; background-image: repeating-linear-gradient(transparent, transparent 12px, #eee 12px, #eee 13px);"></td>
                    <td style="border: 1px solid #000; padding: 5px;"></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer" style="margin-top: 30px; border: 2px solid #000; padding: 10px;">
            <div style="text-align: center; margin-bottom: 10px;">
              <small><strong>TODA NOTA DEBE INCLUIR:</strong> Nombre y apellido del profesional, así como la firma y código</small>
            </div>

            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <div class="row" style="display: flex; justify-content: space-between;">
                <div style="width: 30%; text-align: center;">
                  <p><strong>Total de registros:</strong> ${notas.length}</p>
                  <p><strong>Período:</strong><br>${fechaInicio || 'Inicio'} al ${fechaFin || new Date().toISOString().split('T')[0]}</p>
                </div>

                <div style="width: 65%; display: flex; flex-wrap: wrap; gap: 20px;">
                  ${[...new Set(notasFormateadas.map(nota => nota.enfermero_nombre + ' ' + nota.enfermero_apellidos))].map(enfermero => `
                    <div style="text-align: center; min-width: 150px;">
                      <div style="height: 50px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                      <small>${enfermero}<br>Enfermero(a)</small>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div style="text-align: center; font-size: 8px; color: #666; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 5px;">
              Documento generado automáticamente el ${fechaImpresion}<br>
              Sistema Hospitalario - Notas de Enfermería con carácter legal
            </div>
          </div>
        </body>
      </html>
    `;
  };

  

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Imprimir Notas de Enfermería</h1>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="mb-4">
        <Card.Header>
          <h5>Seleccionar Paciente y Período</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Paciente *</Form.Label>
                <Form.Select
                  value={selectedPaciente}
                  onChange={(e) => setSelectedPaciente(e.target.value)}
                  required
                >
                  <option value="">Seleccionar paciente...</option>
                  {pacientes.map(paciente => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <div className="row">
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicio</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>Fecha Fin</Form.Label>
                <Form.Control
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </Form.Group>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <Button
                variant="primary"
                onClick={fetchNotasPaciente}
                disabled={!selectedPaciente || loading}
                className="me-2"
              >
                {loading ? 'Cargando...' : 'Buscar Notas'}
              </Button>
            </div>
          </div>

          {notas.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="text-center">
                  <Button
                    variant="success"
                    onClick={imprimirPDF}
                    disabled={notas.length === 0}
                    size="lg"
                  >
                    📄 Imprimir PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {notas.length > 0 && (
        <Card>
          <Card.Header>
            <h5>Vista Previa - {notas.length} nota(s) encontrada(s)</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notas.map((nota, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{new Date(nota.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {nota.hora.substring(0, 5)}</strong>
                    <small className="text-muted">
                      {nota.enfermero_nombre} {nota.enfermero_apellidos}
                    </small>
                  </div>
                  <div className="mb-2">
                    <strong>Observaciones:</strong>
                    <div>{nota.observaciones}</div>
                  </div>
                  {nota.medicamentos_administrados && (
                    <div className="mb-2">
                      <strong>Medicamentos:</strong>
                      <div>{nota.medicamentos_administrados}</div>
                    </div>
                  )}
                  {nota.tratamientos && (
                    <div>
                      <strong>Tratamientos:</strong>
                      <div>{nota.tratamientos}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default ImprimirNotas;