
-- Script para insertar datos de ejemplo en el sistema hospitalario

-- Insertar pacientes de ejemplo
INSERT INTO pacientes (
  numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
  nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
  telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
  padecimientos, informacion_general, tipo_paciente, cuarto_asignado,
  sexo, fecha_ingreso, motivo_ingreso, fase_tratamiento, unidad_cama, 
  medico_tratante, equipo_tratante, riesgo_suicidio, riesgo_violencia, 
  riesgo_fuga, riesgo_caidas
) VALUES 
(
  'EXP001', 'Juan Carlos', 'Pérez González', '1985-03-15', '001-150385-1023N',
  'Nicaragüense', 'María González', '8888-1234', '8777-5678', '8666-9012',
  'O+', 75.5, 1.75, 'Adicción a sustancias psicoactivas', 
  'Paciente en proceso de rehabilitación', 'interno', 'HAB-101',
  'Masculino', '2025-01-10 08:30:00', 'desintoxicacion', 'fase_1', 'Cama A',
  'Dr. Roberto Martínez', 'Equipo Alpha', false, false, true, false
),
(
  'EXP002', 'Ana Sofía', 'López Hernández', '1992-07-22', '001-220792-2034M',
  'Nicaragüense', 'Pedro López', '8555-4321', '8444-8765', '8333-2109',
  'A-', 62.0, 1.62, 'Trastorno depresivo mayor con episodios psicóticos',
  'Paciente con historial de autolesiones', 'interno', 'HAB-205',
  'Femenino', '2025-01-08 14:15:00', 'crisis_psiquiatrica', 'fase_2', 'Cama B',
  'Dra. Carmen Silva', 'Equipo Beta', true, false, false, true
),
(
  'EXP003', 'Miguel Ángel', 'Ruiz Medina', '1978-11-08', '001-081178-3045N',
  'Nicaragüense', 'Elena Ruiz', '8222-6789', '8111-3456', '8000-7890',
  'B+', 82.3, 1.80, 'Alcoholismo crónico con cirrosis inicial',
  'Paciente cooperativo en tratamiento', 'externo', NULL,
  'Masculino', '2025-01-12 10:00:00', 'consulta_externa', 'seguimiento', NULL,
  'Dr. Francisco Gómez', 'Equipo Gamma', false, false, false, false
);

-- Insertar notas de enfermería de ejemplo
INSERT INTO notas_enfermeria (
  fecha, hora, paciente_id, enfermero_id, observaciones, 
  medicamentos_administrados, tratamientos
) VALUES 
(
  '2025-01-15', '08:00', 1, 2,
  'Paciente despertó tranquilo. Signos vitales estables. Refiere haber dormido bien durante la noche. Se muestra colaborador con el personal. Presenta buen estado de ánimo. Solicita hablar con su familia.',
  'Lorazepam 2mg vía oral - Administrado a las 06:00 hrs según indicación médica. Omeprazol 20mg vía oral en ayunas.',
  'Terapia grupal programada para las 10:00 hrs. Ejercicios de relajación y respiración. Control de signos vitales cada 4 horas.'
),
(
  '2025-01-15', '14:30', 1, 3,
  'Durante la tarde el paciente participó activamente en la terapia grupal. Mostró buena disposición para compartir sus experiencias. Come adecuadamente. No presenta náuseas ni vómitos. Hidratación oral adecuada.',
  'Vitamina B1 100mg IM - Aplicada en glúteo derecho. Multivitamínico 1 tableta vía oral después del almuerzo.',
  'Continúa con plan de desintoxicación. Próxima evaluación médica programada para mañana. Monitoreo estrecho de síntomas de abstinencia.'
),
(
  '2025-01-15', '22:00', 1, 2,
  'Turno nocturno tranquilo. Paciente cena completamente. Ve televisión en sala común hasta las 21:00 hrs. Se retira a su habitación sin dificultad. Refiere sentirse ansioso pero controlado.',
  'Lorazepam 1mg vía oral a las 21:30 hrs para ansiedad nocturna según protocolo.',
  'Técnicas de relajación aplicadas antes de dormir. Ambiente tranquilo mantenido en habitación. Rondas de supervisión cada 2 horas durante la noche.'
),
(
  '2025-01-15', '09:15', 2, 3,
  'Paciente presenta episodio de llanto al despertar. Refiere pesadillas recurrentes. Signos vitales: TA 110/70, FC 88, FR 18, Temp 36.8°C. Acepta desayuno parcialmente. Se muestra retraída al contacto social.',
  'Sertralina 50mg vía oral después del desayuno. Risperidona 2mg vía oral según indicación psiquiátrica.',
  'Sesión individual con psicólogo programada. Observación estrecha por riesgo suicida. Retiro de objetos potencialmente peligrosos de la habitación.'
),
(
  '2025-01-15', '16:45', 2, 2,
  'Mejoría notable después de sesión terapéutica. Paciente más comunicativa y participativa. Realizó actividades de arte-terapia. Buen apetito durante la merienda. Interactúa positivamente con otras pacientes.',
  'Lorazepam 0.5mg vía oral por ansiedad residual a las 15:30 hrs.',
  'Continúa en observación por riesgo suicida nivel medio. Actividades recreativas supervisadas. Llamada telefónica con familiar autorizada por 10 minutos.'
),
(
  '2025-01-16', '08:30', 3, 4,
  'Paciente acude puntual a cita de seguimiento. Refiere adherencia al tratamiento ambulatorio. Examina físico sin hallazgos significativos. Laboratorios pendientes de resultado. Peso estable.',
  'No medicamentos administrados durante la consulta. Receta renovada para tratamiento domiciliar.',
  'Educación sobre importancia de abstinencia alcohólica. Próxima cita programada en 2 semanas. Referencia a grupo de apoyo AA.'
);

-- Insertar algunos medicamentos adicionales si no existen
INSERT INTO medicamentos (nombre, descripcion, unidad_medida) VALUES
('Lorazepam', 'Ansiolítico benzodiazepina', 'mg'),
('Sertralina', 'Antidepresivo ISRS', 'mg'),
('Risperidona', 'Antipsicótico atípico', 'mg'),
('Vitamina B1 (Tiamina)', 'Suplemento vitamínico', 'mg'),
('Multivitamínico', 'Complejo vitamínico', 'tableta')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar signos vitales de ejemplo
INSERT INTO signos_vitales (
  paciente_id, enfermero_id, presion_sistolica, presion_diastolica,
  saturacion_oxigeno, frecuencia_cardiaca, temperatura, observaciones
) VALUES
(1, 2, 120, 80, 98.5, 72, 36.5, 'Signos vitales normales, paciente estable'),
(2, 3, 110, 70, 99.0, 88, 36.8, 'Ligera taquicardia, relacionada con ansiedad'),
(3, 4, 140, 90, 97.8, 76, 36.4, 'Hipertensión leve, requiere seguimiento');
