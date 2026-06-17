import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveRequests = () => {
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState({
        status: '',
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: ''
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchLeaveRequests();
        fetchEmployees();
        fetchLeaveTypes();
    }, [filter]);

    const fetchLeaveRequests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(filter);
            const response = await axios.get(`${API_URL}/leave/requests?${params}`);
            setRequests(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_URL}/employees`);
            setEmployees(response.data.data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/leave/types`);
            setLeaveTypes(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    };

    const handleStatusUpdate = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this leave request?`)) return;
        
        try {
            await axios.put(`${API_URL}/leave/requests/${requestId}/status`, {
                status,
                reviewedBy: 1 // Replace with actual admin ID
            });
            alert(`Leave request ${status.toLowerCase()} successfully`);
            fetchLeaveRequests();
        } catch (error) {
            alert(error.response?.data?.message || 'Update failed');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Approved': return 'bg-green-100 text-green-800';
            case 'Rejected': return 'bg-red-100 text-red-800';
            case 'Cancelled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Leave Requests</h1>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                        value={filter.employeeId}
                        onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="">All Employees</option>
                        {employees.map((emp) => (
                            <option key={emp.EmployeeID} value={emp.EmployeeID}>
                                {emp.Name} ({emp.EmployeeCode})
                            </option>
                        ))}
                    </select>
                    <select
                        value={filter.leaveTypeId}
                        onChange={(e) => setFilter({ ...filter, leaveTypeId: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                    >
                        <option value="">All Leave Types</option>
                        {leaveTypes.map((lt) => (
                            <option key={lt.LeaveTypeID} value={lt.LeaveTypeID}>
                                {lt.LeaveName}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                        placeholder="Start Date"
                    />
                    <input
                        type="date"
                        value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-2"
                        placeholder="End Date"
                    />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req.RequestID}>
                                    <td className="px-6 py-4 whitespace-nowrap">{req.RequestID}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>{req.EmployeeName}</div>
                                        <div className="text-sm text-gray-500">{req.EmployeeCode}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{req.LeaveName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(req.StartDate).toLocaleDateString()} - {new Date(req.EndDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{req.TotalDays}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.Status)}`}>
                                            {req.Status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(req.AppliedDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {req.Status === 'Pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(req.RequestID, 'Approved')}
                                                    className="text-green-600 hover:text-green-900 mr-2"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(req.RequestID, 'Rejected')}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {req.Status === 'Approved' && (
                                            <span className="text-green-600">✓ Approved</span>
                                        )}
                                        {req.Status === 'Rejected' && (
                                            <span className="text-red-600">✗ Rejected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LeaveRequests;