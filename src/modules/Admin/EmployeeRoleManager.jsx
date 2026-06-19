import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Badge } from 'react-bootstrap';
import { getEmployees, updateEmployee } from '../../services/employeeService';

const EmployeeRoleManager = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await getEmployees();
            setEmployees(res.data?.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleRoleUpdate = async (employeeId, newRole) => {
        try {
            await updateEmployee(employeeId, { Role: newRole });
            alert('Employee role updated successfully!');
            fetchEmployees();
        } catch (error) {
            alert('Error updating role: ' + error.message);
        }
    };

    return (
        <div>
            <h3>Employee Role Management</h3>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Current Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                        <tr key={emp.EmployeeID}>
                            <td>{emp.EmployeeCode}</td>
                            <td>{emp.Name}</td>
                            <td>
                                <Badge bg={
                                    emp.Role === 'HR' ? 'danger' :
                                    emp.Role === 'custodian' ? 'warning' :
                                    'secondary'
                                }>
                                    {emp.Role || 'employee'}
                                </Badge>
                            </td>
                            <td>
                                <Form.Select
                                    size="sm"
                                    value={emp.Role || 'employee'}
                                    onChange={(e) => handleRoleUpdate(emp.EmployeeID, e.target.value)}
                                >
                                    <option value="employee">Employee</option>
                                    <option value="custodian">Custodian</option>
                                    <option value="HR">HR</option>
                                </Form.Select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default EmployeeRoleManager;