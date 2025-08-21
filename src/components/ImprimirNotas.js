import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';

function ImprimirNotas() {
  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Set default dates: yesterday to today
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const [fechaInicio, setFechaInicio] = useState(yesterday.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(today.toISOString().split('T')[0]);
  const [formatoImpresion] = useState('con-lineas'); // Only official format

  useEffect(() => {
    console.log('Componente ImprimirNotas montado, cargando pacientes...');
    fetchPacientes();
  }, []);

  // Validate dates
  useEffect(() => {
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setError('La fecha de inicio no puede ser mayor que la fecha de fin');
    } else if (error && error.includes('La fecha de inicio no puede ser mayor que la fecha de fin')) {
      // Clear the error if dates are corrected
      setError('');
    }
  }, [fechaInicio, fechaFin, error]);

  const fetchPacientes = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get('/api/pacientes');
      console.log('Pacientes cargados:', response.data);
      setPacientes(response.data || []);

      // Clear any previous errors if successful
      if (error && error.includes('Error al cargar pacientes')) {
        setError('');
      }
    } catch (error) {
      console.error('Error fetching pacientes:', error);
      setError(`Error al cargar pacientes: ${error.response?.data?.error || error.message}`);
      setPacientes([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const generateSampleNotes = () => {
    const sampleNotes = [];
    const baseDate = new Date();

    // Generar 35 notas para asegurar múltiples páginas
    for (let i = 0; i < 35; i++) {
      const noteDate = new Date(baseDate);
      noteDate.setDate(baseDate.getDate() - Math.floor(i / 8)); // Diferentes días

      const hora = String(8 + (i % 12)).padStart(2, '0') + ':' + String((i * 15) % 60).padStart(2, '0');

      const observaciones = [
        'Paciente estable, signos vitales dentro de parámetros normales. Presión arterial 120/80, frecuencia cardíaca 72 lpm, temperatura 36.5°C.',
        'Control de glucemia realizado. Resultado: 110 mg/dl. Administración de medicamentos según protocolo establecido.',
        'Paciente refiere dolor leve en zona quirúrgica. Escala EVA 3/10. Se administra analgésico según prescripción médica.',
        'Curación de herida quirúrgica realizada. Aspecto limpio, sin signos de infección. Bordes bien aproximados.',
        'Movilización del paciente asistida. Realiza ejercicios respiratorios y de extremidades inferiores sin complicaciones.',
        'Control de diuresis. Volumen urinario adecuado, características normales. Balance hídrico equilibrado.',
        'Administración de antibiótico endovenoso según prescripción. Paciente tolera medicación sin reacciones adversas.',
        'Paciente presenta náuseas leves. Se administra antiemético. Mejora sintomatología posterior a administración.',
        'Control de signos vitales: PA 110/70, FC 68 lpm, FR 18 rpm, T° 36.8°C. Saturación de oxígeno 98%.',
        'Higiene corporal realizada. Cambio de ropa de cama y personal. Paciente colaborador durante el procedimiento.',
        'Educación sanitaria proporcionada sobre cuidados post-operatorios. Paciente y familia comprenden indicaciones.',
        'Control de herida operatoria. Sin signos de sangrado ni secreciones. Apósito limpio y seco.',
        'Paciente deambula con asistencia. Tolera actividad física progresiva según indicaciones fisioterapéuticas.',
        'Administración de medicamentos por vía oral. Paciente acepta medicación y dieta prescrita sin dificultad.',
        'Monitorización continua de estado general. Paciente consciente, orientado, cooperador durante la atención.',
        'Control de acceso vascular periférico. Permeable, sin signos de flebitis. Curación de sitio de inserción.',
        'Evaluación del dolor mediante escala visual analógica. Paciente refiere EVA 2/10, dolor tolerable.',
        'Fisioterapia respiratoria realizada. Paciente ejecuta ejercicios correctamente, buena expansión torácica.',
        'Control de alimentación. Paciente acepta dieta blanda, tolerancia digestiva adecuada, sin náuseas ni vómitos.',
        'Preparación para procedimiento diagnóstico. Ayuno cumplido, consentimiento informado firmado.',
        'Post-procedimiento: Paciente estable, sin complicaciones inmediatas. Monitorización estrecha continuada.',
        'Cambio de posición cada 2 horas para prevención de úlceras por presión. Piel íntegra, bien hidratada.',
        'Control neurológico: Paciente consciente, orientado en tiempo, espacio y persona. Reflejos conservados.',
        'Administración de terapia intravenosa. Velocidad de infusión según prescripción, balance controlado.',
        'Higiene oral realizada. Estado bucal adecuado, mucosas hidratadas, sin lesiones aparentes.',
        'Evaluación de la cicatrización. Herida en proceso de epitelización, bordes aproximados, sin dehiscencia.',
        'Control de temperatura corporal. Afebril durante turno, medidas de confort implementadas.',
        'Paciente refiere mejoría en estado general. Ánimo positivo, colabora activamente en su recuperación.',
        'Administración de oxigenoterapia según prescripción. Saturación mantenida en parámetros óptimos.',
        'Control de peso corporal. Mantiene peso estable, estado nutricional dentro de parámetros normales.',
        'Evaluación psicoemocional. Paciente tranquilo, colaborador, acepta indicaciones del personal sanitario.',
        'Preparación para el alta hospitalaria. Educación sobre cuidados domiciliarios y seguimiento ambulatorio.',
        'Control de glicemia capilar pre y post prandial. Valores dentro del rango terapéutico establecido.',
        'Movilización articular pasiva y activa asistida. Mantiene rango de movimiento, sin contracturas.',
        'Evaluación del patrón del sueño. Paciente descansa adecuadamente durante período nocturno.'
      ];

      sampleNotes.push({
        id: i + 1000,
        fecha: noteDate.toISOString().split('T')[0],
        hora: hora,
        observaciones: observaciones[i % observaciones.length],
        enfermero_nombre: ['María', 'José', 'Ana', 'Carlos', 'Lucía', 'Pedro'][i % 6],
        enfermero_apellidos: ['González', 'Rodríguez', 'López', 'Martínez', 'Hernández', 'García'][i % 6],
        medicamentos_administrados: i % 3 === 0 ? 'Paracetamol 500mg, Ibuprofeno 400mg' : '',
        tratamientos: i % 4 === 0 ? 'Fisioterapia respiratoria, movilización asistida' : ''
      });
    }

    return sampleNotes;
  };

  const fetchNotasPaciente = async () => {
    if (!selectedPaciente) {
      setError('Por favor seleccione un paciente');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Buscando notas para paciente:', selectedPaciente);
      const response = await axios.get(`/api/pacientes/${selectedPaciente}`);

      if (!response.data || !response.data.notas) {
        // If patient data exists but no notes array, treat as no notes found.
        // If patient data doesn't exist at all, the previous error would have been caught.
        setNotas([]);
        console.log('No se encontraron notas para el paciente.');
      } else {
        let notasFiltradas = response.data.notas || [];
        console.log('Notas encontradas:', notasFiltradas.length);

        // Filtrar por fechas si se especifican
        if (fechaInicio) {
          notasFiltradas = notasFiltradas.filter(nota => nota.fecha >= fechaInicio);
        }
        if (fechaFin) {
          notasFiltradas = notasFiltradas.filter(nota => nota.fecha <= fechaFin);
        }

        console.log('Notas después del filtro:', notasFiltradas.length);

        // Si hay pocas notas, agregar datos de prueba para demostrar el formato
        // THIS IS THE LINE THAT NEEDS TO BE FIXED
        // if (notasFiltradas.length < 5) {
        //   console.log('Agregando notas de ejemplo para demostración');
        //   const sampleNotes = generateSampleNotes();
        //   notasFiltradas = [...notasFiltradas, ...sampleNotes];
        // }

        setNotas(notasFiltradas);
      }

    } catch (error) {
      console.error('Error fetching patient notes:', error);
      if (error.response && error.response.status === 404) {
        setError('Paciente no encontrado');
        setNotas([]);
      } else {
        setError(`Error al cargar notas del paciente: ${error.response?.data?.error || error.message}`);
        setNotas([]);
      }
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
    if (!paciente) {
      setError('Información del paciente no encontrada para imprimir.');
      return;
    }

    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Por favor, permita las ventanas emergentes para imprimir.');
      return;
    }
    const printContent = generatePrintHTML(paciente, notas);

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Esperar a que se cargue el contenido y luego imprimir
    printWindow.onload = () => {
      printWindow.print();
      // Close the print window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000); // Give it a moment to ensure print dialog is shown
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
              .note-item {
                page-break-inside: avoid;
              }
              .footer {
                page-break-before: avoid;
                page-break-inside: avoid;
              }
              .notes-section {
                page-break-inside: auto;
              }
            }
          </style>
          <style>
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
            .notes-section table {
              border: 2px solid #000;
              border-collapse: collapse;
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
                ${notasFormateadas.map((nota, index) => {
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

                  // Determine if this is the last row to add bottom border
                  const isLastRow = index === notasFormateadas.length - 1;
                  const bottomBorder = isLastRow ? 'border-bottom: 1px solid #000;' : '';

                  return `
                    <tr>
                      <td style="border-left: 1px solid #000; border-right: 1px solid #000; ${bottomBorder} padding: 5px; vertical-align: top; text-align: center; font-size: 9px;">
                        ${fechaMostrar}
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

            <div style="text-align: center; font-size: 8px; color: #666; margin-top: 15px; padding-top: 5px;">
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
                  onChange={(e) => {
                    setSelectedPaciente(e.target.value);
                    setNotas([]); // Clear notes when patient changes
                    setError(''); // Clear error when patient changes
                  }}
                  required
                  disabled={pacientes.length === 0 && initialLoading}
                >
                  <option value="">
                    {pacientes.length === 0 && initialLoading
                      ? "Cargando pacientes..."
                      : pacientes.length === 0 && !initialLoading && !error
                        ? "No hay pacientes disponibles"
                        : pacientes.length === 0 && error && error.includes("pacientes")
                          ? "Error al cargar pacientes"
                          : "Seleccionar paciente..."
                    }
                  </option>
                  {pacientes.map(paciente => (
                    <option key={paciente.id} value={paciente.id}>
                      {paciente.numero_expediente} - {paciente.nombre} {paciente.apellidos}
                    </option>
                  ))}
                </Form.Select>
                {pacientes.length === 0 && initialLoading && (
                  <Form.Text className="text-muted">
                    Cargando lista de pacientes...
                  </Form.Text>
                )}
                {pacientes.length > 0 && (
                  <Form.Text className="text-muted">
                    {pacientes.length} paciente(s) disponible(s)
                  </Form.Text>
                )}
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
            <div className="col-md-3 d-flex align-items-end">
              <Button
                variant="primary"
                onClick={fetchNotasPaciente}
                disabled={!selectedPaciente || loading}
                className="mb-3"
              >
                {loading ? 'Cargando...' : 'Buscar Notas'}
              </Button>
            </div>
            <div className="col-md-3 d-flex align-items-end justify-content-end">
              {notas.length > 0 && (
                <Button
                  variant="success"
                  onClick={imprimirPDF}
                  disabled={notas.length === 0}
                  size="lg"
                  className="mb-3"
                >
                  📄 Imprimir PDF
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>

      {notas.length > 0 ? (
        <Card>
          <Card.Header>
            <h5>Vista Previa - {notas.length} nota(s) encontrada(s) del paciente seleccionado</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notas.map((nota, index) => (
                <div key={index} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>{nota.fechaFormateada || (nota.fecha ? new Date(nota.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A')} - {nota.horaFormateada || (nota.hora ? nota.hora.substring(0, 5) : 'N/A')}</strong>
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
      ) : selectedPaciente && !loading && (
        <Card>
          <Card.Header>
            <h5>Sin notas encontradas</h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              No se encontraron notas para el paciente seleccionado en el período especificado.
              <br />
              <small>
                <strong>Período:</strong> {fechaInicio || 'Sin fecha inicio'} al {fechaFin || 'Sin fecha fin'}
              </small>
            </Alert>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}

export default ImprimirNotas;