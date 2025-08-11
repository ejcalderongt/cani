
from flask import Flask, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, time
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
CORS(app)

# Database configuration
database_url = os.environ.get('DATABASE_URL')
if database_url:
    database_url = database_url.replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/hospital_db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Models
class Enfermero(db.Model):
    __tablename__ = 'enfermeros'
    
    id = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), unique=True, nullable=False)
    clave = db.Column(db.String(255), nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    turno = db.Column(db.String(20), nullable=False)
    activo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'codigo': self.codigo,
            'nombre': self.nombre,
            'apellidos': self.apellidos,
            'turno': self.turno,
            'activo': self.activo
        }

class Paciente(db.Model):
    __tablename__ = 'pacientes'
    
    id = db.Column(db.Integer, primary_key=True)
    numero_expediente = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(100), nullable=False)
    apellidos = db.Column(db.String(100), nullable=False)
    fecha_nacimiento = db.Column(db.Date, nullable=False)
    documento_identidad = db.Column(db.String(50), nullable=False)
    nacionalidad = db.Column(db.String(50), nullable=False)
    contacto_emergencia_nombre = db.Column(db.String(100))
    contacto_emergencia_telefono = db.Column(db.String(20))
    telefono_principal = db.Column(db.String(20))
    telefono_secundario = db.Column(db.String(20))
    tipo_sangre = db.Column(db.String(5), nullable=False)
    padecimientos = db.Column(db.Text)
    informacion_general = db.Column(db.Text)
    tipo_paciente = db.Column(db.String(20), nullable=False)
    cuarto_asignado = db.Column(db.String(10))
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'numero_expediente': self.numero_expediente,
            'nombre': self.nombre,
            'apellidos': self.apellidos,
            'fecha_nacimiento': self.fecha_nacimiento.strftime('%Y-%m-%d'),
            'documento_identidad': self.documento_identidad,
            'nacionalidad': self.nacionalidad,
            'contacto_emergencia_nombre': self.contacto_emergencia_nombre,
            'contacto_emergencia_telefono': self.contacto_emergencia_telefono,
            'telefono_principal': self.telefono_principal,
            'telefono_secundario': self.telefono_secundario,
            'tipo_sangre': self.tipo_sangre,
            'padecimientos': self.padecimientos,
            'informacion_general': self.informacion_general,
            'tipo_paciente': self.tipo_paciente,
            'cuarto_asignado': self.cuarto_asignado,
            'activo': self.activo
        }

class NotaEnfermeria(db.Model):
    __tablename__ = 'notas_enfermeria'
    
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.Date, nullable=False)
    hora = db.Column(db.Time, nullable=False)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    enfermero_id = db.Column(db.Integer, db.ForeignKey('enfermeros.id'), nullable=False)
    observaciones = db.Column(db.Text, nullable=False)
    medicamentos_administrados = db.Column(db.Text)
    tratamientos = db.Column(db.Text)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    
    paciente = db.relationship('Paciente', backref='notas')
    enfermero = db.relationship('Enfermero', backref='notas')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fecha': self.fecha.strftime('%Y-%m-%d'),
            'hora': self.hora.strftime('%H:%M'),
            'paciente_id': self.paciente_id,
            'enfermero_id': self.enfermero_id,
            'observaciones': self.observaciones,
            'medicamentos_administrados': self.medicamentos_administrados,
            'tratamientos': self.tratamientos,
            'paciente': self.paciente.to_dict() if self.paciente else None,
            'enfermero': self.enfermero.to_dict() if self.enfermero else None
        }

class Medicamento(db.Model):
    __tablename__ = 'medicamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    unidad_medida = db.Column(db.String(20))
    activo = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'descripcion': self.descripcion,
            'unidad_medida': self.unidad_medida,
            'activo': self.activo
        }

class MedicamentoPaciente(db.Model):
    __tablename__ = 'medicamentos_paciente'
    
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    medicamento_id = db.Column(db.Integer, db.ForeignKey('medicamentos.id'), nullable=False)
    dosis = db.Column(db.String(50), nullable=False)
    frecuencia = db.Column(db.String(100), nullable=False)
    horarios = db.Column(db.String(200))
    indicaciones = db.Column(db.Text)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date)
    activo = db.Column(db.Boolean, default=True)
    
    medicamento = db.relationship('Medicamento', backref='asignaciones')
    paciente = db.relationship('Paciente', backref='medicamentos')
    
    def to_dict(self):
        return {
            'id': self.id,
            'paciente_id': self.paciente_id,
            'medicamento_id': self.medicamento_id,
            'dosis': self.dosis,
            'frecuencia': self.frecuencia,
            'horarios': self.horarios,
            'indicaciones': self.indicaciones,
            'fecha_inicio': self.fecha_inicio.strftime('%Y-%m-%d'),
            'fecha_fin': self.fecha_fin.strftime('%Y-%m-%d') if self.fecha_fin else None,
            'activo': self.activo,
            'medicamento': self.medicamento.to_dict() if self.medicamento else None
        }

# API Routes
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    codigo = data.get('codigo')
    clave = data.get('clave')
    
    enfermero = Enfermero.query.filter_by(codigo=codigo, clave=clave, activo=True).first()
    if enfermero:
        session['enfermero_id'] = enfermero.id
        return jsonify({
            'success': True,
            'enfermero': enfermero.to_dict()
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Código o clave incorrectos'
        }), 401

@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/pacientes', methods=['GET'])
def api_pacientes():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    pacientes = Paciente.query.filter_by(activo=True).all()
    return jsonify([p.to_dict() for p in pacientes])

@app.route('/api/pacientes', methods=['POST'])
def api_crear_paciente():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    data = request.get_json()
    
    paciente = Paciente(
        numero_expediente=data['numero_expediente'],
        nombre=data['nombre'],
        apellidos=data['apellidos'],
        fecha_nacimiento=datetime.strptime(data['fecha_nacimiento'], '%Y-%m-%d').date(),
        documento_identidad=data['documento_identidad'],
        nacionalidad=data['nacionalidad'],
        contacto_emergencia_nombre=data['contacto_emergencia_nombre'],
        contacto_emergencia_telefono=data['contacto_emergencia_telefono'],
        telefono_principal=data['telefono_principal'],
        telefono_secundario=data.get('telefono_secundario', ''),
        tipo_sangre=data['tipo_sangre'],
        padecimientos=data.get('padecimientos', ''),
        informacion_general=data.get('informacion_general', ''),
        tipo_paciente=data['tipo_paciente'],
        cuarto_asignado=data.get('cuarto_asignado', '') if data['tipo_paciente'] == 'interno' else None
    )
    
    db.session.add(paciente)
    db.session.commit()
    return jsonify(paciente.to_dict()), 201

@app.route('/api/pacientes/<int:id>', methods=['GET'])
def api_paciente(id):
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    paciente = Paciente.query.get_or_404(id)
    notas = NotaEnfermeria.query.filter_by(paciente_id=id).order_by(NotaEnfermeria.fecha.desc(), NotaEnfermeria.hora.desc()).all()
    medicamentos = MedicamentoPaciente.query.filter_by(paciente_id=id, activo=True).all()
    
    return jsonify({
        'paciente': paciente.to_dict(),
        'notas': [n.to_dict() for n in notas],
        'medicamentos': [m.to_dict() for m in medicamentos]
    })

@app.route('/api/notas', methods=['GET'])
def api_notas():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    notas = NotaEnfermeria.query.order_by(NotaEnfermeria.fecha.desc(), NotaEnfermeria.hora.desc()).all()
    return jsonify([n.to_dict() for n in notas])

@app.route('/api/notas', methods=['POST'])
def api_crear_nota():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    data = request.get_json()
    
    nota = NotaEnfermeria(
        fecha=datetime.strptime(data['fecha'], '%Y-%m-%d').date(),
        hora=datetime.strptime(data['hora'], '%H:%M').time(),
        paciente_id=data['paciente_id'],
        enfermero_id=session['enfermero_id'],
        observaciones=data['observaciones'],
        medicamentos_administrados=data.get('medicamentos_administrados', ''),
        tratamientos=data.get('tratamientos', '')
    )
    
    db.session.add(nota)
    db.session.commit()
    return jsonify(nota.to_dict()), 201

@app.route('/api/medicamentos', methods=['GET'])
def api_medicamentos():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    medicamentos = Medicamento.query.filter_by(activo=True).all()
    return jsonify([m.to_dict() for m in medicamentos])

@app.route('/api/medicamentos', methods=['POST'])
def api_crear_medicamento():
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    data = request.get_json()
    
    medicamento = Medicamento(
        nombre=data['nombre'],
        descripcion=data.get('descripcion', ''),
        unidad_medida=data['unidad_medida']
    )
    
    db.session.add(medicamento)
    db.session.commit()
    return jsonify(medicamento.to_dict()), 201

@app.route('/api/pacientes/<int:paciente_id>/medicamentos', methods=['POST'])
def api_asignar_medicamento(paciente_id):
    if 'enfermero_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401
    
    data = request.get_json()
    
    asignacion = MedicamentoPaciente(
        paciente_id=paciente_id,
        medicamento_id=data['medicamento_id'],
        dosis=data['dosis'],
        frecuencia=data['frecuencia'],
        horarios=data.get('horarios', ''),
        indicaciones=data.get('indicaciones', ''),
        fecha_inicio=datetime.strptime(data['fecha_inicio'], '%Y-%m-%d').date(),
        fecha_fin=datetime.strptime(data['fecha_fin'], '%Y-%m-%d').date() if data.get('fecha_fin') else None
    )
    
    db.session.add(asignacion)
    db.session.commit()
    return jsonify(asignacion.to_dict()), 201

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Crear enfermero de prueba si no existe
        if not Enfermero.query.first():
            enfermero_test = Enfermero(
                codigo='ENF001',
                clave='123456',
                nombre='Enfermero',
                apellidos='De Prueba',
                turno='mañana'
            )
            db.session.add(enfermero_test)
            db.session.commit()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
