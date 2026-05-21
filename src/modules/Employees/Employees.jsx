import React, { useEffect, useState } from "react";
import { 
  Table, Button, Modal, Form, Container, Row, Col,
  FormControl, InputGroup
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { 
  getEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from "../../services/employeeService";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({
    Name: "",
    DeviceUid: "",
    DeviceName: "",
    Department: "",
    Designation: "",
    Email: "",
    Phone: "",
    Salary: "",
    Status: "active"
  });

  // Fetch employees - SIMPLE like projects
  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      console.log("Employees response:", res.data);
      
      // Handle different response structures
      let employeesData = [];
      if (res.data && res.data.data && res.data.data.employees) {
        employeesData = res.data.data.employees;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        employeesData = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        employeesData = res.data;
      } else if (res.data && res.data.employees) {
        employeesData = res.data.employees;
      }
      
      setEmployees(employeesData);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error(err.response?.data?.message || "Error fetching employees");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.Name.trim()) {
      toast.error("Employee name is required");
      return;
    }

    try {
      const submitData = {
        ...form,
        DeviceUid: form.DeviceUid ? parseInt(form.DeviceUid) : null,
        Salary: form.Salary ? parseFloat(form.Salary) : 0
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.EmployeeId, submitData);
        toast.success("Employee updated successfully");
      } else {
        await createEmployee(submitData);
        toast.success("Employee created successfully");
      }
      
      setShowModal(false);
      resetForm();
      fetchEmployees();
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
      DeviceName: employee.DeviceName || "",
      Department: employee.Department || "",
      Designation: employee.Designation || "",
      Email: employee.Email || "",
      Phone: employee.Phone || "",
      Salary: employee.Salary || "",
      Status: employee.Status || "active"
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
      try {
        await deleteEmployee(employeeId);
        toast.success("Employee deleted successfully");
        fetchEmployees();
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
      DeviceName: "",
      Department: "",
      Designation: "",
      Email: "",
      Phone: "",
      Salary: "",
      Status: "active"
    });
    setEditingEmployee(null);
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (emp.Name && emp.Name.toLowerCase().includes(searchLower)) ||
      (emp.DeviceUid && emp.DeviceUid.toString().includes(searchLower)) ||
      (emp.Email && emp.Email.toLowerCase().includes(searchLower)) ||
      (emp.Phone && emp.Phone.includes(searchLower))
    );
  });

  return (
    <Container fluid className="py-3">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <Row className="mb-3">
        <Col sm={6}>
          <h2>Employee Management</h2>
          <p className="text-muted">Manage your workforce and device integration</p>
        </Col>
        <Col sm={6} className="text-end">
          <Button 
            variant="primary" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add New Employee
          </Button>
        </Col>
      </Row>

      {/* Search Bar */}
      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <FormControl
              placeholder="Search by name, device UID, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline-secondary" onClick={() => setSearchTerm("")}>
              Clear
            </Button>
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="outline-info" onClick={fetchEmployees}>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Employees Table */}
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Device UID</th>
            <th>Device Name</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center">
                {employees.length === 0 ? "No employees found" : "No matching employees"}
              </td>
            </tr>
          ) : (
            filteredEmployees.map((emp) => (
              <tr key={emp.EmployeeId}>
                <td>{emp.EmployeeId}</td>
                <td><strong>{emp.Name}</strong></td>
                <td>{emp.DeviceUid || "-"}</td>
                <td>{emp.DeviceName || "-"}</td>
                <td>{emp.Department || "-"}</td>
                <td>{emp.Designation || "-"}</td>
                <td>{emp.Email || "-"}</td>
                <td>{emp.Phone || "-"}</td>
                <td>
                  <span className={`badge bg-${emp.Status === 'active' ? 'success' : emp.Status === 'inactive' ? 'secondary' : 'warning'}`}>
                    {emp.Status || "active"}
                  </span>
                </td>
                <td>
                  <Button 
                    size="sm" 
                    variant="warning" 
                    onClick={() => handleEdit(emp)}
                    className="me-2"
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleDelete(emp.EmployeeId, emp.Name)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
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
                  <Form.Label>Device UID</Form.Label>
                  <Form.Control
                    type="number"
                    name="DeviceUid"
                    value={form.DeviceUid}
                    onChange={handleChange}
                    placeholder="Biometric device user ID"
                  />
                  <Form.Text className="text-muted">
                    User ID from biometric device
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Device Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="DeviceName"
                    value={form.DeviceName}
                    onChange={handleChange}
                    placeholder="e.g., Oasis Office, Head Office"
                  />
                </Form.Group>
              </Col>
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
            </Row>

            <Row>
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
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="Email"
                    value={form.Email}
                    onChange={handleChange}
                    placeholder="employee@example.com"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="Phone"
                    value={form.Phone}
                    onChange={handleChange}
                    placeholder="03001234567"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salary</Form.Label>
                  <Form.Control
                    type="number"
                    name="Salary"
                    value={form.Salary}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="Status"
                    value={form.Status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
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