
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Table } from 'react-bootstrap';
import axios from 'axios';

function ImprimirNotas() {
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

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

    // Agrupar notas por fecha para mejor organización
    const notasPorFecha = notas.reduce((acc, nota) => {
      const fecha = nota.fecha;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(nota);
      return acc;
    }, {});

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Notas de Enfermería - ${paciente?.nombre} ${paciente?.apellidos}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 15mm;
              font-size: 11px;
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
                transparent 18px,
                #ccc 18px,
                #ccc 19px
              );
              min-height: 400px;
              padding: 5px;
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
              <span>${paciente?.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString('es-ES') : 'N/A'}</span>
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
                  <th style="border-right: 1px solid #000; padding: 8px; width: 12%; text-align: center;">Fecha</th>
                  <th style="border-right: 1px solid #000; padding: 8px; width: 8%; text-align: center;">Hora</th>
                  <th style="border-right: 1px solid #000; padding: 8px; width: 60%; text-align: center;">Observaciones y Cuidados de Enfermería</th>
                  <th style="padding: 8px; width: 20%; text-align: center;">Nombre y Firma</th>
                </tr>
              </thead>
              <tbody>
                ${Object.keys(notasPorFecha).sort().map(fecha => 
                  notasPorFecha[fecha].map((nota, index) => `
                    <tr style="border-bottom: 1px solid #000; min-height: 80px;">
                      <td style="border-right: 1px solid #000; padding: 8px; vertical-align: top; text-align: center;">
                        ${index === 0 ? fecha.split('-').reverse().join('/') : ''}
                      </td>
                      <td style="border-right: 1px solid #000; padding: 8px; vertical-align: top; text-align: center;">
                        ${nota.hora}
                      </td>
                      <td style="border-right: 1px solid #000; padding: 8px; vertical-align: top;">
                        <div class="ruled-lines">
                          <strong>OBSERVACIONES:</strong><br>
                          ${nota.observaciones || ''}<br><br>
                          ${nota.medicamentos_administrados ? `<strong>MEDICAMENTOS:</strong><br>${nota.medicamentos_administrados}<br><br>` : ''}
                          ${nota.tratamientos ? `<strong>TRATAMIENTOS:</strong><br>${nota.tratamientos}<br>` : ''}
                        </div>
                      </td>
                      <td style="padding: 8px; vertical-align: top; text-align: center;">
                        <div style="height: 60px; display: flex; flex-direction: column; justify-content: space-between;">
                          <div style="font-size: 10px;">
                            ${nota.enfermero_nombre} ${nota.enfermero_apellidos}
                          </div>
                          <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 2px; font-size: 8px;">
                            Firma
                          </div>
                        </div>
                      </td>
                    </tr>
                  `).join('')
                ).join('')}
                
                <!-- Líneas vacías para completar la hoja -->
                ${Array(Math.max(10 - notas.length, 0)).fill().map(() => `
                  <tr style="border-bottom: 1px solid #000; height: 80px;">
                    <td style="border-right: 1px solid #000; padding: 8px;"></td>
                    <td style="border-right: 1px solid #000; padding: 8px;"></td>
                    <td style="border-right: 1px solid #000; padding: 8px;">
                      <div class="ruled-lines"></div>
                    </td>
                    <td style="padding: 8px;"></td>
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
                  ${[...new Set(notas.map(nota => nota.enfermero_nombre + ' ' + nota.enfermero_apellidos))].map(enfermero => `
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
              <Button
                variant="success"
                onClick={imprimirPDF}
                disabled={notas.length === 0}
              >
                📄 Imprimir PDF
              </Button>
            </div>
          </div>
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
                    <strong>{nota.fecha} - {nota.hora}</strong>
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
