// src/modules/Leave/LeaveApply.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getLeaveTypes, applyLeave } from '../../services/leaveService';
import { getEmployees } from '../../services/employeeService';

function LeaveApply() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const [form, setForm] = useState({
    EmployeeID: '',
    LeaveTypeID: '',
    StartDate: '',
    EndDate: '',
    Reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateDays();
  }, [form.StartDate, form.EndDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, empRes] = await Promise.all([
        getLeaveTypes(),
        getEmployees()
      ]);
      setLeaveTypes(typesRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
      
      // If only one employee, auto-select
      if (empRes.data?.data?.length === 1) {
        setForm(prev => ({ ...prev, EmployeeID: empRes.data.data[0].EmployeeID }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (form.StartDate && form.EndDate) {
      const start = new Date(form.StartDate);
      const end = new Date(form.EndDate);
      if (start <= end) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(diffDays);
      } else {
        setCalculatedDays(0);
      }
    } else {
      setCalculatedDays(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.EmployeeID) {
      toast.error('Please select an employee');
      return;
    }
    if (!form.LeaveTypeID) {
      toast.error('Please select a leave type');
      return;
    }
    if (!form.StartDate || !form.EndDate) {
      toast.error('Please select start and end dates');
      return;
    }
    if (calculatedDays <= 0) {
      toast.error('Invalid date range');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        EmployeeID: parseInt(form.EmployeeID),
        LeaveTypeID: parseInt(form.LeaveTypeID),
        StartDate: form.StartDate,
        EndDate: form.EndDate,
        Reason: form.Reason || ''
      };
      
      await applyLeave(submitData);
      toast.success('Leave request submitted successfully!');
      
      // Reset form
      setForm({
        EmployeeID: form.EmployeeID,
        LeaveTypeID: '',
        StartDate: '',
        EndDate: '',
        Reason: ''
      });
      setCalculatedDays(0);
      
      // Navigate to requests page after delay
      setTimeout(() => {
        navigate('/LeaveRequests');
      }, 2000);
      
    } catch (error) {
      console.error('Error applying for leave:', error);
      toast.error(error.response?.data?.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading form data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Row>
        <Col md={8} className="mx-auto">
          <Card>
            <Card.Header>
              <h4 className="mb-0">Apply for Leave</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee *</Form.Label>
                  <Form.Select
                    value={form.EmployeeID}
                    onChange={(e) => setForm({ ...form, EmployeeID: e.target.value })}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.EmployeeID} value={emp.EmployeeID}>
                        {emp.Name} ({emp.EmployeeCode})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Leave Type *</Form.Label>
                  <Form.Select
                    value={form.LeaveTypeID}
                    onChange={(e) => setForm({ ...form, LeaveTypeID: e.target.value })}
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map(type => (
                      <option key={type.LeaveTypeID} value={type.LeaveTypeID}>
                        {type.LeaveName} ({type.DefaultDays} days) {type.IsPaid ? '💰 Paid' : 'Unpaid'}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.StartDate}
                        onChange={(e) => setForm({ ...form, StartDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.EndDate}
                        onChange={(e) => setForm({ ...form, EndDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {calculatedDays > 0 && (
                  <Alert variant="info">
                    <strong>Total Days:</strong> {calculatedDays} day{calculatedDays > 1 ? 's' : ''}
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={form.Reason}
                    onChange={(e) => setForm({ ...form, Reason: e.target.value })}
                    placeholder="Enter reason for leave (optional)"
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/LeaveRequests')}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LeaveApply;