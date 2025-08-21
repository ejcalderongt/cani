const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 5000;

console.log(`Starting server on port ${port}`);

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

    // In production, be more restrictive
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        /https:\/\/.*\.replit\.dev$/,
        /https:\/\/.*\.repl\.co$/,
        /https:\/\/.*\.replit\.app$/
      ];

      const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin in production:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development - allow localhost
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5000',
        'http://localhost:5001',
        /https:\/\/.*\.replit\.dev$/,
        /https:\/\/.*\.replit\.dev:\d+$/,
        /https:\/\/.*\.repl\.co$/,
        /https:\/\/.*\.repl\.co:\d+$/,
        /https:\/\/.*\.replit\.app$/,
        /https:\/\/.*\.replit\.app:\d+$/
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
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Add fallback for missing build files
app.use('/static', express.static(path.join(__dirname, 'build/static')));

// Add logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a false temporalmente para debug
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax' // Añadir para mejor compatibilidad
  },
  name: 'hospital.session' // Nombre específico para la sesión
}));

// Initialize database tables
async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found. Please set up a PostgreSQL database in the Database tab.');
    console.log('The app will continue to run but database features will not work.');
    console.log('Go to the Database tab and create a PostgreSQL database to enable full functionality.');
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

    console.log('Session table created/verified successfully');

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
        activo BOOLEAN DEFAULT true,
        debe_cambiar_password BOOLEAN DEFAULT false
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

    // Create fotos_pertenencias table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fotos_pertenencias (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        nombre_archivo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        datos_imagen TEXT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create fotos_medicamentos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fotos_medicamentos (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        nombre_archivo VARCHAR(255) NOT NULL,
        descripcion TEXT,
        datos_imagen TEXT NOT NULL,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create citas_seguimiento table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS citas_seguimiento (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        nombre_doctor VARCHAR(100) NOT NULL,
        fecha_cita DATE NOT NULL,
        hora_cita TIME NOT NULL,
        anotaciones TEXT,
        estado VARCHAR(20) DEFAULT 'programada',
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create configuracion_hospital table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion_hospital (
        id SERIAL PRIMARY KEY,
        nombre_hospital VARCHAR(200) NOT NULL DEFAULT 'Sistema Hospitalario',
        logo_base64 TEXT,
        direccion TEXT,
        telefono VARCHAR(50),
        email VARCHAR(100),
        sitio_web VARCHAR(200),
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default hospital configuration if not exists
    const configExists = await pool.query('SELECT id FROM configuracion_hospital LIMIT 1');
    if (configExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO configuracion_hospital (nombre_hospital, direccion, telefono)
        VALUES ($1, $2, $3)
      `, ['Sistema Hospitalario', '', '']);
    }

    // Add columns to existing tables if they don't exist
    try {
      // Add debe_cambiar_password column to enfermeros
      await pool.query(`ALTER TABLE enfermeros ADD COLUMN IF NOT EXISTS debe_cambiar_password BOOLEAN DEFAULT false`);

      // Add patient columns
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sexo VARCHAR(20)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_ingreso TIMESTAMP`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS motivo_ingreso VARCHAR(100)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fase_tratamiento VARCHAR(50)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS unidad_cama VARCHAR(20)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medico_tratante VARCHAR(100)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS equipo_tratante TEXT`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS riesgo_suicidio BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS riesgo_violencia BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS riesgo_fuga BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS riesgo_caidas BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_salida DATE`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS observaciones_alta TEXT`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS medico_autoriza VARCHAR(100)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS enfermero_autoriza VARCHAR(100)`);
      await pool.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS director_autoriza VARCHAR(100)`);
    } catch (error) {
      // Columns might already exist
    }

    // Create signos_vitales table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signos_vitales (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        enfermero_id INTEGER REFERENCES enfermeros(id),
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        presion_sistolica INTEGER,
        presion_diastolica INTEGER,
        saturacion_oxigeno DECIMAL(4,1),
        frecuencia_cardiaca INTEGER,
        temperatura DECIMAL(3,1),
        observaciones TEXT
      )
    `);

    // Create pruebas_doping table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pruebas_doping (
        id SERIAL PRIMARY KEY,
        paciente_id INTEGER REFERENCES pacientes(id),
        enfermero_id INTEGER REFERENCES enfermeros(id),
        fecha_prueba DATE NOT NULL,
        hora_prueba TIME NOT NULL,
        tipo_muestra VARCHAR(20) NOT NULL, -- 'sangre' o 'orina'
        resultado VARCHAR(20) NOT NULL, -- 'positivo' o 'negativo'
        sustancias_detectadas TEXT,
        observaciones TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add columns for password change requirement if they don't exist
    try {
      await pool.query(`ALTER TABLE enfermeros ADD COLUMN IF NOT EXISTS debe_cambiar_clave BOOLEAN DEFAULT false`);
      await pool.query(`ALTER TABLE enfermeros ADD COLUMN IF NOT EXISTS primer_login BOOLEAN DEFAULT true`);
    } catch (error) {
      // Columns might already exist
    }

    // Create billing settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_settings (
        id SERIAL PRIMARY KEY,
        server_monthly_fee DECIMAL(10,2) DEFAULT 20.00,
        annual_maintenance_fee DECIMAL(10,2) DEFAULT 150.00,
        per_patient_fee DECIMAL(10,2) DEFAULT 10.00,
        currency VARCHAR(3) DEFAULT 'USD',
        prorate_annual_maintenance BOOLEAN DEFAULT true,
        active_patient_rule VARCHAR(50) DEFAULT 'status_active',
        updated_by_user_id INTEGER REFERENCES enfermeros(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        period_year INTEGER NOT NULL,
        period_month INTEGER NOT NULL,
        server_monthly_fee DECIMAL(10,2) NOT NULL,
        annual_maintenance_component DECIMAL(10,2) NOT NULL,
        per_patient_fee DECIMAL(10,2) NOT NULL,
        active_patients_count INTEGER NOT NULL,
        subtotal_components_json TEXT,
        currency VARCHAR(3) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft',
        generated_by_user_id INTEGER REFERENCES enfermeros(id),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(period_year, period_month)
      )
    `);

    // Create billing_audit table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_audit (
        id SERIAL PRIMARY KEY,
        changed_by_user_id INTEGER REFERENCES enfermeros(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        field_name VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        action VARCHAR(20) NOT NULL
      )
    `);

    // Add billing and role columns to enfermeros if they don't exist
    try {
      await pool.query(`ALTER TABLE enfermeros ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'staff'`);
      await pool.query(`ALTER TABLE enfermeros ADD COLUMN IF NOT EXISTS can_manage_billing BOOLEAN DEFAULT false`);
    } catch (error) {
      // Columns might already exist
    }

    // Insert default billing settings if not exists
    const billingSettingsExists = await pool.query('SELECT id FROM billing_settings LIMIT 1');
    if (billingSettingsExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO billing_settings (server_monthly_fee, annual_maintenance_fee, per_patient_fee, currency, prorate_annual_maintenance, active_patient_rule)
        VALUES (20.00, 150.00, 10.00, 'USD', true, 'status_active')
      `);
    }

    // Insert default users if they don't exist
    const existingUsers = await pool.query('SELECT codigo FROM enfermeros WHERE codigo IN ($1, $2, $3, $4)', ['admin', 'erick', 'cintia', 'ENF001']);
    const existingCodes = existingUsers.rows.map(row => row.codigo);

    const defaultUsers = [
      {codigo: 'admin', clave: 'admin123', nombre: 'Admin', apellidos: 'Sistema', turno: 'todos', debe_cambiar_clave: false, primer_login: false, rol: 'admin', can_manage_billing: true },
      {codigo: 'erick', clave: 'abc123', nombre: 'Erick', apellidos: 'Usuario', turno: 'mañana', debe_cambiar_clave: true, primer_login: true, rol: 'enfermero', can_manage_billing: false },
      {codigo: 'cintia', clave: 'abc123', nombre: 'Cintia', apellidos: 'Usuario', turno: 'tarde', debe_cambiar_clave: true, primer_login: true, rol: 'enfermero', can_manage_billing: false },
      {codigo: 'ENF001', clave: 'abc123', nombre: 'Enfermero', apellidos: 'De Prueba', turno: 'mañana', debe_cambiar_clave: true, primer_login: true, rol: 'enfermero', can_manage_billing: false }
    ];

    for (const user of defaultUsers) {
      if (!existingCodes.includes(user.codigo)) {
        // Hash the default password before inserting
        const hashedPassword = await bcrypt.hash(user.clave, 10);
        await pool.query(`
          INSERT INTO enfermeros (codigo, clave, nombre, apellidos, turno, debe_cambiar_clave, primer_login, rol, can_manage_billing)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [user.codigo, hashedPassword, user.nombre, user.apellidos, user.turno, user.debe_cambiar_clave, user.primer_login, user.rol, user.can_manage_billing]);
        console.log(`Created user: ${user.codigo}`);
      }
    }

    // Update admin user to ensure proper configuration
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      UPDATE enfermeros
      SET clave = $1, debe_cambiar_clave = false, primer_login = false, rol = 'admin', can_manage_billing = true
      WHERE codigo = 'admin'
    `, [hashedAdminPassword]);

    // Update existing non-admin users to have default password and require change
    const hashedDefaultPassword = await bcrypt.hash('abc123', 10);
    await pool.query(`
      UPDATE enfermeros
      SET clave = $1, debe_cambiar_clave = true, primer_login = true, rol = COALESCE(rol, 'enfermero'), can_manage_billing = COALESCE(can_manage_billing, false)
      WHERE codigo != 'admin'
    `, [hashedDefaultPassword]);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('Auth check:', {
    sessionExists: !!req.session,
    sessionId: req.session?.id,
    enfermero_id: req.session?.enfermero_id,
    url: req.url,
    cookies: req.headers.cookie,
    userAgent: req.headers['user-agent']
  });

  if (!req.session || !req.session.enfermero_id) {
    console.log('Authentication failed - no valid session or enfermero_id');
    return res.status(401).json({ 
      error: 'No autenticado',
      debug: {
        hasSession: !!req.session,
        hasEnfermeroId: !!(req.session && req.session.enfermero_id)
      }
    });
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
      'SELECT * FROM enfermeros WHERE codigo = $1 AND activo = true',
      [codigo]
    );

    if (result.rows.length > 0) {
      const enfermero = result.rows[0];
      const validPassword = await bcrypt.compare(clave, enfermero.clave);

      if (validPassword) {
        // Check if user needs to change password (except admin)
        if (enfermero.codigo !== 'admin' && (enfermero.debe_cambiar_clave || enfermero.primer_login)) {
          return res.json({
            success: true,
            requiere_cambio_clave: true,
            enfermero: {
              id: enfermero.id,
              codigo: enfermero.codigo,
              nombre: enfermero.nombre,
              apellidos: enfermero.apellidos
            }
          });
        }

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

app.post('/api/cambiar-clave', async (req, res) => {
  try {
    const { codigo, claveActual, nuevaClave } = req.body;

    if (!codigo || !claveActual || !nuevaClave) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // Verify current password
    const userResult = await pool.query('SELECT * FROM enfermeros WHERE codigo = $1', [codigo]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(claveActual, user.clave);

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(nuevaClave, 10);

    await pool.query(
      'UPDATE enfermeros SET clave = $1, debe_cambiar_clave = false, primer_login = false WHERE codigo = $2',
      [hashedNewPassword, codigo]
    );

    // Clear session to force re-login
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
        }
      });
    }

    res.json({
      success: true,
      message: 'Contraseña cambiada correctamente. Por favor inicia sesión nuevamente.'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint for users to change their own password while logged in
app.post('/api/cambiar-mi-clave', requireAuth, async (req, res) => {
  try {
    const { claveActual, nuevaClave } = req.body;

    if (!claveActual || !nuevaClave) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    // Get current user info
    const userResult = await pool.query('SELECT * FROM enfermeros WHERE id = $1', [req.session.enfermero_id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(claveActual, user.clave);

    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(nuevaClave, 10);

    await pool.query(
      'UPDATE enfermeros SET clave = $1, debe_cambiar_clave = false WHERE id = $2',
      [hashedNewPassword, req.session.enfermero_id]
    );

    // Clear session to force re-login
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });

    res.json({
      success: true,
      message: 'Contraseña cambiada correctamente. Por favor inicia sesión nuevamente.'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

app.get('/api/pacientes', requireAuth, async (req, res) => {
  try {
    const { activos_solo } = req.query;
    let query = `SELECT * FROM pacientes`;
    let params = [];

    if (activos_solo === 'true') {
      query += ` WHERE activo = true AND fecha_salida IS NULL`;
    }

    query += ` ORDER BY fecha_ingreso DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes', requireAuth, async (req, res) => {
  try {
    const {
      numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
      nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
      telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
      padecimientos, informacion_general, tipo_paciente, cuarto_asignado,
      sexo, fecha_ingreso, motivo_ingreso, fase_tratamiento, unidad_cama, medico_tratante,
      equipo_tratante, riesgo_suicidio, riesgo_violencia, riesgo_fuga, riesgo_caidas
    } = req.body;

    // Validar campos requeridos
    const requiredFields = [
      'numero_expediente', 'nombre', 'apellidos', 'fecha_nacimiento', 
      'documento_identidad', 'nacionalidad', 'telefono_principal', 'tipo_paciente'
    ];

    for (const field of requiredFields) {
      if (!req.body[field] || req.body[field].toString().trim() === '') {
        return res.status(400).json({ 
          message: `El campo ${field} es obligatorio` 
        });
      }
    }

    // Convertir campos numéricos
    const pesoNum = peso ? parseFloat(peso) : null;
    const estaturaNum = estatura ? parseFloat(estatura) : null;

    // Verificar si el número de expediente ya existe
    const existingPatient = await pool.query(
      'SELECT id FROM pacientes WHERE numero_expediente = $1',
      [numero_expediente]
    );

    if (existingPatient.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Ya existe un paciente con este número de expediente' 
      });
    }

    const result = await pool.query(`
      INSERT INTO pacientes (
        numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
        nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
        telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
        padecimientos, informacion_general, tipo_paciente, cuarto_asignado,
        sexo, fecha_ingreso, motivo_ingreso, fase_tratamiento, unidad_cama, 
        medico_tratante, equipo_tratante, riesgo_suicidio, riesgo_violencia, 
        riesgo_fuga, riesgo_caidas, activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, true)
      RETURNING *
    `, [
      numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
      nacionalidad, contacto_emergencia_nombre || null, contacto_emergencia_telefono || null,
      telefono_principal, telefono_secundario || null, tipo_sangre || null, 
      pesoNum, estaturaNum, padecimientos || null, informacion_general || null, 
      tipo_paciente, cuarto_asignado || null, sexo, 
      fecha_ingreso || new Date().toISOString(), motivo_ingreso || null, 
      fase_tratamiento || null, unidad_cama || null, medico_tratante || null, 
      equipo_tratante || null, riesgo_suicidio || false, riesgo_violencia || false, 
      riesgo_fuga || false, riesgo_caidas || false
    ]);

    res.status(201).json({
      message: 'Paciente creado exitosamente',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Proporcionar mensaje de error más específico
    if (error.code === '23505') { // Duplicate key violation
      return res.status(400).json({ 
        message: 'Ya existe un paciente con este número de expediente o documento de identidad' 
      });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios en el formulario' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error interno del servidor al crear el paciente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
             p.nombre as paciente_nombre,
             p.apellidos as paciente_apellidos,
             p.numero_expediente as paciente_expediente,
             u.nombre as enfermero_nombre,
             u.apellidos as enfermero_apellidos
      FROM notas_enfermeria n
      JOIN pacientes p ON n.paciente_id = p.id
      JOIN enfermeros u ON n.enfermero_id = u.id
      ORDER BY n.fecha DESC, n.hora DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching nursing notes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/notas', requireAuth, async (req, res) => {
  try {
    const {
      fecha,
      hora,
      paciente_id,
      observaciones
    } = req.body;

    // Validar que las observaciones no tengan más de 2 enters consecutivos
    const observacionesLimpias = observaciones.replace(/\n{3,}/g, '\n\n');

    const result = await pool.query(`
      INSERT INTO notas_enfermeria (
        fecha, hora, paciente_id, enfermero_id, observaciones
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [fecha, hora, paciente_id, req.session.enfermero_id, observacionesLimpias]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating nursing note:', error);
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

// Billing permission middleware
const requireBillingAccess = async (req, res, next) => {
  if (!req.session.enfermero_id) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    const result = await pool.query('SELECT codigo, rol, can_manage_billing FROM enfermeros WHERE id = $1', [req.session.enfermero_id]);
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    if (user.rol === 'admin' || user.can_manage_billing) {
      next();
    } else {
      return res.status(403).json({ error: 'Acceso denegado. Requiere permisos de facturación.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Billing settings endpoints (admin only)
app.get('/api/admin/billing-settings', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM billing_settings ORDER BY id LIMIT 1');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuración de facturación no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching billing settings:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/admin/billing-settings', requireAdmin, async (req, res) => {
  try {
    const { server_monthly_fee, annual_maintenance_fee, per_patient_fee, currency, prorate_annual_maintenance, active_patient_rule } = req.body;

    // Get current settings for audit
    const currentSettings = await pool.query('SELECT * FROM billing_settings ORDER BY id LIMIT 1');
    const current = currentSettings.rows[0] || {};

    // Update settings
    const result = await pool.query(`
      UPDATE billing_settings 
      SET server_monthly_fee = $1, annual_maintenance_fee = $2, per_patient_fee = $3, 
          currency = $4, prorate_annual_maintenance = $5, active_patient_rule = $6,
          updated_by_user_id = $7, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [server_monthly_fee, annual_maintenance_fee, per_patient_fee, currency, prorate_annual_maintenance, active_patient_rule, req.session.enfermero_id]);

    // Create audit entries
    const auditEntries = [
      { field: 'server_monthly_fee', old: current.server_monthly_fee, new: server_monthly_fee },
      { field: 'annual_maintenance_fee', old: current.annual_maintenance_fee, new: annual_maintenance_fee },
      { field: 'per_patient_fee', old: current.per_patient_fee, new: per_patient_fee },
      { field: 'currency', old: current.currency, new: currency },
      { field: 'prorate_annual_maintenance', old: current.prorate_annual_maintenance, new: prorate_annual_maintenance },
      { field: 'active_patient_rule', old: current.active_patient_rule, new: active_patient_rule }
    ];

    for (const entry of auditEntries) {
      if (entry.old !== entry.new) {
        await pool.query(`
          INSERT INTO billing_audit (changed_by_user_id, field_name, old_value, new_value, action)
          VALUES ($1, $2, $3, $4, 'UPDATE')
        `, [req.session.enfermero_id, entry.field, String(entry.old), String(entry.new)]);
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating billing settings:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/admin/billing-settings/audit', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ba.*, e.nombre, e.apellidos 
      FROM billing_audit ba
      JOIN enfermeros e ON ba.changed_by_user_id = e.id
      ORDER BY ba.changed_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Billing summary endpoint (requires billing access)
app.get('/api/billing/summary', requireBillingAccess, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    // Get billing settings
    const settingsResult = await pool.query('SELECT * FROM billing_settings ORDER BY id LIMIT 1');
    if (settingsResult.rows.length === 0) {
      return res.status(500).json({ error: 'Configuración de facturación no encontrada' });
    }

    const settings = settingsResult.rows[0];

    // Count active patients for the period
    let activePatients = 0;
    if (settings.active_patient_rule === 'status_active') {
      const activeResult = await pool.query(`
        SELECT COUNT(*) as count 
        FROM pacientes 
        WHERE activo = true 
        AND (fecha_ingreso IS NULL OR DATE_PART('year', fecha_ingreso) <= $1)
        AND (fecha_salida IS NULL OR (DATE_PART('year', fecha_salida) > $1 OR 
             (DATE_PART('year', fecha_salida) = $1 AND DATE_PART('month', fecha_salida) >= $2)))
      `, [year, month]);
      activePatients = parseInt(activeResult.rows[0].count);
    }

    // Calculate costs
    const serverMonthlyFee = parseFloat(settings.server_monthly_fee);
    const perPatientFee = parseFloat(settings.per_patient_fee);
    const annualMaintenanceFee = parseFloat(settings.annual_maintenance_fee);
    const prorateAnnualMaintenance = settings.prorate_annual_maintenance;

    const patientsFeeTotalFee = activePatients * perPatientFee;
    const annualMaintenanceComponent = prorateAnnualMaintenance ? annualMaintenanceFee / 12 : 0;
    
    const total = serverMonthlyFee + patientsFeeTotalFee + annualMaintenanceComponent;

    res.json({
      period: { year: parseInt(year), month: parseInt(month) },
      activePatients,
      components: {
        serverMonthlyFee,
        perPatientFee,
        patientsFeeTotalFee,
        annualMaintenanceComponent,
        prorateAnnualMaintenance
      },
      total,
      currency: settings.currency
    });

  } catch (error) {
    console.error('Error calculating billing summary:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Generate invoice endpoint
app.post('/api/billing/generate', requireBillingAccess, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'Año y mes son requeridos' });
    }

    // Check if invoice already exists
    const existingInvoice = await pool.query(
      'SELECT id FROM invoices WHERE period_year = $1 AND period_month = $2',
      [year, month]
    );

    if (existingInvoice.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un documento para este período' });
    }

    // Get current billing summary
    const summaryResponse = await axios.get(`/api/billing/summary?year=${year}&month=${month}`, {
      headers: { cookie: req.headers.cookie }
    });
    const summary = summaryResponse.data;

    // Create invoice record
    const result = await pool.query(`
      INSERT INTO invoices (
        period_year, period_month, server_monthly_fee, annual_maintenance_component,
        per_patient_fee, active_patients_count, subtotal_components_json,
        currency, total_amount, generated_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      year, month, summary.components.serverMonthlyFee, summary.components.annualMaintenanceComponent,
      summary.components.perPatientFee, summary.activePatients, JSON.stringify(summary.components),
      summary.currency, summary.total, req.session.enfermero_id
    ]);

    res.json({
      message: 'Documento generado correctamente',
      invoice: result.rows[0]
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get invoices endpoint
app.get('/api/billing/invoices', requireBillingAccess, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, e.nombre as generated_by_name, e.apellidos as generated_by_apellidos
      FROM invoices i
      JOIN enfermeros e ON i.generated_by_user_id = e.id
      ORDER BY i.period_year DESC, i.period_month DESC
    `);

    const invoices = result.rows.map(invoice => ({
      ...invoice,
      generated_by_name: `${invoice.generated_by_name} ${invoice.generated_by_apellidos}`
    }));

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Download invoice endpoints
app.get('/api/billing/invoices/:id/download.pdf', requireBillingAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const invoice = result.rows[0];
    
    // Generate simple PDF content (you could use a library like PDFKit for better formatting)
    const pdfContent = `
FACTURACIÓN MENSUAL
Período: ${invoice.period_month}/${invoice.period_year}
Fecha de generación: ${new Date(invoice.generated_at).toLocaleDateString()}

DESGLOSE:
- Cargo fijo del servidor: ${invoice.currency} ${invoice.server_monthly_fee}
- Pacientes activos (${invoice.active_patients_count}): ${invoice.currency} ${(invoice.active_patients_count * invoice.per_patient_fee).toFixed(2)}
- Mantenimiento anual: ${invoice.currency} ${invoice.annual_maintenance_component}

TOTAL: ${invoice.currency} ${invoice.total_amount}
`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=facturacion_${invoice.period_year}_${invoice.period_month.toString().padStart(2, '0')}.pdf`);
    res.send(Buffer.from(pdfContent));

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Error generando PDF' });
  }
});

app.get('/api/billing/invoices/:id/download.csv', requireBillingAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const invoice = result.rows[0];
    
    const csvContent = `Concepto,Cantidad,Precio Unitario,Total,Moneda
Cargo fijo del servidor,1,${invoice.server_monthly_fee},${invoice.server_monthly_fee},${invoice.currency}
Pacientes activos,${invoice.active_patients_count},${invoice.per_patient_fee},${(invoice.active_patients_count * invoice.per_patient_fee).toFixed(2)},${invoice.currency}
Mantenimiento anual,1,${invoice.annual_maintenance_component},${invoice.annual_maintenance_component},${invoice.currency}
TOTAL,,,${invoice.total_amount},${invoice.currency}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=facturacion_${invoice.period_year}_${invoice.period_month.toString().padStart(2, '0')}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Error generando CSV' });
  }
});

// User management routes (admin only)
app.get('/api/admin/usuarios', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, codigo, nombre, apellidos, turno, activo, debe_cambiar_clave, rol, can_manage_billing FROM enfermeros ORDER BY nombre');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/admin/usuarios', requireAdmin, async (req, res) => {
  try {
    const { codigo, clave, nombre, apellidos, turno, activo, can_manage_billing } = req.body;

    const hashedPassword = await bcrypt.hash(clave, 10);

    const result = await pool.query(`
      INSERT INTO enfermeros (codigo, clave, nombre, apellidos, turno, activo, debe_cambiar_clave, primer_login, can_manage_billing)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, codigo, nombre, apellidos, turno, activo, can_manage_billing
    `, [codigo, hashedPassword, nombre, apellidos, turno, activo, true, true, can_manage_billing || false]);

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
    const { codigo, clave, nombre, apellidos, turno, activo, debe_cambiar_clave, can_manage_billing } = req.body;

    let query = `
      UPDATE enfermeros
      SET codigo = $1, nombre = $2, apellidos = $3, turno = $4, activo = $5, debe_cambiar_clave = $6, can_manage_billing = $7
    `;
    let params = [codigo, nombre, apellidos, turno, activo, debe_cambiar_clave, can_manage_billing || false, id];

    if (clave && clave.trim() !== '') {
      const hashedPassword = await bcrypt.hash(clave, 10);
      query = `
        UPDATE enfermeros
        SET codigo = $1, clave = $2, nombre = $3, apellidos = $4, turno = $5, activo = $6, debe_cambiar_clave = $7, can_manage_billing = $8
        WHERE id = $9 RETURNING id, codigo, nombre, apellidos, turno, activo, can_manage_billing
      `;
      params = [codigo, hashedPassword, nombre, apellidos, turno, activo, debe_cambiar_clave, can_manage_billing || false, id];
    } else {
      query += ` WHERE id = $8 RETURNING id, codigo, nombre, apellidos, turno, activo, can_manage_billing`;
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

// Photos endpoints
app.get('/api/pacientes/:id/fotos-pertenencias', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM fotos_pertenencias WHERE paciente_id = $1 ORDER BY fecha_registro DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fotos pertenencias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes/:id/fotos-pertenencias', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_archivo, descripcion, datos_imagen } = req.body;

    const result = await pool.query(`
      INSERT INTO fotos_pertenencias (paciente_id, nombre_archivo, descripcion, datos_imagen)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, nombre_archivo, descripcion, datos_imagen]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving foto pertenencia:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/pacientes/:id/fotos-medicamentos', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM fotos_medicamentos WHERE paciente_id = $1 ORDER BY fecha_registro DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fotos medicamentos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes/:id/fotos-medicamentos', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_archivo, descripcion, datos_imagen } = req.body;

    const result = await pool.query(`
      INSERT INTO fotos_medicamentos (paciente_id, nombre_archivo, descripcion, datos_imagen)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, nombre_archivo, descripcion, datos_imagen]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving foto medicamento:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Appointments endpoints
app.get('/api/pacientes/:id/citas', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM citas_seguimiento WHERE paciente_id = $1 ORDER BY fecha_cita, hora_cita', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching citas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pacientes/:id/citas', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_doctor, fecha_cita, hora_cita, anotaciones } = req.body;

    const result = await pool.query(`
      INSERT INTO citas_seguimiento (paciente_id, nombre_doctor, fecha_cita, hora_cita, anotaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, nombre_doctor, fecha_cita, hora_cita, anotaciones]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/citas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_doctor, fecha_cita, hora_cita, anotaciones, estado } = req.body;

    const result = await pool.query(`
      UPDATE citas_seguimiento
      SET nombre_doctor = $1, fecha_cita = $2, hora_cita = $3, anotaciones = $4, estado = $5
      WHERE id = $6
      RETURNING *
    `, [nombre_doctor, fecha_cita, hora_cita, anotaciones, estado, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/citas/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM citas_seguimiento WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json({ message: 'Cita eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting cita:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Vital signs endpoints
app.get('/api/signos-vitales', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sv.*,
             p.nombre as paciente_nombre, p.apellidos as paciente_apellidos, p.numero_expediente,
             e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM signos_vitales sv
      JOIN pacientes p ON sv.paciente_id = p.id
      JOIN enfermeros e ON sv.enfermero_id = e.id
      ORDER BY sv.fecha_registro DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching signos vitales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/signos-vitales', requireAuth, async (req, res) => {
  try {
    const {
      paciente_id, presion_sistolica, presion_diastolica,
      saturacion_oxigeno, frecuencia_cardiaca, temperatura, observaciones
    } = req.body;

    const result = await pool.query(`
      INSERT INTO signos_vitales (
        paciente_id, enfermero_id, presion_sistolica, presion_diastolica,
        saturacion_oxigeno, frecuencia_cardiaca, temperatura, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      paciente_id, req.session.enfermero_id, presion_sistolica, presion_diastolica,
      saturacion_oxigeno, frecuencia_cardiaca, temperatura, observaciones
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating signos vitales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/pacientes/:id/signos-vitales', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT sv.*, e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM signos_vitales sv
      JOIN enfermeros e ON sv.enfermero_id = e.id
      WHERE sv.paciente_id = $1
      ORDER BY sv.fecha_registro DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching signos vitales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Doping tests endpoints
app.get('/api/pruebas-doping', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pd.*,
             p.nombre as paciente_nombre, p.apellidos as paciente_apellidos, p.numero_expediente,
             e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM pruebas_doping pd
      JOIN pacientes p ON pd.paciente_id = p.id
      JOIN enfermeros e ON pd.enfermero_id = e.id
      ORDER BY pd.fecha_prueba DESC, pd.hora_prueba DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pruebas doping:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/pruebas-doping', requireAuth, async (req, res) => {
  try {
    const {
      paciente_id, fecha_prueba, hora_prueba, tipo_muestra,
      resultado, sustancias_detectadas, observaciones
    } = req.body;

    const result = await pool.query(`
      INSERT INTO pruebas_doping (
        paciente_id, enfermero_id, fecha_prueba, hora_prueba, tipo_muestra,
        resultado, sustancias_detectadas, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      paciente_id, req.session.enfermero_id, fecha_prueba, hora_prueba, tipo_muestra,
      resultado, sustancias_detectadas, observaciones
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prueba doping:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/pacientes/:id/pruebas-doping', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT pd.*, e.nombre as enfermero_nombre, e.apellidos as enfermero_apellidos
      FROM pruebas_doping pd
      JOIN enfermeros e ON pd.enfermero_id = e.id
      WHERE pd.paciente_id = $1
      ORDER BY pd.fecha_prueba DESC, pd.hora_prueba DESC
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pruebas doping:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Patient discharge endpoint
app.put('/api/pacientes/:id/alta', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_salida, observaciones_alta, medico_autoriza, enfermero_autoriza, director_autoriza } = req.body;

    const result = await pool.query(`
      UPDATE pacientes
      SET fecha_salida = $1, observaciones_alta = $2, medico_autoriza = $3,
          enfermero_autoriza = $4, director_autoriza = $5
      WHERE id = $6
      RETURNING *
    `, [fecha_salida, observaciones_alta, medico_autoriza, enfermero_autoriza, director_autoriza, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient discharge:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Update patient active status
app.put('/api/pacientes/:id/activo', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const result = await pool.query(`
      UPDATE pacientes
      SET activo = $1
      WHERE id = $2
      RETURNING *
    `, [activo, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating patient status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Insert sample data endpoint (admin only)
app.post('/api/admin/insert-sample-data', requireAdmin, async (req, res) => {
  try {
    console.log('Starting sample data insertion...');

    // Check if database connection is available
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'No hay conexión a la base de datos configurada. Configure PostgreSQL en la pestaña Database.' 
      });
    }

    // Start transaction
    await pool.query('BEGIN');

    // First, get existing users to use valid enfermero IDs
    const enfermerosResult = await pool.query('SELECT id, codigo FROM enfermeros WHERE activo = true ORDER BY id LIMIT 4');
    if (enfermerosResult.rows.length < 2) {
      await pool.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'No hay suficientes usuarios activos en el sistema para crear los datos de ejemplo.' 
      });
    }

    const enfermeroIds = enfermerosResult.rows.map(e => e.id);
    console.log('Available enfermero IDs:', enfermeroIds);

    // Ensure we have at least 3 enfermero IDs for the sample data
    const enf1 = enfermeroIds[0];
    const enf2 = enfermeroIds[1] || enfermeroIds[0];
    const enf3 = enfermeroIds[2] || enfermeroIds[0];

    // Insert sample patients
    const pacienteInsertResult = await pool.query(`
      INSERT INTO pacientes (
        numero_expediente, nombre, apellidos, fecha_nacimiento, documento_identidad,
        nacionalidad, contacto_emergencia_nombre, contacto_emergencia_telefono,
        telefono_principal, telefono_secundario, tipo_sangre, peso, estatura,
        padecimientos, informacion_general, tipo_paciente, cuarto_asignado,
        sexo, fecha_ingreso, motivo_ingreso, fase_tratamiento, unidad_cama,
        medico_tratante, equipo_tratante, riesgo_suicidio, riesgo_violencia,
        riesgo_fuga, riesgo_caidas
      ) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28),
      ($29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56),
      ($57, $58, $59, $60, $61, $62, $63, $64, $65, $66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78, $79, $80, $81, $82, $83, $84)
      ON CONFLICT (numero_expediente) DO NOTHING
      RETURNING id, numero_expediente
    `, [
      'EXP001', 'Juan Carlos', 'Pérez González', '1985-03-15', '001-150385-1023N',
      'Nicaragüense', 'María González', '8888-1234', '8777-5678', '8666-9012',
      'O+', 75.5, 1.75, 'Adicción a sustancias psicoactivas',
      'Paciente en proceso de rehabilitación', 'interno', 'HAB-101',
      'Masculino', '2025-01-10 08:30:00', 'desintoxicacion', 'fase_1', 'Cama A',
      'Dr. Roberto Martínez', 'Equipo Alpha', false, false, true, false,

      'EXP002', 'Ana Sofía', 'López Hernández', '1992-07-22', '001-220792-2034M',
      'Nicaragüense', 'Pedro López', '8555-4321', '8444-8765', '8333-2109',
      'A-', 62.0, 1.62, 'Trastorno depresivo mayor con episodios psicóticos',
      'Paciente con historial de autolesiones', 'interno', 'HAB-205',
      'Femenino', '2025-01-08 14:15:00', 'crisis_psiquiatrica', 'fase_2', 'Cama B',
      'Dra. Carmen Silva', 'Equipo Beta', true, false, false, true,

      'EXP003', 'Miguel Ángel', 'Ruiz Medina', '1978-11-08', '001-081178-3045N',
      'Nicaragüense', 'Elena Ruiz', '8222-6789', '8111-3456', '8000-7890',
      'B+', 82.3, 1.80, 'Alcoholismo crónico con cirrosis inicial',
      'Paciente cooperativo en tratamiento', 'externo', NULL,
      'Masculino', '2025-01-12 10:00:00', 'consulta_externa', 'seguimiento', NULL,
      'Dr. Francisco Gómez', 'Equipo Gamma', false, false, false, false
    ]);

    // Get patient IDs - either from insert result or existing patients
    let pacientes = {};
    if (pacienteInsertResult.rows.length > 0) {
      pacienteInsertResult.rows.forEach(p => {
        pacientes[p.numero_expediente] = p.id;
      });
    }

    // Always check for existing patients to ensure we have all IDs
    const existingPacientesResult = await pool.query(
      'SELECT id, numero_expediente FROM pacientes WHERE numero_expediente IN ($1, $2, $3)',
      ['EXP001', 'EXP002', 'EXP003']
    );
    existingPacientesResult.rows.forEach(p => {
      pacientes[p.numero_expediente] = p.id;
    });

    console.log('Patient IDs:', pacientes);

    // Validate we have patients before proceeding
    if (Object.keys(pacientes).length === 0) {
      await pool.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'No se pudieron crear o encontrar los pacientes necesarios para los datos de ejemplo.' 
      });
    }

    // Get valid patient IDs with better fallback logic
    const patientIds = Object.values(pacientes);
    const validPacienteId1 = pacientes['EXP001'] || patientIds[0];
    const validPacienteId2 = pacientes['EXP002'] || patientIds[1] || validPacienteId1;
    const validPacienteId3 = pacientes['EXP003'] || patientIds[2] || validPacienteId1;

    // Validate all IDs are valid numbers
    if (!validPacienteId1 || !validPacienteId2 || !validPacienteId3) {
      await pool.query('ROLLBACK');
      return res.status(500).json({ 
        error: 'Error: No se pudieron obtener IDs válidos de pacientes.' 
      });
    }

    // Insert sample nursing notes with proper error handling
    try {
      await pool.query(`
        INSERT INTO notas_enfermeria (
          fecha, hora, paciente_id, enfermero_id, observaciones
        ) VALUES
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15),
        ($16, $17, $18, $19, $20),
        ($21, $22, $23, $24, $25),
        ($26, $27, $28, $29, $30)
      `, [
        '2025-01-15', '08:00', validPacienteId1, enf1,
        'Paciente despertó tranquilo. Signos vitales estables. Refiere haber dormido bien durante la noche. Se muestra colaborador con el personal. Presenta buen estado de ánimo. Solicita hablar con su familia.',

        '2025-01-15', '14:30', validPacienteId1, enf2,
        'Durante la tarde el paciente participó activamente en la terapia grupal. Mostró buena disposición para compartir sus experiencias. Come adecuadamente. No presenta náuseas ni vómitos. Hidratación oral adecuada.',

        '2025-01-15', '22:00', validPacienteId1, enf1,
        'Turno nocturno tranquilo. Paciente cena completamente. Ve televisión en sala común hasta las 21:00 hrs. Se retira a su habitación sin dificultad. Refiere sentirse ansioso pero controlado.',

        '2025-01-15', '09:15', validPacienteId2, enf2,
        'Paciente presenta episodio de llanto al despertar. Refiere pesadillas recurrentes. Signos vitales: TA 110/70, FC 88, FR 18, Temp 36.8°C. Acepta desayuno parcialmente. Se muestra retraída al contacto social.',

        '2025-01-15', '16:45', validPacienteId2, enf1,
        'Mejoría notable después de sesión terapéutica. Paciente más comunicativa y participativa. Realizó actividades de arte-terapia. Buen apetito durante la merienda. Interactúa positivamente con otras pacientes.',

        '2025-01-16', '08:30', validPacienteId3, enf3,
        'Paciente acude puntual a cita de seguimiento. Refiere adherencia al tratamiento ambulatorio. Examen físico sin hallazgos significativos. Laboratorios pendientes de resultado. Peso estable.'
      ]);
    } catch (notasError) {
      console.warn('Error inserting nursing notes (may already exist):', notasError.message);
    }

    // Insert sample vital signs
    try {
      await pool.query(`
        INSERT INTO signos_vitales (
          paciente_id, enfermero_id, presion_sistolica, presion_diastolica,
          saturacion_oxigeno, frecuencia_cardiaca, temperatura, observaciones
        ) VALUES
        ($1, $2, 120, 80, 98.5, 72, 36.5, 'Signos vitales normales, paciente estable'),
        ($3, $4, 110, 70, 99.0, 88, 36.8, 'Ligera taquicardia, relacionada con ansiedad'),
        ($5, $6, 140, 90, 97.8, 76, 36.4, 'Hipertensión leve, requiere seguimiento')
      `, [
        validPacienteId1, enf1, 
        validPacienteId2, enf2,
        validPacienteId3, enf3
      ]);
    } catch (signosError) {
      console.warn('Error inserting vital signs (may already exist):', signosError.message);
    }

    // Insert additional medications
    try {
      await pool.query(`
        INSERT INTO medicamentos (nombre, descripcion, unidad_medida) VALUES
        ('Lorazepam', 'Ansiolítico benzodiazepina', 'mg'),
        ('Sertralina', 'Antidepresivo ISRS', 'mg'),
        ('Risperidona', 'Antipsicótico atípico', 'mg'),
        ('Vitamina B1 (Tiamina)', 'Suplemento vitamínico', 'mg'),
        ('Multivitamínico', 'Complejo vitamínico', 'tableta'),
        ('Paracetamol', 'Analgésico y antipirético', 'mg'),
        ('Ibuprofeno', 'Antiinflamatorio no esteroideo', 'mg'),
        ('Omeprazol', 'Inhibidor de la bomba de protones', 'mg'),
        ('Metformina', 'Antidiabético', 'mg'),
        ('Losartán', 'Antihipertensivo', 'mg')
        ON CONFLICT (nombre) DO NOTHING
      `);
    } catch (medicamentosError) {
      console.warn('Error inserting medications (may already exist):', medicamentosError.message);
    }

    // Commit transaction
    await pool.query('COMMIT');

    const message = 'Datos de ejemplo insertados correctamente. Se crearon 3 pacientes con sus respectivas notas de enfermería, medicamentos y signos vitales.';
    console.log('Sample data insertion completed successfully');

    res.json({ message });

  } catch (error) {
    // Rollback transaction on error
    try {
      await pool.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error rolling back transaction:', rollbackError);
    }

    console.error('Error inserting sample data:', error);

    res.status(500).json({ 
      error: 'Error al insertar los datos de ejemplo: ' + (error.message || 'Error desconocido') 
    });
  }
});

// Hospital configuration endpoints
app.get('/api/configuracion-hospital', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM configuracion_hospital ORDER BY id LIMIT 1');

    if (result.rows.length === 0) {
      // Return default configuration if none exists
      return res.json({
        id: null,
        nombre_hospital: 'Sistema Hospitalario',
        logo_base64: null,
        direccion: '',
        telefono: '',
        email: '',
        sitio_web: ''
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching hospital configuration:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/configuracion-hospital', requireAdmin, async (req, res) => {
  try {
    const { nombre_hospital, logo_base64, direccion, telefono, email, sitio_web } = req.body;

    // Check if configuration exists
    const existingConfig = await pool.query('SELECT id FROM configuracion_hospital LIMIT 1');

    let result;
    if (existingConfig.rows.length === 0) {
      // Insert new configuration
      result = await pool.query(`
        INSERT INTO configuracion_hospital (nombre_hospital, logo_base64, direccion, telefono, email, sitio_web)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [nombre_hospital, logo_base64, direccion, telefono, email, sitio_web]);
    } else {
      // Update existing configuration
      result = await pool.query(`
        UPDATE configuracion_hospital
        SET nombre_hospital = $1, logo_base64 = $2, direccion = $3, telefono = $4, 
            email = $5, sitio_web = $6, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `, [nombre_hospital, logo_base64, direccion, telefono, email, sitio_web, existingConfig.rows[0].id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating hospital configuration:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Database reset endpoint (admin only)
app.post('/api/admin/reset-database', requireAdmin, async (req, res) => {
  try {
    // Start transaction
    await pool.query('BEGIN');

    // Delete data in order to respect foreign key constraints
    await pool.query('DELETE FROM citas_seguimiento');
    await pool.query('DELETE FROM pruebas_doping');
    await pool.query('DELETE FROM signos_vitales');
    await pool.query('DELETE FROM fotos_medicamentos');
    await pool.query('DELETE FROM fotos_pertenencias');
    await pool.query('DELETE FROM medicamentos_paciente');
    await pool.query('DELETE FROM notas_enfermeria');
    await pool.query('DELETE FROM pacientes');
    await pool.query('DELETE FROM medicamentos');

    // Reset sequences
    await pool.query('ALTER SEQUENCE citas_seguimiento_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE pruebas_doping_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE signos_vitales_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE fotos_medicamentos_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE fotos_pertenencias_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE medicamentos_paciente_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE notas_enfermeria_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE pacientes_id_seq RESTART WITH 1');
    await pool.query('ALTER SEQUENCE medicamentos_id_seq RESTART WITH 1');

    // Insert some default medications
    await pool.query(`
      INSERT INTO medicamentos (nombre, descripcion, unidad_medida) VALUES
      ('Paracetamol', 'Analgésico y antipirético', 'mg'),
      ('Ibuprofeno', 'Antiinflamatorio no esteroideo', 'mg'),
      ('Amoxicilina', 'Antibiótico de amplio espectro', 'mg'),
      ('Omeprazol', 'Inhibidor de la bomba de protones', 'mg'),
      ('Aspirina', 'Ácido acetilsalicílico', 'mg')
    `);

    // Commit transaction
    await pool.query('COMMIT');

    res.json({
      message: 'Base de datos reinicializada correctamente. Se eliminaron todos los pacientes, notas y medicamentos personalizados. Los usuarios se mantuvieron intactos.'
    });

    console.log('Database reset completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error('Error resetting database:', error);
    res.status(500).json({ error: 'Error al reinicializar la base de datos' });
  }
});

// Health check endpoint for deployments
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Hospital Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// Database status endpoint for debugging
app.get('/api/status', async (req, res) => {
  console.log('Status check:', {
    sessionExists: !!req.session,
    sessionId: req.session?.id,
    enfermeroId: req.session?.enfermero_id,
    cookies: req.headers.cookie
  });

  if (req.session && req.session.enfermero_id) {
    try {
      // Check if user needs to change password
      const result = await pool.query(
        'SELECT debe_cambiar_clave, codigo, nombre, rol, can_manage_billing FROM enfermeros WHERE id = $1',
        [req.session.enfermero_id]
      );

      if (result.rows.length === 0) {
        console.log('User not found in database');
        return res.json({
          authenticated: false,
          error: 'Usuario no encontrado',
          debug: { enfermeroId: req.session.enfermero_id }
        });
      }

      const user = result.rows[0];
      const requiereCambio = user.debe_cambiar_clave;

      res.json({
        authenticated: true,
        requiere_cambio_clave: requiereCambio,
        usuario: {
          codigo: user.codigo,
          nombre: user.nombre,
          rol: user.rol,
          can_manage_billing: user.can_manage_billing
        },
        debug: {
          sessionId: req.session.id,
          enfermeroId: req.session.enfermero_id
        }
      });
    } catch (error) {
      console.error('Error checking password change requirement:', error);
      res.json({
        authenticated: false,
        error: 'Error de base de datos',
        debug: { error: error.message }
      });
    }
  } else {
    res.json({
      authenticated: false,
      requiere_cambio_clave: false,
      debug: {
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : []
      }
    });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    console.log(`API endpoint not found: ${req.path}`);
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Log non-API requests
  console.log(`Serving React app for: ${req.path}`);

  // Serve React build files
  const indexPath = path.join(__dirname, 'build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Start server
initDatabase().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`Hospital System Server running on http://0.0.0.0:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
    console.log(`Serving React build files from: ${path.join(__dirname, 'build')}`);
    console.log(`API endpoints available at: /api/*`);
    console.log('==========================================');
    console.log('Ready for connections!');
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in PRODUCTION mode');
    }
  });
}).catch(error => {
  console.error('Database initialization failed, but server will continue:', error);
  console.log('Some features may not work without a database. Set up PostgreSQL in the Database tab.');

  // Start server anyway
  app.listen(port, '0.0.0.0', () => {
    console.log(`Hospital System Server running on http://0.0.0.0:${port} (LIMITED MODE - NO DATABASE)`);
    console.log('To enable full functionality, set up a PostgreSQL database in the Database tab.');
    console.log('==========================================');
    console.log('Ready for connections!');
  });
});