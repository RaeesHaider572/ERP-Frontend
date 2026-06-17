// src/modules/Leave/LeaveDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getLeaveStats, getLeaveRequests } from '../../services/leaveService';

function LeaveDashboard() {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes] = await Promise.all([
        getLeaveStats(),
        getLeaveRequests({ status: 'Pending' })
      ]);
      setStats(statsRes.data?.data || null);
      setRecentRequests(requestsRes.data?.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Leave Dashboard</h2>
        <Button variant="primary" as={Link} to="/LeaveApply">
          <i className="bi bi-plus-circle"></i> Apply for Leave
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6}>
          <Card className="bg-primary text-white">
            <Card.Body>
              <h6>Total Requests</h6>
              <h3>{stats?.totalRequests || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="bg-warning text-white">
            <Card.Body>
              <h6>Pending</h6>
              <h3>{stats?.pendingRequests || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="bg-success text-white">
            <Card.Body>
              <h6>Approved</h6>
              <h3>{stats?.approvedRequests || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="bg-danger text-white">
            <Card.Body>
              <h6>Rejected</h6>
              <h3>{stats?.rejectedRequests || 0}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <h5>Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="primary" as={Link} to="/LeaveApply">
                  <i className="bi bi-plus-circle"></i> Apply for Leave
                </Button>
                <Button variant="info" as={Link} to="/LeaveTypes">
                  <i className="bi bi-list"></i> Manage Leave Types
                </Button>
                <Button variant="warning" as={Link} to="/LeaveRequests">
                  <i className="bi bi-clock"></i> View All Requests
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Pending Requests */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Pending Requests</h5>
            </Card.Header>
            <Card.Body>
              {recentRequests.length === 0 ? (
                <p className="text-muted text-center">No pending requests</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Duration</th>
                        <th>Days</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRequests.map(req => (
                        <tr key={req.RequestID}>
                          <td>
                            <strong>{req.EmployeeName}</strong>
                            <br />
                            <small className="text-muted">{req.EmployeeCode}</small>
                          </td>
                          <td>{req.LeaveName}</td>
                          <td>
                            {new Date(req.StartDate).toLocaleDateString()} - {new Date(req.EndDate).toLocaleDateString()}
                          </td>
                          <td>{req.TotalDays}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" as={Link} to={`/LeaveRequests/${req.RequestID}`}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default LeaveDashboard;