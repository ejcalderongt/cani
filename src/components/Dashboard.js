import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    {
      title: 'Pacientes Activos',
      value: '0',
      trend: '0',
      icon: '👥',
      color: 'var(--primary)',
      bgColor: 'rgba(15, 118, 110, 0.1)'
    },
    {
      title: 'Casos Críticos',
      value: '0',
      trend: '0',
      icon: '🚨',
      color: 'var(--error)',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    {
      title: 'Pendientes de Alta',
      value: '0',
      trend: '0',
      icon: '📋',
      color: 'var(--warning)',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Notas de Enfermería Hoy',
      value: '0',
      trend: '0',
      icon: '📝',
      color: 'var(--success)',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    }
  ]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Fetching dashboard data...');
        
        // Try to fetch data - if any request fails, show zeros
        const [pacientesResponse, notasResponse] = await Promise.allSettled([
          axios.get('/api/pacientes'),
          axios.get('/api/notas')
        ]);
        
        // Check if requests were successful
        const pacientes = pacientesResponse.status === 'fulfilled' ? (pacientesResponse.value.data || []) : [];
        const notas = notasResponse.status === 'fulfilled' ? (notasResponse.value.data || []) : [];
        
        console.log('Dashboard data fetched:', {
          pacientes: pacientes.length,
          notas: notas.length,
          pacientesRequestStatus: pacientesResponse.status,
          notasRequestStatus: notasResponse.status
        });
        
        // If any request failed, redirect to login
        if (pacientesResponse.status === 'rejected' && pacientesResponse.reason?.response?.status === 401) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Count active patients (patients without discharge date)
        const pacientesActivos = pacientes.filter(p => !p.fecha_salida && p.activo !== false).length;
        
        // Count notes from today
        const today = new Date().toISOString().split('T')[0];
        const notasHoy = notas.filter(n => n.fecha === today).length;
        
        // Count critical patients (patients with any risk factor and still active)
        const casosCriticos = pacientes.filter(p => 
          !p.fecha_salida && p.activo !== false && (p.riesgo_suicidio || p.riesgo_violencia || p.riesgo_fuga || p.riesgo_caidas)
        ).length;
        
        // Count patients pending discharge (active patients without discharge date)
        const pendientesAlta = pacientes.filter(p => !p.fecha_salida && p.activo !== false).length;
        
        // Always update stats with actual counts (including 0 if no data)
        setStats([
          {
            title: 'Pacientes Activos',
            value: pacientesActivos.toString(),
            trend: `${pacientesActivos}`,
            icon: '👥',
            color: 'var(--primary)',
            bgColor: 'rgba(15, 118, 110, 0.1)'
          },
          {
            title: 'Pacientes de Riesgo',
            value: casosCriticos.toString(),
            trend: `${casosCriticos}`,
            icon: '🚨',
            color: 'var(--error)',
            bgColor: 'rgba(239, 68, 68, 0.1)'
          },
          {
            title: 'Pacientes Hospitalizados',
            value: pendientesAlta.toString(),
            trend: `${pendientesAlta}`,
            icon: '🏥',
            color: 'var(--warning)',
            bgColor: 'rgba(245, 158, 11, 0.1)'
          },
          {
            title: 'Notas de Enfermería Hoy',
            value: notasHoy.toString(),
            trend: `${notasHoy}`,
            icon: '📝',
            color: 'var(--success)',
            bgColor: 'rgba(16, 185, 129, 0.1)'
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Check if the error is due to authentication
        if (error.response?.status === 401) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login');
          return;
        }
        
        // Set all values to 0 when there's an error
        setStats([
          {
            title: 'Pacientes Activos',
            value: '0',
            trend: '0',
            icon: '👥',
            color: 'var(--primary)',
            bgColor: 'rgba(15, 118, 110, 0.1)'
          },
          {
            title: 'Pacientes de Riesgo',
            value: '0',
            trend: '0',
            icon: '🚨',
            color: 'var(--error)',
            bgColor: 'rgba(239, 68, 68, 0.1)'
          },
          {
            title: 'Pacientes Hospitalizados',
            value: '0',
            trend: '0',
            icon: '🏥',
            color: 'var(--warning)',
            bgColor: 'rgba(245, 158, 11, 0.1)'
          },
          {
            title: 'Notas de Enfermería Hoy',
            value: '0',
            trend: '0',
            icon: '📝',
            color: 'var(--success)',
            bgColor: 'rgba(16, 185, 129, 0.1)'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  const quickActions = [
    {
      title: 'Nuevo Paciente',
      description: 'Registrar un nuevo paciente',
      icon: '👤',
      path: '/pacientes/nuevo',
      color: 'var(--primary)'
    },
    {
      title: 'Nueva Nota',
      description: 'Añadir nota de enfermería',
      icon: '📝',
      path: '/notas/nueva',
      color: 'var(--secondary)'
    },
    {
      title: 'Medicamentos',
      description: 'Gestionar medicamentos',
      icon: '💊',
      path: '/medicamentos',
      color: 'var(--success)'
    },
    {
      title: 'Ver Pacientes',
      description: 'Lista completa de pacientes',
      icon: '📊',
      path: '/pacientes',
      color: 'var(--warning)'
    },
    {
      title: 'Signos Vitales',
      description: 'Capturar y revisar signos vitales',
      icon: '❤️',
      path: '/signos-vitales',
      color: 'var(--info)'
    },
    {
      title: 'Pruebas de Doping',
      description: 'Registrar y controlar pruebas de doping',
      icon: '🧪',
      path: '/pruebas-doping',
      color: 'var(--purple)'
    }
  ];

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Panel de Control</h1>
        <p className="text-muted">
          Resumen general del sistema de la Clínica de Tratamiento de Adicciones - {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 'var(--space-6)', 
        marginBottom: 'var(--space-8)' 
      }}>
        {stats.map((stat, index) => (
          <Link 
            key={index} 
            to={stat.title === 'Pacientes Activos' ? '/pacientes' : '#'}
            style={{ textDecoration: 'none' }}
          >
            <div className="medical-card" style={{ 
              padding: 'var(--space-6)',
              cursor: stat.title === 'Pacientes Activos' ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => {
              if (stat.title === 'Pacientes Activos') {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }
            }}
            onMouseOut={(e) => {
              if (stat.title === 'Pacientes Activos') {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 24px #0f172a0f';
              }
            }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: 'var(--radius-md)', 
                  background: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xl)'
                }}
              >
                {stat.icon}
              </div>
              <span 
                style={{ 
                  fontSize: 'var(--text-xs)', 
                  fontWeight: '500',
                  color: stat.color,
                  background: stat.bgColor,
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {stat.trend}
              </span>
            </div>
            <h3 style={{ 
              fontSize: 'var(--text-3xl)', 
              fontWeight: '700', 
              color: stat.color,
              marginBottom: 'var(--space-2)'
            }}>
              {stat.value}
            </h3>
            <p style={{ 
              fontSize: 'var(--text-sm)', 
              color: 'var(--text)',
              fontWeight: '500',
              margin: 0
            }}>
              {stat.title}
            </p>
          </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="medical-card">
        <div className="medical-card-header">
          <h2 className="medical-card-title">Acciones Rápidas</h2>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: 'var(--space-4)' 
        }}>
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.path}
              style={{
                textDecoration: 'none',
                padding: 'var(--space-4)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elev)',
                transition: 'all 0.15s ease',
                display: 'block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: 'var(--radius)', 
                    background: `${action.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--text-lg)'
                  }}
                >
                  {action.icon}
                </div>
                <div>
                  <h4 style={{ 
                    color: 'var(--text)', 
                    marginBottom: 'var(--space-1)',
                    fontSize: 'var(--text-base)',
                    fontWeight: '600'
                  }}>
                    {action.title}
                  </h4>
                  <p style={{ 
                    color: 'var(--muted)', 
                    fontSize: 'var(--text-sm)',
                    margin: 0 
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="medical-card" style={{ marginTop: 'var(--space-8)' }}>
        <div className="medical-card-header">
          <h2 className="medical-card-title">Actividad Reciente</h2>
        </div>
        <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📊</div>
          <p>La actividad reciente aparecerá aquí una vez que se registren eventos en el sistema.</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;