import React, { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Container, Row, Col,
  FormControl, InputGroup, Badge, Spinner
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats
} from "../../services/employeeService";
import { useNavigate } from 'react-router-dom';
// ✅ ADD THIS IMPORT
import { useAuth } from "../../contexts/AuthContext";

function Employees() {
  // ✅ ADD THIS: Get user and role info
  const { user, isCustodian, isHR } = useAuth();
  const navigate = useNavigate();
  
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    Name: "",
    DeviceUid: "",
    Email: "",
    Department: "",
    Designation: "",
    JoinDate: "",
    EmployeeCode: ""
  });

  const handleApplyForTeamMember = (employeeCode) => {
    navigate(`/LeaveApply?employeeCode=${employeeCode}`);
  };

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      console.log("Employees response:", res.data);

      let employeesData = [];
      if (res.data && res.data.data) {
        employeesData = Array.isArray(res.data.data) ? res.data.data : [];
      } else if (res.data && Array.isArray(res.data)) {
        employeesData = res.data;
      }

      setEmployees(employeesData);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error(err.response?.data?.message || "Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await getEmployeeStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.Name.trim()) {
      toast.error("Employee name is required");
      return;
    }

    if (!form.DeviceUid) {
      toast.error("Device UID is required");
      return;
    }

    try {
      const submitData = {
        ...form,
        DeviceUid: parseInt(form.DeviceUid),
        JoinDate: form.JoinDate || null
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.EmployeeID, submitData);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(submitData);
        toast.success("Employee created successfully");
      }

      setShowModal(false);
      resetForm();
      fetchEmployees();
      fetchStats();
    } catch (err) {
      console.error("Error saving employee:", err);
      toast.error(err.response?.data?.message || "Error saving employee");
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      Name: employee.Name || "",
      DeviceUid: employee.DeviceUid || "",
      Email: employee.Email || "",
      Department: employee.Department || "",
      Designation: employee.Designation || "",
      JoinDate: employee.JoinDate ? employee.JoinDate.split('T')[0] : "",
      EmployeeCode: employee.EmployeeCode || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
      try {
        await deleteEmployee(employeeId);
        toast.success("Employee deleted successfully");
        fetchEmployees();
        fetchStats();
      } catch (err) {
        console.error("Error deleting employee:", err);
        toast.error(err.response?.data?.message || "Error deleting employee");
      }
    }
  };

  const resetForm = () => {
    setForm({
      Name: "",
      DeviceUid: "",
      Email: "",
      Department: "",
      Designation: "",
      JoinDate: "",
      EmployeeCode: ""
    });
    setEditingEmployee(null);
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (emp.Name && emp.Name.toLowerCase().includes(searchLower)) ||
      (emp.EmployeeCode && emp.EmployeeCode.toLowerCase().includes(searchLower)) ||
      (emp.DeviceUid && emp.DeviceUid.toString().includes(searchLower)) ||
      (emp.Email && emp.Email.toLowerCase().includes(searchLower)) ||
      (emp.Department && emp.Department.toLowerCase().includes(searchLower))
    );
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Container fluid className="py-3">
      <ToastContainer position="top-right" autoClose={3000} />

      <Row className="mb-4">
        <Col md={8}>
          <h2 className="mb-1">Employee Management</h2>
          <p className="text-muted">Manage your workforce and device integration</p>
        </Col>
        <Col md={4} className="text-end">
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mb-2"
          >
            <i className="bi bi-plus-circle"></i> Add New Employee
          </Button>
        </Col>
      </Row>

      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <div className="bg-primary text-white p-3 rounded">
              <h6>Total Employees</h6>
              <h3>{stats.totalEmployees || 0}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-success text-white p-3 rounded">
              <h6>Unique Devices</h6>
              <h3>{stats.uniqueDeviceUids || 0}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-info text-white p-3 rounded">
              <h6>New This Week</h6>
              <h3>{stats.newLast7Days || 0}</h3>
            </div>
          </Col>
          <Col md={3}>
            <div className="bg-warning text-white p-3 rounded">
              <h6>Total Departments</h6>
              <h3>{stats.totalDepartments || 0}</h3>
            </div>
          </Col>
        </Row>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <FormControl
              placeholder="Search by name, code, department, email, or device UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="outline-info" onClick={() => { fetchEmployees(); fetchStats(); }}>
            Refresh
          </Button>
          <span className="ms-2 text-muted">
            {filteredEmployees.length} / {employees.length} employees
          </span>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading employees...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>ID</th>
                <th>Code</th>
                <th>Name</th>
                <th>Device UID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    {employees.length === 0 ? (
                      <>
                        <p className="mb-2">No employees found</p>
                        <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
                          Add Your First Employee
                        </Button>
                      </>
                    ) : (
                      "No matching employees"
                    )}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.EmployeeID}>
                    <td>{emp.EmployeeID}</td>
                    <td>
                      <Badge bg="secondary">{emp.EmployeeCode || "-"}</Badge>
                    </td>
                    <td><strong>{emp.Name}</strong></td>
                    <td>
                      <Badge bg="info">{emp.DeviceUid || "-"}</Badge>
                    </td>
                    <td>{emp.Department || "-"}</td>
                    <td>{emp.Designation || "-"}</td>
                    <td>{emp.Email || "-"}</td>
                    <td>{formatDate(emp.JoinDate)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleEdit(emp)}
                        className="me-1"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(emp.EmployeeID, emp.Name)}
                      >
                        <i className="bi bi-trash"></i> Delete
                      </Button>
                      {/* ✅ This will now work because isCustodian and user are defined */}
                      {isCustodian && emp.EmployeeID !== user?.EmployeeID && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleApplyForTeamMember(emp.EmployeeCode)}
                          title="Apply for Leave for this team member"
                          className="ms-1"
                        >
                          <i className="bi bi-calendar-plus"></i> Apply Leave
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEmployee ? `Edit Employee: ${editingEmployee.Name}` : "Add New Employee"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="Name"
                    value={form.Name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="EmployeeCode"
                    value={form.EmployeeCode}
                    onChange={handleChange}
                    placeholder="Auto-generated if left blank"
                    disabled={!!editingEmployee}
                  />
                  <Form.Text className="text-muted">
                    {editingEmployee ? "Employee code cannot be changed" : "Leave blank for auto-generation"}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Device UID *</Form.Label>
                  <Form.Control
                    type="number"
                    name="DeviceUid"
                    value={form.DeviceUid}
                    onChange={handleChange}
                    placeholder="Biometric device user ID"
                    required
                  />
                  <Form.Text className="text-muted">
                    Unique ID from biometric device
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="Email"
                    value={form.Email}
                    onChange={handleChange}
                    placeholder="employee@company.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Control
                    type="text"
                    name="Department"
                    value={form.Department}
                    onChange={handleChange}
                    placeholder="e.g., IT, HR, Finance"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Designation</Form.Label>
                  <Form.Control
                    type="text"
                    name="Designation"
                    value={form.Designation}
                    onChange={handleChange}
                    placeholder="e.g., Manager, Developer"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Join Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="JoinDate"
                    value={form.JoinDate}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            {editingEmployee && (
              <div className="bg-light p-3 rounded">
                <small className="text-muted">
                  Created: {formatDate(editingEmployee.CreatedAt)}
                  {editingEmployee.UpdatedAt && ` | Updated: ${formatDate(editingEmployee.UpdatedAt)}`}
                </small>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {editingEmployee ? "Update Employee" : "Create Employee"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Employees;