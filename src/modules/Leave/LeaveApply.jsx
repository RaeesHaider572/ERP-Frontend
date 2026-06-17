import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveApply = ({ employeeId, onSuccess }) => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        EmployeeID: employeeId || '',
        LeaveTypeID: '',
        StartDate: '',
        EndDate: '',
        Reason: ''
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchLeaveTypes();
        if (employeeId) {
            setFormData(prev => ({ ...prev, EmployeeID: employeeId }));
        }
    }, [employeeId]);

    const fetchLeaveTypes = async () => {
        try {
            const response = await axios.get(`${API_URL}/leave/types`);
            setLeaveTypes(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_URL}/leave/apply`, formData);
            alert('Leave request submitted successfully');
            setFormData({
                ...formData,
                LeaveTypeID: '',
                StartDate: '',
                EndDate: '',
                Reason: ''
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to apply for leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Type *
                    </label>
                    <select
                        value={formData.LeaveTypeID}
                        onChange={(e) => setFormData({ ...formData, LeaveTypeID: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map((lt) => (
                            <option key={lt.LeaveTypeID} value={lt.LeaveTypeID}>
                                {lt.LeaveName} ({lt.DefaultDays} days)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            value={formData.StartDate}
                            onChange={(e) => setFormData({ ...formData, StartDate: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date *
                        </label>
                        <input
                            type="date"
                            value={formData.EndDate}
                            onChange={(e) => setFormData({ ...formData, EndDate: e.target.value })}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            required
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reason
                    </label>
                    <textarea
                        value={formData.Reason}
                        onChange={(e) => setFormData({ ...formData, Reason: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows="3"
                        placeholder="Enter reason for leave..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Submit Request'}
                </button>
            </form>
        </div>
    );
};

export default LeaveApply;