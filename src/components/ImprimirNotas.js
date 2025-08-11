
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

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Notas de Enfermería - ${paciente?.nombre} ${paciente?.apellidos}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
              line-height: 1.4;
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

          <div class="notes-section">
            <h3 style="color: #0F766E; border-bottom: 1px solid #0F766E; padding-bottom: 5px;">NOTAS DE ENFERMERÍA</h3>
            
            ${notas.map(nota => `
              <div class="note-item">
                <div class="note-header">
                  ${nota.fecha} - ${nota.hora} | Enfermero(a): ${nota.enfermero_nombre} ${nota.enfermero_apellidos}
                </div>
                <div class="note-content">
                  <div class="note-section">
                    <label>OBSERVACIONES:</label>
                    <div>${nota.observaciones || 'N/A'}</div>
                  </div>
                  
                  ${nota.medicamentos_administrados ? `
                  <div class="note-section">
                    <label>MEDICAMENTOS ADMINISTRADOS:</label>
                    <div>${nota.medicamentos_administrados}</div>
                  </div>
                  ` : ''}
                  
                  ${nota.tratamientos ? `
                  <div class="note-section">
                    <label>TRATAMIENTOS:</label>
                    <div>${nota.tratamientos}</div>
                  </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p><strong>Total de notas:</strong> ${notas.length}</p>
            <p><strong>Período:</strong> ${fechaInicio || 'Desde el inicio'} ${fechaFin ? 'hasta ' + fechaFin : 'hasta la fecha'}</p>
            
            <div class="signature-section">
              ${[...new Set(notas.map(nota => `${nota.enfermero_nombre} ${nota.enfermero_apellidos}`))].map(enfermero => `
                <div class="signature-box">
                  <div class="signature-line">
                    ${enfermero}<br>
                    Enfermero(a)
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div class="print-info">
              Documento generado el ${fechaImpresion}
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
