
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const app = express();
const port = process.env.PORT || 5001;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/hospital_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all Replit domains and localhost for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      /https:\/\/.*\.replit\.dev$/,
      /https:\/\/.*\.replit\.dev:\d+$/,
      /https:\/\/.*\.repl\.co$/,
      /https:\/\/.*\.repl\.co:\d+$/
    ];
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(pattern => {
      if (typeof pattern === 'string') {
        return pattern === origin;
      } else {
        return pattern.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Initialize database tables
async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found. Please set up a PostgreSQL database in the Database tab.');
    return;
  }
  
  try {
    // Create session table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    
    // Only add primary key if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey') THEN
          ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
        END IF;
      END $$;
    `);
    
    // Create index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // Create enfermeros table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enfermeros (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL,
        clave VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        turno VARCHAR(20) NOT NULL,
        activo BOOLEAN DEFAULT true
      )
    `);

    // Create pacientes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        numero_expediente VARCHAR(20) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        apellidos VARCHAR(100) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        documento_identidad VARCHAR(50) NOT NULL,
        nacionalidad VARCHAR(50) NOT NULL,
        contacto_emergencia_nombre VARCHAR(100),
        contacto_emergencia_telefono VARCHAR(20),
        telefono_principal VARCHAR(20),
        telefono_secundario VARCHAR(20),
        tipo_sangre VARCHAR(5) NOT NULL,
        peso DECIMAL(5,2),
        estatura DECIMAL(3,2),
        padecimientos TEXT,
        informacion_general TEXT,
        tipo_paciente VARCHAR(20) NOT NULL,
        cuarto_asignado VARCHAR(10),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        activo BOOLEAN DEFAULT true
      )
    `);

    // Add peso and estatura columns if they don't exist
    try {
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS peso DECIMAL(5,2)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS estatura DECIMAL(3,2)`);
    } catch (error) {
      // Columns might already exist
    }

    // Create notas_enfermeria table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notas_enfermeria (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        hora TIME NOT NULL,
        paciente_id INTEGER REFERENCES pacientes(id),
        enfermero_id INTEGER REFERENCES enfermeros(id),
        observaciones TEXT NOT NULL,
        medicamentos_administrados TEXT,
        tratamientos TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create medicamentos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        unidad_medida VARCHAR(20),
        activo BOOLEAN DEFAULT true
      )
    `);

    // Create medicamentos_paciente table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicamentos_paciente (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        medicamento_id INTEGER REFERENCES medicamentos(id),
        dosis VARCHAR(50) NOT NULL,
        frecuencia VARCHAR(100) NOT NULL,
        horarios VARCHAR(200),
        indicaciones TEXT,
        fecha_inicio DATE NOT NULL,
        fecha_fin DATE,
        activo BOOLEAN DEFAULT true
      )
    `);

    // Insert default users if they don't exist
    const existingUsers = await pool.query('SELECT codigo FROM enfermeros WHERE codigo IN ($1, $2, $3, $4)', ['admin', 'erick', 'cintia', 'ENF001']);
    const existingCodes = existingUsers.rows.map(row => row.codigo);
    
    const defaultUsers = [
      { codigo: 'admin', clave: 'Admin1965!*', nombre: 'Admin', apellidos: 'Sistema', turno: 'todos' },
      { codigo: 'erick', clave: 'Admin1965!*', nombre: 'Erick', apellidos: 'Usuario', turno: 'mañana' },
      { codigo: 'cintia', clave: 'Admin1965!*', nombre: 'Cintia', apellidos: 'Usuario', turno: 'tarde' },
      { codigo: 'ENF001', clave: '123456', nombre: 'Enfermero', apellidos: 'De Prueba', turno: 'mañana' }
    ];

    for (const user of defaultUsers) {
      if (!existingCodes.includes(user.codigo)) {
        await pool.query(`
          INSERT INTO enfermeros (codigo, clave, nombre, apellidos, turno)
          VALUES ($1, $2, $3, $4, $5)
        `, [user.codigo, user.clave, user.nombre, user.apellidos, user.turno]);
        console.log(`Created user: ${user.codigo}`);
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.enfermero_id) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
};

// Admin-only middleware
const requireAdmin = async (req, res, next) => {
  if (!req.session.enfermero_id) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  try {
    const result = await pool.query('SELECT codigo FROM enfermeros WHERE id = $1', [req.session.enfermero_id]);
    if (result.rows.length === 0 || result.rows[0].codigo !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { codigo, clave } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM enfermeros WHERE codigo = $1 AND clave = $2 AND activo = true',
      [codigo, clave]
    );
    
    if (result.rows.length > 0) {
      const enfermero = result.rows[0];
      req.session.enfermero_id = enfermero.id;
      res.json({
        success: true,
        enfermero: {
          id: enfermero.id,
          codigo: enfermero.codigo,
          nombre: enfermero.nombre,
          apellidos: enfermero.apellidos,
          turno: enfermero.turno,
          activo: enfermero.activo
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Código o clave incorrectos'
      });
    }
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/pacientes', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pacientes WHERE activo = true ORDER BY fecha_registro DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes', requireAuth, async (req, res) => {
  try {
    const {
      numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
      nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
      telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
      padecimientos, informacion_general, tipo_paciente, cuarto_asignado
    } = req.body;

    const result = await pool.query(`
      INSERT INTO pacientes (
        numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
        nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
        telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
        padecimientos, informacion_general, tipo_paciente, cuarto_asignado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
      nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
      telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
      padecimientos, informacion_general, tipo_paciente, cuarto_asignado
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/pacientes/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pacienteResult = await pool.query('SELECT * FROM pacientes WHERE id = $1', [id]);
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }

    const notasResult = await pool.query(`
      SELECT n.*, e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM notas_enfermeria n
      JOIN enfermeros e ON n.enfermero_id = e.id
      WHERE n.paciente_id = $1
      ORDER BY n.fecha DESC, n.hora DESC
    `, [id]);

    const medicamentosResult = await pool.query(`
      SELECT mp.*, m.nombre as medicamento_nombre, m.unidad_medida
      FROM medicamentos_paciente mp
      JOIN medicamentos m ON mp.medicamento_id = m.id
      WHERE mp.paciente_id = $1 AND mp.activo = true
    `, [id]);

    res.json({
      paciente: pacienteResult.rows[0],
      notas: notasResult.rows,
      medicamentos: medicamentosResult.rows
    });
  } catch (error) {
    console.error('Error fetching paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/notas', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, 
             p.nombre as paciente_nombre, p.apellidos as paciente_apellidos, p.numero_expediente,
             e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN enfermeros e ON n.enfermero_id = e.id
      ORDER BY n.fecha DESC, n.hora DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/notas', requireAuth, async (req, res) => {
  try {
    const { fecha, hora, paciente_id, observaciones, medicamentos_administrados, tratamientos } = req.body;
    
    const result = await pool.query(`
      INSERT INTO notas_enfermeria (fecha, hora, paciente_id, enfermero_id, observaciones, medicamentos_administrados, tratamientos)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [fecha, hora, paciente_id, req.session.enfermero_id, observaciones, medicamentos_administrados, tratamientos]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating nota:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/medicamentos', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM medicamentos WHERE activo = true ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching medicamentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/medicamentos', requireAuth, async (req, res) => {
  try {
    const { nombre, descripcion, unidad_medida } = req.body;
    
    const result = await pool.query(`
      INSERT INTO medicamentos (nombre, descripcion, unidad_medida)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [nombre, descripcion, unidad_medida]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating medicamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes/:paciente_id/medicamentos', requireAuth, async (req, res) => {
  try {
    const { paciente_id } = req.params;
    const { medicamento_id, dosis, frecuencia, horarios, indicaciones, fecha_inicio, fecha_fin } = req.body;
    
    const result = await pool.query(`
      INSERT INTO medicamentos_paciente (paciente_id, medicamento_id, dosis, frecuencia, horarios, indicaciones, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [paciente_id, medicamento_id, dosis, frecuencia, horarios, indicaciones, fecha_inicio, fecha_fin]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning medicamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// User management routes (admin only)
app.get('/api/admin/usuarios', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, codigo, nombre, apellidos, turno, activo FROM enfermeros ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/admin/usuarios', requireAdmin, async (req, res) => {
  try {
    const { codigo, clave, nombre, apellidos, turno } = req.body;
    
    const result = await pool.query(`
      INSERT INTO enfermeros (codigo, clave, nombre, apellidos, turno)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, codigo, nombre, apellidos, turno, activo
    `, [codigo, clave, nombre, apellidos, turno]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating usuario:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'El código de usuario ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

app.put('/api/admin/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, clave, nombre, apellidos, turno, activo } = req.body;
    
    let query = `
      UPDATE enfermeros 
      SET codigo = $1, nombre = $2, apellidos = $3, turno = $4, activo = $5
    `;
    let params = [codigo, nombre, apellidos, turno, activo, id];
    
    if (clave && clave.trim() !== '') {
      query = `
        UPDATE enfermeros 
        SET codigo = $1, clave = $2, nombre = $3, apellidos = $4, turno = $5, activo = $6
        WHERE id = $7
        RETURNING id, codigo, nombre, apellidos, turno, activo
      `;
      params = [codigo, clave, nombre, apellidos, turno, activo, id];
    } else {
      query += ` WHERE id = $6 RETURNING id, codigo, nombre, apellidos, turno, activo`;
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/admin/usuarios/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting admin user
    const adminCheck = await pool.query('SELECT codigo FROM enfermeros WHERE id = $1', [id]);
    if (adminCheck.rows.length > 0 && adminCheck.rows[0].codigo === 'admin') {
      return res.status(400).json({ error: 'No se puede eliminar el usuario administrador' });
    }
    
    const result = await pool.query('UPDATE enfermeros SET activo = false WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario desactivado correctamente' });
  } catch (error) {
    console.error('Error deactivating usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    res.json({ message: 'API server running. Please access the React app on port 3001.' });
  }
});

// Start server
initDatabase().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
});
