
import axios from 'axios';

// Configurar axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

const testPatientData = {
  numero_expediente: 'EXP12345',
  nombre: 'Juan Carlos',
  apellidos: 'Pérez González',
  fecha_nacimiento: '1985-03-15',
  sexo: 'masculino',
  documento_identidad: '001-150385-1023N',
  nacionalidad: 'Nicaragüense',
  contacto_emergencia_nombre: 'María González',
  contacto_emergencia_telefono: '8888-1234',
  telefono_principal: '8777-5678',
  telefono_secundario: '8666-9012',
  tipo_sangre: 'O+',
  peso: 75.5,
  estatura: 1.75,
  padecimientos: 'Adicción a sustancias psicoactivas',
  informacion_general: 'Paciente en proceso de rehabilitación',
  tipo_paciente: 'interno',
  cuarto_asignado: 'HAB-101',
  fecha_ingreso: '2025-01-10T08:30:00',
  motivo_ingreso: 'desintoxicacion',
  fase_tratamiento: 'fase_1',
  unidad_cama: 'Cama A',
  medico_tratante: 'Dr. Roberto Martínez',
  equipo_tratante: 'Equipo Alpha',
  riesgo_suicidio: false,
  riesgo_violencia: false,
  riesgo_fuga: true,
  riesgo_caidas: false
};

async function testPatientCreation() {
  try {
    console.log('Testing patient creation endpoint...');
    console.log('Data to send:', JSON.stringify(testPatientData, null, 2));
    
    const response = await axios.post('/api/pacientes', testPatientData);
    console.log('✅ Success! Patient created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating patient:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (typeof window === 'undefined') {
  testPatientCreation();
}

export default testPatientCreation;
