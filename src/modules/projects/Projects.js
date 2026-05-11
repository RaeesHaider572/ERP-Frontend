import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Container, Row, Col,} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { getProjects, createProject, updateProject, deleteProject } from "../../services/projectService";

function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: ""
  });

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data.data);
    } catch (err) {
      toast.error("Error fetching projects");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingProject) {
        await updateProject(editingProject.project_code, form);
        toast.success("Project updated");
      } else {
        await createProject(form);
        toast.success("Project created");
      }
      setShowModal(false);
      setForm({ name: "", code: "" });
      setEditingProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving project");
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({
      name: project.project_name,
      code: project.project_code
    });
    setShowModal(true);
  };

  const handleDelete = async (project_code) => {
    if (window.confirm("Are you sure?")) {
      try {
        await deleteProject(project_code);
        toast.success("Project deleted");
        fetchProjects();
      } catch (err) {
        toast.error("Error deleting project");
      }
    }
  };

  return (
    <Container maxWidth="xxl" sx={{ py: { xs: 2, sm: 3, md: 0 }, px: { xs: 2, sm: 3, md: 0 }, }} >
      <ToastContainer />
      <Row>
        <Col sm={8}><h2>Projects List</h2></Col>
        <Col sm={4} className="text-end">
          <Button className="mb-3" onClick={() => setShowModal(true)}>Add New Project</Button>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.project_code}>
              <td>{p.project_code}</td>
              <td>{p.project_name}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleEdit(p)}>Edit</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(p.project_code)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProject ? "Edit Project" : "Add Project"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Project Code</Form.Label>
              <Form.Control
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="Enter project code"
                disabled={!!editingProject} // Disable editing code if updating
              />
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter project name"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSubmit}>{editingProject ? "Update" : "Create"}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Projects;
