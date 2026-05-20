import React, { useState, useEffect } from 'react';
import {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    getEmployeeStats
} from '../services/employeeService';
import './EmployeeManagement.css';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState(null);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [bulkData, setBulkData] = useState('');
    
    const [formData, setFormData] = useState({
        Name: '',
        deviceUid: ''
    });

    const [notification, setNotification] = useState({
        show: false,
        type: '',
        message: ''
    });

    // Load employees on component mount
    useEffect(() => {
        loadEmployees();
        loadStats();
    }, []);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const response = await getEmployees();
            if (response.data.success) {
                setEmployees(response.data.data);
            } else {
                showNotification('error', response.data.message || 'Failed to load employees');
            }
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await getEmployeeStats();
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const showNotification = (type, message) => {
        setNotification({ show: true, type, message });
        setTimeout(() => {
            setNotification({ show: false, type: '', message: '' });
        }, 3000);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            await loadEmployees();
            return;
        }
        
        setLoading(true);
        try {
            const response = await searchEmployees(searchTerm);
            if (response.data.success) {
                setEmployees(response.data.data);
            }
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.Name || !formData.deviceUid) {
            showNotification('error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            if (editingEmployee) {
                // Update existing employee
                const response = await updateEmployee(editingEmployee.EmployeeId, formData);
                if (response.data.success) {
                    showNotification('success', 'Employee updated successfully');
                    closeModal();
                    await loadEmployees();
                    await loadStats();
                } else {
                    showNotification('error', response.data.message || 'Update failed');
                }
            } else {
                // Create new employee
                const response = await createEmployee(formData);
                if (response.data.success) {
                    showNotification('success', 'Employee created successfully');
                    closeModal();
                    await loadEmployees();
                    await loadStats();
                } else {
                    showNotification('error', response.data.message || 'Creation failed');
                }
            }
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            Name: employee.Name,
            deviceUid: employee.DeviceUid
        });
        setShowModal(true);
    };

    const handleDelete = async (employee) => {
        if (window.confirm(`Are you sure you want to delete ${employee.Name}?`)) {
            setLoading(true);
            try {
                const response = await deleteEmployee(employee.EmployeeId);
                if (response.data.success) {
                    showNotification('success', 'Employee deleted successfully');
                    await loadEmployees();
                    await loadStats();
                } else {
                    showNotification('error', response.data.message || 'Delete failed');
                }
            } catch (error) {
                showNotification('error', error.response?.data?.message || 'Delete failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkImport = async () => {
        if (!bulkData.trim()) {
            showNotification('error', 'Please enter employee data');
            return;
        }

        try {
            // Parse CSV format: Name,DeviceUid
            const lines = bulkData.trim().split('\n');
            const employees = lines.map(line => {
                const [Name, deviceUid] = line.split(',').map(s => s.trim());
                return { Name, deviceUid: parseInt(deviceUid) };
            }).filter(emp => emp.Name && emp.deviceUid);

            if (employees.length === 0) {
                showNotification('error', 'No valid employees found');
                return;
            }

            setLoading(true);
            const response = await bulkImportEmployees(employees);
            if (response.data.success) {
                showNotification('success', response.data.message);
                setShowBulkImport(false);
                setBulkData('');
                await loadEmployees();
                await loadStats();
            } else {
                showNotification('error', response.data.message);
            }
        } catch (error) {
            showNotification('error', error.response?.data?.message || 'Bulk import failed');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({ Name: '', deviceUid: '' });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="employee-container">
            {/* Notification */}
            {notification.show && (
                <div className={`notification notification-${notification.type}`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="employee-header">
                <h1>Employee Management</h1>
                <div className="header-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Employee
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => setShowBulkImport(true)}
                    >
                        📥 Bulk Import
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalEmployees || 0}</div>
                        <div className="stat-label">Total Employees</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.uniqueDeviceUids || 0}</div>
                        <div className="stat-label">Unique Device UIDs</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.newLast7Days || 0}</div>
                        <div className="stat-label">New (Last 7 Days)</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.todayPunches || 0}</div>
                        <div className="stat-label">Today's Punches</div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by name or DeviceUid..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="search-input"
                />
                <button onClick={handleSearch} className="btn btn-search">
                    🔍 Search
                </button>
                <button onClick={loadEmployees} className="btn btn-refresh">
                    🔄 Refresh
                </button>
            </div>

            {/* Employees Table */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Device UID</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">
                                        No employees found
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.EmployeeId}>
                                        <td>{employee.EmployeeId}</td>
                                        <td>{employee.Name}</td>
                                        <td>{employee.DeviceUid}</td>
                                        <td>{formatDate(employee.CreatedAt)}</td>
                                        <td>{formatDate(employee.UpdatedAt)}</td>
                                        <td className="actions">
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(employee)}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(employee)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name *</label>
                                <input
                                    type="text"
                                    name="Name"
                                    value={formData.Name}
                                    onChange={handleInputChange}
                                    placeholder="Enter employee name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Device UID *</label>
                                <input
                                    type="number"
                                    name="deviceUid"
                                    value={formData.deviceUid}
                                    onChange={handleInputChange}
                                    placeholder="Enter device UID (e.g., 126)"
                                    required
                                />
                                <small>The ID that device sends when employee punches</small>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={loading}>
                                    {loading ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkImport && (
                <div className="modal-overlay" onClick={() => setShowBulkImport(false)}>
                    <div className="modal-content bulk-import-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Bulk Import Employees</h2>
                            <button className="modal-close" onClick={() => setShowBulkImport(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label>Enter employee data (CSV format)</label>
                            <textarea
                                rows="10"
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                placeholder="Name,DeviceUid
John Doe,200
Jane Smith,201
Ahmed Khan,202"
                                className="bulk-textarea"
                            />
                            <small>
                                Format: Name,DeviceUid (one per line)<br />
                                Example: Syed Raees Haider,126
                            </small>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowBulkImport(false)}>
                                Cancel
                            </button>
                            <button className="btn-submit" onClick={handleBulkImport} disabled={loading}>
                                {loading ? 'Importing...' : 'Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManagement;