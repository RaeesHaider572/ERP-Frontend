import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Container, Row, Col } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import { getPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType } from "../../services/paymentTypeService";

function PaymentTypes() {
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPaymentType, setEditingPaymentType] = useState(null);
  const [form, setForm] = useState({
    payment_type: ""
  });

  const fetchPaymentTypes = async () => {
    try {
      const res = await getPaymentTypes();
      setPaymentTypes(res.data.data); // expects backend response: { data: [...] }
    } catch (err) {
      toast.error("Error fetching payment types");
    }
  };

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingPaymentType) {
        await updatePaymentType(editingPaymentType.id, form);
        toast.success("Payment type updated");
      } else {
        await createPaymentType(form);
        toast.success("Payment type created");
      }
      setShowModal(false);
      setForm({ payment_type: "" });
      setEditingPaymentType(null);
      fetchPaymentTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving payment type");
    }
  };

  const handleEdit = (pt) => {
    setEditingPaymentType(pt);
    setForm({ payment_type: pt.payment_type });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await deletePaymentType(id);
        toast.success("Payment type deleted");
        fetchPaymentTypes();
      } catch (err) {
        toast.error("Error deleting payment type");
      }
    }
  };

  return (
    <Container maxWidth="sm" className="mt-4">
      <ToastContainer />
      <Row>
        <Col sm={8}><h2>Payment Types List</h2></Col>
        <Col sm={4} className="text-end">
          <Button className="mb-3" onClick={() => setShowModal(true)}>Add New Payment Type</Button>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Payment Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paymentTypes.map(pt => (
            <tr key={pt.id}>
              <td>{pt.id}</td>
              <td>{pt.payment_type}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleEdit(pt)}>Edit</Button>{" "}
                <Button size="sm" variant="danger" onClick={() => handleDelete(pt.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingPaymentType ? "Edit Payment Type" : "Add Payment Type"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Payment Type</Form.Label>
              <Form.Control
                name="payment_type"
                value={form.payment_type}
                onChange={handleChange}
                placeholder="Enter payment type"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
          <Button variant="primary" onClick={handleSubmit}>{editingPaymentType ? "Update" : "Create"}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default PaymentTypes;
