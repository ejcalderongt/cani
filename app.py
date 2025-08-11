
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, time
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

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
    turno = db.Column(db.String(20), nullable=False)  # mañana, tarde, noche
    activo = db.Column(db.Boolean, default=True)
    
    notas = db.relationship('NotaEnfermeria', backref='enfermero', lazy=True)

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
    tipo_paciente = db.Column(db.String(20), nullable=False)  # interno, ambulatorio
    cuarto_asignado = db.Column(db.String(10))
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)
    activo = db.Column(db.Boolean, default=True)
    
    notas = db.relationship('NotaEnfermeria', backref='paciente', lazy=True)
    medicamentos = db.relationship('MedicamentoPaciente', backref='paciente', lazy=True)

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

class Medicamento(db.Model):
    __tablename__ = 'medicamentos'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.Text)
    unidad_medida = db.Column(db.String(20))  # mg, ml, unidades, etc.
    activo = db.Column(db.Boolean, default=True)

class MedicamentoPaciente(db.Model):
    __tablename__ = 'medicamentos_paciente'
    
    id = db.Column(db.Integer, primary_key=True)
    paciente_id = db.Column(db.Integer, db.ForeignKey('pacientes.id'), nullable=False)
    medicamento_id = db.Column(db.Integer, db.ForeignKey('medicamentos.id'), nullable=False)
    dosis = db.Column(db.String(50), nullable=False)
    frecuencia = db.Column(db.String(100), nullable=False)  # cada 8 horas, 3 veces al día, etc.
    horarios = db.Column(db.String(200))  # 08:00, 16:00, 00:00
    indicaciones = db.Column(db.Text)
    fecha_inicio = db.Column(db.Date, nullable=False)
    fecha_fin = db.Column(db.Date)
    activo = db.Column(db.Boolean, default=True)
    
    medicamento = db.relationship('Medicamento', backref='asignaciones')

# Routes
@app.route('/')
def index():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        codigo = request.form['codigo']
        clave = request.form['clave']
        
        enfermero = Enfermero.query.filter_by(codigo=codigo, clave=clave, activo=True).first()
        if enfermero:
            session['enfermero_id'] = enfermero.id
            session['enfermero_nombre'] = f"{enfermero.nombre} {enfermero.apellidos}"
            flash('Inicio de sesión exitoso', 'success')
            return redirect(url_for('index'))
        else:
            flash('Código o clave incorrectos', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/pacientes')
def pacientes():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    pacientes = Paciente.query.filter_by(activo=True).all()
    return render_template('pacientes.html', pacientes=pacientes)

@app.route('/paciente/nuevo', methods=['GET', 'POST'])
def nuevo_paciente():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        paciente = Paciente(
            numero_expediente=request.form['numero_expediente'],
            nombre=request.form['nombre'],
            apellidos=request.form['apellidos'],
            fecha_nacimiento=datetime.strptime(request.form['fecha_nacimiento'], '%Y-%m-%d').date(),
            documento_identidad=request.form['documento_identidad'],
            nacionalidad=request.form['nacionalidad'],
            contacto_emergencia_nombre=request.form['contacto_emergencia_nombre'],
            contacto_emergencia_telefono=request.form['contacto_emergencia_telefono'],
            telefono_principal=request.form['telefono_principal'],
            telefono_secundario=request.form.get('telefono_secundario', ''),
            tipo_sangre=request.form['tipo_sangre'],
            padecimientos=request.form.get('padecimientos', ''),
            informacion_general=request.form.get('informacion_general', ''),
            tipo_paciente=request.form['tipo_paciente'],
            cuarto_asignado=request.form.get('cuarto_asignado', '') if request.form['tipo_paciente'] == 'interno' else None
        )
        
        db.session.add(paciente)
        db.session.commit()
        flash('Paciente registrado exitosamente', 'success')
        return redirect(url_for('pacientes'))
    
    return render_template('nuevo_paciente.html')

@app.route('/paciente/<int:id>')
def ver_paciente(id):
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    paciente = Paciente.query.get_or_404(id)
    notas = NotaEnfermeria.query.filter_by(paciente_id=id).order_by(NotaEnfermeria.fecha.desc(), NotaEnfermeria.hora.desc()).all()
    medicamentos = MedicamentoPaciente.query.filter_by(paciente_id=id, activo=True).all()
    
    return render_template('ver_paciente.html', paciente=paciente, notas=notas, medicamentos=medicamentos)

@app.route('/notas')
def notas_enfermeria():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    notas = NotaEnfermeria.query.order_by(NotaEnfermeria.fecha.desc(), NotaEnfermeria.hora.desc()).all()
    return render_template('notas_enfermeria.html', notas=notas)

@app.route('/nota/nueva', methods=['GET', 'POST'])
def nueva_nota():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        nota = NotaEnfermeria(
            fecha=datetime.strptime(request.form['fecha'], '%Y-%m-%d').date(),
            hora=datetime.strptime(request.form['hora'], '%H:%M').time(),
            paciente_id=request.form['paciente_id'],
            enfermero_id=session['enfermero_id'],
            observaciones=request.form['observaciones'],
            medicamentos_administrados=request.form.get('medicamentos_administrados', ''),
            tratamientos=request.form.get('tratamientos', '')
        )
        
        db.session.add(nota)
        db.session.commit()
        flash('Nota de enfermería registrada exitosamente', 'success')
        return redirect(url_for('notas_enfermeria'))
    
    pacientes = Paciente.query.filter_by(activo=True).all()
    return render_template('nueva_nota.html', pacientes=pacientes)

@app.route('/medicamentos')
def medicamentos():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    medicamentos = Medicamento.query.filter_by(activo=True).all()
    return render_template('medicamentos.html', medicamentos=medicamentos)

@app.route('/medicamento/nuevo', methods=['GET', 'POST'])
def nuevo_medicamento():
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        medicamento = Medicamento(
            nombre=request.form['nombre'],
            descripcion=request.form.get('descripcion', ''),
            unidad_medida=request.form['unidad_medida']
        )
        
        db.session.add(medicamento)
        db.session.commit()
        flash('Medicamento registrado exitosamente', 'success')
        return redirect(url_for('medicamentos'))
    
    return render_template('nuevo_medicamento.html')

@app.route('/paciente/<int:paciente_id>/medicamento/nuevo', methods=['GET', 'POST'])
def asignar_medicamento(paciente_id):
    if 'enfermero_id' not in session:
        return redirect(url_for('login'))
    
    paciente = Paciente.query.get_or_404(paciente_id)
    
    if request.method == 'POST':
        asignacion = MedicamentoPaciente(
            paciente_id=paciente_id,
            medicamento_id=request.form['medicamento_id'],
            dosis=request.form['dosis'],
            frecuencia=request.form['frecuencia'],
            horarios=request.form.get('horarios', ''),
            indicaciones=request.form.get('indicaciones', ''),
            fecha_inicio=datetime.strptime(request.form['fecha_inicio'], '%Y-%m-%d').date(),
            fecha_fin=datetime.strptime(request.form['fecha_fin'], '%Y-%m-%d').date() if request.form.get('fecha_fin') else None
        )
        
        db.session.add(asignacion)
        db.session.commit()
        flash('Medicamento asignado exitosamente', 'success')
        return redirect(url_for('ver_paciente', id=paciente_id))
    
    medicamentos = Medicamento.query.filter_by(activo=True).all()
    return render_template('asignar_medicamento.html', paciente=paciente, medicamentos=medicamentos)

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
