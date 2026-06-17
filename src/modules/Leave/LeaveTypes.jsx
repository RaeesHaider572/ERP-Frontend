// src/modules/Leave/LeaveTypes.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Spinner, Alert } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from '../../services/leaveService';

function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form, setForm] = useState({
    LeaveName: '',
    DefaultDays: 0,
    IsPaid: true,
    IsActive: true
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const res = await getLeaveTypes();
      setLeaveTypes(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
      toast.error('Failed to fetch leave types');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.LeaveName.trim()) {
      toast.error('Leave name is required');
      return;
    }

    try {
      if (editingType) {
        await updateLeaveType(editingType.LeaveTypeID, form);
        toast.success('Leave type updated successfully');
      } else {
        await createLeaveType(form);
        toast.success('Leave type created successfully');
      }
      setShowModal(false);
      fetchLeaveTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving leave type:', error);
      toast.error(error.response?.data?.message || 'Error saving leave type');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteLeaveType(id);
      toast.success('Leave type deleted successfully');
      fetchLeaveTypes();
    } catch (error) {
      console.error('Error deleting leave type:', error);
      toast.error(error.response?.data?.message || 'Error deleting leave type');
    }
  };

  const resetForm = () => {
    setForm({
      LeaveName: '',
      DefaultDays: 0,
      IsPaid: true,
      IsActive: true
    });
    setEditingType(null);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setForm({
      LeaveName: type.LeaveName,
      DefaultDays: type.DefaultDays,
      IsPaid: type.IsPaid === 1 || type.IsPaid === true,
      IsActive: type.IsActive === 1 || type.IsActive === true
    });
    setShowModal(true);
  };

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Leave Types</h2>
        <Button 
          variant="primary" 
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="bi bi-plus-circle"></i> Add Leave Type
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading leave types...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Default Days</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No leave types found
                  </td>
                </tr>
              ) : (
                leaveTypes.map(type => (
                  <tr key={type.LeaveTypeID}>
                    <td>{type.LeaveTypeID}</td>
                    <td><strong>{type.LeaveName}</strong></td>
                    <td>{type.DefaultDays}</td>
                    <td>{type.IsPaid ? '✅ Paid' : '❌ Unpaid'}</td>
                    <td>
                      <Badge bg={type.IsActive ? 'success' : 'secondary'}>
                        {type.IsActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="warning" 
                        className="me-1"
                        onClick={() => handleEdit(type)}
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger" 
                        onClick={() => handleDelete(type.LeaveTypeID, type.LeaveName)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingType ? 'Edit Leave Type' : 'Add New Leave Type'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Leave Name *</Form.Label>
              <Form.Control
                type="text"
                value={form.LeaveName}
                onChange={(e) => setForm({ ...form, LeaveName: e.target.value })}
                placeholder="Enter leave type name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Default Days *</Form.Label>
              <Form.Control
                type="number"
                value={form.DefaultDays}
                onChange={(e) => setForm({ ...form, DefaultDays: parseInt(e.target.value) || 0 })}
                placeholder="Number of days"
                min="0"
                required
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Paid Leave"
              checked={form.IsPaid}
              onChange={(e) => setForm({ ...form, IsPaid: e.target.checked })}
              className="mb-2"
            />

            <Form.Check
              type="checkbox"
              label="Active"
              checked={form.IsActive}
              onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingType ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default LeaveTypes;