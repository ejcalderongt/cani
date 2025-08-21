
const axios = require('axios');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addUsers() {
  try {
    console.log('Agregando usuarios mynor y nohemi...');

    const hashedPassword = await bcrypt.hash('abc123', 10);

    const newUsers = [
      {
        codigo: 'mynor',
        clave: hashedPassword,
        nombre: 'Mynor',
        apellidos: 'Usuario',
        turno: 'mañana',
        activo: true,
        debe_cambiar_clave: true,
        primer_login: true,
        rol: 'enfermero',
        can_manage_billing: false
      },
      {
        codigo: 'nohemi',
        clave: hashedPassword,
        nombre: 'Nohemi',
        apellidos: 'Usuario',
        turno: 'tarde',
        activo: true,
        debe_cambiar_clave: true,
        primer_login: true,
        rol: 'enfermero',
        can_manage_billing: false
      }
    ];

    for (const user of newUsers) {
      try {
        // Check if user already exists
        const existingUser = await pool.query('SELECT codigo FROM enfermeros WHERE codigo = $1', [user.codigo]);
        
        if (existingUser.rows.length > 0) {
          console.log(`Usuario ${user.codigo} ya existe. Actualizando...`);
          
          await pool.query(`
            UPDATE enfermeros 
            SET clave = $1, nombre = $2, apellidos = $3, turno = $4, activo = $5, 
                debe_cambiar_clave = $6, primer_login = $7, rol = $8, can_manage_billing = $9
            WHERE codigo = $10
          `, [
            user.clave, user.nombre, user.apellidos, user.turno, user.activo,
            user.debe_cambiar_clave, user.primer_login, user.rol, user.can_manage_billing,
            user.codigo
          ]);
        } else {
          console.log(`Creando usuario ${user.codigo}...`);
          
          await pool.query(`
            INSERT INTO enfermeros (codigo, clave, nombre, apellidos, turno, activo, debe_cambiar_clave, primer_login, rol, can_manage_billing)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            user.codigo, user.clave, user.nombre, user.apellidos, user.turno,
            user.activo, user.debe_cambiar_clave, user.primer_login, user.rol, user.can_manage_billing
          ]);
        }
        
        console.log(`✓ Usuario ${user.codigo} procesado correctamente`);
      } catch (userError) {
        console.error(`Error procesando usuario ${user.codigo}:`, userError.message);
      }
    }

    console.log('\n¡Usuarios agregados exitosamente!');
    console.log('Credenciales de acceso:');
    console.log('- mynor / abc123 (deberá cambiar contraseña en primer login)');
    console.log('- nohemi / abc123 (deberá cambiar contraseña en primer login)');

  } catch (error) {
    console.error('Error agregando usuarios:', error);
  } finally {
    process.exit();
  }
}

addUsers();
