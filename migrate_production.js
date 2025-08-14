
const { Pool } = require('pg');

async function migrateProduction() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Starting production database migration...');
    
    // Verify all tables exist
    const tables = [
      'enfermeros', 'pacientes', 'notas_enfermeria', 'medicamentos',
      'medicamentos_paciente', 'fotos_pertenencias', 'fotos_medicamentos',
      'citas_seguimiento', 'signos_vitales', 'pruebas_doping', 'session'
    ];

    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [table]);
      
      if (!result.rows[0].exists) {
        console.error(`Error: Table ${table} does not exist`);
        throw new Error(`Missing table: ${table}`);
      }
    }

    // Add any new columns or indexes needed for production
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_pacientes_expediente ON pacientes(numero_expediente)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas_enfermeria(fecha DESC)`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_signos_fecha ON signos_vitales(fecha_registro DESC)`);
    } catch (error) {
      console.log('Indexes may already exist:', error.message);
    }

    console.log('Production database migration completed successfully');
    await pool.end();
  } catch (error) {
    console.error('Production migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrateProduction();
}

module.exports = migrateProduction;
