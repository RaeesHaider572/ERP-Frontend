// src/modules/Leave/LeaveRequests.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Button, Badge, Spinner, Form, Row, Col, Modal } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  getLeaveRequests,
  updateLeaveStatus, 
  getLeaveTypes, 
  getEmployees,
  getLeaveRequestById 
} from '../../services/leaveService';

function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    employeeId: '',
    leaveTypeId: ''
  });

  useEffect(() => {
    fetchData();
    fetchFilters();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getLeaveRequests(filters);
      setRequests(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [typesRes, empRes] = await Promise.all([
        getLeaveTypes(),
        getEmployees()
      ]);
      setLeaveTypes(typesRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
      await updateLeaveStatus(requestId, { status, reviewedBy: 1 });
      toast.success(`Leave request ${status.toLowerCase()} successfully`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Error updating status');
    }
  };

  const viewRequestDetails = async (requestId) => {
    try {
      const res = await getLeaveRequestById(requestId);
      setSelectedRequest(res.data?.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching request details:', error);
      toast.error('Failed to fetch request details');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'Pending': 'warning',
      'Approved': 'success',
      'Rejected': 'danger',
      'Cancelled': 'secondary'
    };
    return <Badge bg={colors[status] || 'secondary'}>{status}</Badge>;
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      employeeId: '',
      leaveTypeId: ''
    });
  };

  return (
    <Container fluid className="py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Leave Requests</h2>
        <Button variant="primary" href="/LeaveApply">
          <i className="bi bi-plus-circle"></i> Apply for Leave
        </Button>
      </div>

      {/* Filters */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.employeeId}
            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
          >
            <option value="">All Employees</option>
            {employees.map(emp => (
              <option key={emp.EmployeeID} value={emp.EmployeeID}>
                {emp.Name} ({emp.EmployeeCode})
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
            value={filters.leaveTypeId}
            onChange={(e) => setFilters({ ...filters, leaveTypeId: e.target.value })}
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map(type => (
              <option key={type.LeaveTypeID} value={type.LeaveTypeID}>
                {type.LeaveName}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Button variant="outline-secondary" onClick={clearFilters} className="me-2">
            Clear Filters
          </Button>
          <Button variant="outline-primary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </Button>
        </Col>
      </Row>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading requests...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Status</th>
                <th>Applied</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No leave requests found
                  </td>
                </tr>
              ) : (
                requests.map(req => (
                  <tr key={req.RequestID}>
                    <td>{req.RequestID}</td>
                    <td>
                      <div><strong>{req.EmployeeName}</strong></div>
                      <small className="text-muted">{req.EmployeeCode}</small>
                    </td>
                    <td>{req.LeaveName}</td>
                    <td>
                      {new Date(req.StartDate).toLocaleDateString()} - {new Date(req.EndDate).toLocaleDateString()}
                    </td>
                    <td>{req.TotalDays}</td>
                    <td>{getStatusBadge(req.Status)}</td>
                    <td>{new Date(req.AppliedDate).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="info" 
                        className="me-1"
                        onClick={() => viewRequestDetails(req.RequestID)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                      {req.Status === 'Pending' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="success" 
                            className="me-1"
                            onClick={() => handleStatusUpdate(req.RequestID, 'Approved')}
                          >
                            <i className="bi bi-check"></i>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleStatusUpdate(req.RequestID, 'Rejected')}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Leave Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Employee:</strong> {selectedRequest.EmployeeName} ({selectedRequest.EmployeeCode})
                </Col>
                <Col md={6}>
                  <strong>Leave Type:</strong> {selectedRequest.LeaveName}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Start Date:</strong> {new Date(selectedRequest.StartDate).toLocaleDateString()}
                </Col>
                <Col md={6}>
                  <strong>End Date:</strong> {new Date(selectedRequest.EndDate).toLocaleDateString()}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Total Days:</strong> {selectedRequest.TotalDays}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> {getStatusBadge(selectedRequest.Status)}
                </Col>
              </Row>
              {selectedRequest.Reason && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Reason:</strong> {selectedRequest.Reason}
                  </Col>
                </Row>
              )}
              {selectedRequest.Comments && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Comments:</strong> {selectedRequest.Comments}
                  </Col>
                </Row>
              )}
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Applied:</strong> {new Date(selectedRequest.AppliedDate).toLocaleString()}
                </Col>
                {selectedRequest.ReviewDate && (
                  <Col md={6}>
                    <strong>Reviewed:</strong> {new Date(selectedRequest.ReviewDate).toLocaleString()}
                  </Col>
                )}
              </Row>
              {selectedRequest.ReviewedByName && (
                <Row>
                  <Col md={12}>
                    <strong>Reviewed By:</strong> {selectedRequest.ReviewedByName}
                  </Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>
          {selectedRequest?.Status === 'Pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => {
                  handleStatusUpdate(selectedRequest.RequestID, 'Approved');
                  setShowDetailModal(false);
                }}
              >
                Approve
              </Button>
              <Button 
                variant="danger"
                onClick={() => {
                  handleStatusUpdate(selectedRequest.RequestID, 'Rejected');
                  setShowDetailModal(false);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default LeaveRequests;