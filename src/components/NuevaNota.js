
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function NuevaNota() {
  const [pacientes, setPacientes] = useState([]);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
    paciente_id: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notasExistentes, setNotasExistentes] = useState([]);
  const [notasUsadas, setNotasUsadas] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  // Configuración para hoja carta estándar (basado en análisis del PDF real)
  const NOTAS_POR_HOJA = 10; // Máximo 10 notas por hoja según formato oficial
  const MAX_ENTERS_CONSECUTIVOS = 2;

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await axios.get('/api/pacientes?activos_solo=true');
        setPacientes(response.data);
      } catch (error) {
        console.error('Error al cargar pacientes:', error);
        setError('Error al cargar la lista de pacientes');
      }
    };

    fetchPacientes();
  }, []);

  useEffect(() => {
    if (formData.paciente_id) {
      fetchNotasPaciente();
    }
  }, [formData.paciente_id]);

  useEffect(() => {
    // El conteo se actualiza solo cuando cambia el paciente
    // No necesitamos recalcular en tiempo real por cada carácter
  }, [formData.observaciones]);

  const fetchNotasPaciente = async () => {
    try {
      const response = await axios.get(`/api/pacientes/${formData.paciente_id}`);
      const notas = response.data.notas || [];
      setNotasExistentes(notas);

      // Calcular número de notas del día actual
      const hoy = new Date().toISOString().split('T')[0];
      const notasHoy = notas.filter(nota => nota.fecha === hoy);
      
      setNotasUsadas(notasHoy.length);
    } catch (error) {
      console.error('Error al cargar notas del paciente:', error);
    }
  };

  const calcularPorcentajeHoja = () => {
    return Math.min((notasUsadas / NOTAS_POR_HOJA) * 100, 100);
  };

  const debeImprimir = () => {
    return notasUsadas >= NOTAS_POR_HOJA * 0.8; // 80% de capacidad (8 notas)
  };

  const generarPreview = () => {
    if (!formData.paciente_id) return;
    
    // Crear nueva ventana para el PDF
    const printWindow = window.open('', '_blank');
    
    // Obtener datos del paciente seleccionado
    const pacienteSeleccionado = pacientes.find(p => p.id === parseInt(formData.paciente_id));
    
    if (!pacienteSeleccionado) {
      printWindow.close();
      return;
    }

    // Obtener todas las notas incluyendo la recién guardada
    axios.get(`/api/pacientes/${formData.paciente_id}`)
      .then(response => {
        const todasLasNotas = response.data.notas || [];
        
        // Filtrar notas del día actual
        const hoy = new Date().toISOString().split('T')[0];
        const notasDelDia = todasLasNotas.filter(nota => nota.fecha === hoy);
        
        // Generar el HTML del PDF
        const pdfContent = generatePrintHTML(pacienteSeleccionado, notasDelDia);
        
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Auto-imprimir después de cargar
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      })
      .catch(error => {
        console.error('Error al obtener notas actualizadas:', error);
        printWindow.close();
      });
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
            @page {
              size: letter;
              margin: 15mm;
            }
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 15mm;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              min-height: calc(100vh - 30mm);
              box-sizing: border-box;
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
            .form-header {
              border: 2px solid #000;
              padding: 10px;
              margin: 20px 0;
            }
            .notes-section {
              margin-top: 20px;
            }
            .notes-section table {
              width: 100%;
              border-collapse: collapse;
              border: 2px solid #000;
            }
            .notes-section td {
              border-right: 1px solid #000;
              border-left: 1px solid #000;
              border-bottom: none;
              border-top: none;
              padding: 5px;
              vertical-align: top;
              font-size: 9px;
            }
            .notes-section tbody tr:first-child td {
              border-top: 1px solid #000;
            }
            .notes-section td:first-child {
              border-left: 1px solid #000;
            }
            .notes-section td:last-child {
              border-right: 1px solid #000;
            }
            .footer {
              margin-top: 30px;
              border: 2px solid #000;
              padding: 10px;
            }
            @media print {
              body { 
                margin: 0; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .header { 
                page-break-after: avoid;
                margin-bottom: 15px;
              }
              .patient-info { 
                page-break-after: avoid;
                margin-bottom: 15px;
              }
              .form-header {
                page-break-after: avoid;
                margin-bottom: 15px;
              }
              .notes-section {
                page-break-inside: auto;
              }
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
            <table>
              <thead>
                <tr style="background-color: #f0f0f0; border-bottom: 2px solid #000;">
                  <th style="border-right: 1px solid #000; padding: 5px; width: 10%; text-align: center; font-size: 10px;">Fecha</th>
                  <th style="border-right: 1px solid #000; padding: 5px; width: 7%; text-align: center; font-size: 10px;">Hora</th>
                  <th style="border-right: 1px solid #000; padding: 5px; width: 63%; text-align: center; font-size: 10px;">Observaciones y Cuidados de Enfermería</th>
                  <th style="padding: 5px; width: 20%; text-align: center; font-size: 10px;">Nombre</th>
                </tr>
              </thead>
              <tbody>
                ${notasFormateadas.map((nota, index) => {
                  // Limpiar observaciones: máximo 2 enters consecutivos
                  let observacionesLimpias = '';
                  if (nota.observaciones) {
                    observacionesLimpias = nota.observaciones
                      .replace(/\n{3,}/g, '\n\n')  // Máximo 2 enters
                      .replace(/\s{2,}/g, ' ')     // Simplificar espacios múltiples
                      .trim();
                  }

                  // Determine if this is the last row to add bottom border
                  const isLastRow = index === notasFormateadas.length - 1;
                  const bottomBorder = isLastRow ? 'border-bottom: 1px solid #000;' : '';

                  return `
                    <tr>
                      <td style="border-left: 1px solid #000; border-right: 1px solid #000; ${bottomBorder} padding: 5px; vertical-align: top; text-align: center; font-size: 9px;">
                        ${nota.fechaFormateada}
                      </td>
                      <td style="border-right: 1px solid #000; ${bottomBorder} padding: 5px; vertical-align: top; text-align: center; font-size: 9px;">
                        ${nota.horaFormateada}
                      </td>
                      <td style="border-right: 1px solid #000; ${bottomBorder} padding: 5px; vertical-align: top; font-size: 9px; line-height: 1.3;">
                        ${observacionesLimpias.replace(/\n/g, '<br>')}
                      </td>
                      <td style="border-right: 1px solid #000; ${bottomBorder} padding: 5px; vertical-align: top; text-align: center; font-size: 8px;">
                        <div style="min-height: 30px;">
                          ${nota.enfermero_nombre} ${nota.enfermero_apellidos}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div style="text-align: center; margin-bottom: 10px;">
              <small><strong>TODA NOTA DEBE INCLUIR:</strong> Nombre y apellido del profesional, así como la firma y código</small>
            </div>

            <div style="border-top: 1px solid #000; padding-top: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <div style="width: 30%; text-align: center;">
                  <p><strong>Total de registros:</strong> ${notas.length}</p>
                  <p><strong>Fecha:</strong><br>${new Date().toLocaleDateString('es-ES')}</p>
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

            <div style="text-align: center; font-size: 8px; color: #666; margin-top: 15px; padding-top: 5px;">
              Documento generado automáticamente el ${fechaImpresion}<br>
              Sistema Hospitalario - Notas de Enfermería con carácter legal
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const controlarEnters = (texto) => {
    // Limitar enters consecutivos a máximo 2
    return texto.replace(/\n{3,}/g, '\n\n');
  };

  const handleChange = (e) => {
    let value = e.target.value;
    
    if (e.target.name === 'observaciones') {
      value = controlarEnters(value);
    }
    
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.observaciones.trim()) {
      setError('Las observaciones son obligatorias');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/notas', formData);

      let successMessage = 'Nota registrada exitosamente';
      if (debeImprimir()) {
        successMessage += '. ⚠️ ATENCIÓN: Ya tiene 8+ notas. Se recomienda imprimir la hoja antes de continuar.';
      }

      setSuccess(successMessage);
      setShowPreview(true); // Mostrar opción de previsualización

      // Reset form
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
        paciente_id: formData.paciente_id, // Mantener paciente seleccionado
        observaciones: ''
      });

      // Actualizar conteo de notas
      if (formData.paciente_id) {
        fetchNotasPaciente();
      }
    } catch (error) {
      console.error('Error al registrar nota:', error);
      setError('Error al registrar la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Nueva Nota de Enfermería</h1>

      <Card>
        <Card.Header>
          <h5>Registro de Observaciones</h5>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && (
            <Alert variant={debeImprimir() ? "warning" : "success"} dismissible onClose={() => {setSuccess(''); setShowPreview(false);}}>
              {success}
              {showPreview && (
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="success" 
                    onClick={generarPreview}
                    className="me-2"
                  >
                    📄 Generar PDF con Cambios
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline-primary" 
                    onClick={() => navigate('/imprimir-notas')}
                    className="me-2"
                  >
                    📋 Gestión de Impresión
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline-secondary" 
                    onClick={() => navigate('/notas')}
                  >
                    👁️ Ver Todas las Notas
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {formData.paciente_id && (
            <Card className="mb-3" style={{ backgroundColor: debeImprimir() ? '#fff3cd' : '#e7f3ff' }}>
              <Card.Body className="py-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small><strong>Capacidad de Hoja Carta (máx. 10 notas):</strong></small>
                  <small>{notasUsadas}/{NOTAS_POR_HOJA} notas ({Math.round(calcularPorcentajeHoja())}%)</small>
                </div>
                <ProgressBar
                  now={calcularPorcentajeHoja()}
                  variant={calcularPorcentajeHoja() > 80 ? "danger" : calcularPorcentajeHoja() > 60 ? "warning" : "success"}
                />
                {debeImprimir() && (
                  <Alert variant="warning" className="mt-2 mb-0 py-2">
                    <small>⚠️ <strong>Hoja casi llena</strong> - {notasUsadas} de {NOTAS_POR_HOJA} notas utilizadas</small>
                  </Alert>
                )}
                <div className="text-end mt-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => navigate('/imprimir-notas')}
                    className="me-2"
                  >
                    📄 Imprimir Notas
                  </Button>
                  {notasUsadas > 0 && (
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={generarPreview}
                    >
                      👁️ Preview Hoja
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Hora</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Paciente Activo *</Form.Label>
              <Form.Select
                name="paciente_id"
                value={formData.paciente_id}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar paciente activo...</option>
                {pacientes.map((paciente) => (
                  <option key={paciente.id} value={paciente.id}>
                    {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos} 
                    {paciente.tipo_paciente === 'interno' ? ' (Interno)' : ' (Ambulatorio)'}
                    {paciente.cuarto_asignado ? ` - ${paciente.cuarto_asignado}` : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Solo se muestran pacientes activos (sin fecha de salida)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observaciones *</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                required
                placeholder="Registre aquí las observaciones de enfermería. Máximo 2 enters consecutivos entre párrafos."
                style={{ resize: 'vertical' }}
              />
              <Form.Text className="text-muted">
                Caracteres: {formData.observaciones.length} | 
                Máximo 2 enters consecutivos | 
                Recuerde: máximo 10 notas por hoja carta
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar Nota'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/notas')}
              >
                Cancelar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default NuevaNota;
