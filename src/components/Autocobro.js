
import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

function Autocobro() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (selectedPeriod.year && selectedPeriod.month) {
      fetchSummary();
    }
  }, [selectedPeriod]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/billing/summary', {
        params: {
          year: selectedPeriod.year,
          month: selectedPeriod.month
        }
      });
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      setError('Error al calcular el resumen de facturación');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await axios.get('/api/billing/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Error al cargar los documentos');
    }
  };

  const generateDocument = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post('/api/billing/generate', null, {
        params: {
          year: selectedPeriod.year,
          month: selectedPeriod.month
        }
      });

      setSuccess(response.data.message);
      fetchInvoices(); // Refresh the invoices list
    } catch (error) {
      console.error('Error generating document:', error);
      if (error.response?.status === 409) {
        setError('Ya existe un documento para este período');
      } else {
        setError(error.response?.data?.error || 'Error al generar el documento');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (invoiceId, format) => {
    try {
      const response = await axios.get(`/api/billing/invoices/${invoiceId}/download.${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facturacion_${selectedPeriod.year}_${selectedPeriod.month.toString().padStart(2, '0')}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError(`Error al descargar el archivo ${format.toUpperCase()}`);
    }
  };

  const handlePeriodChange = (e) => {
    const { name, value } = e.target;
    setSelectedPeriod({
      ...selectedPeriod,
      [name]: parseInt(value)
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Módulo de Autocobro</h1>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Period Selection */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Seleccionar Período</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Año</Form.Label>
                <Form.Select
                  name="year"
                  value={selectedPeriod.year}
                  onChange={handlePeriodChange}
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group>
                <Form.Label>Mes</Form.Label>
                <Form.Select
                  name="month"
                  value={selectedPeriod.month}
                  onChange={handlePeriodChange}
                >
                  {monthNames.map((month, index) => (
                    <option key={index + 1} value={index + 1}>{month}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="row mb-4">
          <div className="col-md-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-info">Pacientes Activos</Card.Title>
                <h3>{summary.activePatients}</h3>
                <small className="text-muted">En el período seleccionado</small>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-primary">Cargo Servidor</Card.Title>
                <h3>{formatCurrency(summary.components.serverMonthlyFee, summary.currency)}</h3>
                <small className="text-muted">Fijo mensual</small>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-warning">Costo Pacientes</Card.Title>
                <h3>{formatCurrency(summary.components.patientsFeeTotalFee, summary.currency)}</h3>
                <small className="text-muted">
                  {formatCurrency(summary.components.perPatientFee, summary.currency)} × {summary.activePatients}
                </small>
              </Card.Body>
            </Card>
          </div>
          <div className="col-md-3">
            <Card className="text-center">
              <Card.Body>
                <Card.Title className="text-success">Total</Card.Title>
                <h3>{formatCurrency(summary.total, summary.currency)}</h3>
                <small className="text-muted">
                  {summary.components.prorateAnnualMaintenance && 
                    `+ ${formatCurrency(summary.components.annualMaintenanceComponent, summary.currency)} mantenimiento`
                  }
                </small>
              </Card.Body>
            </Card>
          </div>
        </div>
      )}

      {/* Generate Document */}
      {summary && (
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Generar Documento</h5>
          </Card.Header>
          <Card.Body>
            <p>
              Período: <strong>{monthNames[selectedPeriod.month - 1]} {selectedPeriod.year}</strong>
            </p>
            <p>
              Total estimado: <strong>{formatCurrency(summary.total, summary.currency)}</strong>
            </p>
            <Button
              variant="primary"
              onClick={generateDocument}
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar Documento'}
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Invoices Table */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Documentos Generados</h5>
        </Card.Header>
        <Card.Body>
          {invoices.length === 0 ? (
            <p className="text-center text-muted">No hay documentos generados</p>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Generado</th>
                  <th>Por</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      {monthNames[invoice.period_month - 1]} {invoice.period_year}
                    </td>
                    <td>
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </td>
                    <td>
                      <Badge bg={invoice.status === 'draft' ? 'secondary' : 'success'}>
                        {invoice.status === 'draft' ? 'Borrador' : invoice.status}
                      </Badge>
                    </td>
                    <td>
                      {new Date(invoice.generated_at).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      {invoice.generated_by_name || 'Usuario desconocido'}
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => downloadDocument(invoice.id, 'pdf')}
                        >
                          PDF
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => downloadDocument(invoice.id, 'csv')}
                        >
                          CSV
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <div className="mt-4">
        <Alert variant="info">
          <strong>Información:</strong> El cálculo se basa en los pacientes con estado "Activo" 
          durante el período seleccionado y los parámetros de facturación configurados por el administrador.
        </Alert>
      </div>
    </Container>
  );
}

export default Autocobro;
