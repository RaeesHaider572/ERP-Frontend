import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveTypes = () => {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        LeaveName: '',
        DefaultDays: 0,
        IsPaid: true,
        IsActive: true
    });

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/leave/types`);
            setLeaveTypes(response.data.data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
            alert('Failed to fetch leave types');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingType) {
                await axios.put(`${API_URL}/leave/types/${editingType.LeaveTypeID}`, formData);
                alert('Leave type updated successfully');
            } else {
                await axios.post(`${API_URL}/leave/types`, formData);
                alert('Leave type created successfully');
            }
            setShowModal(false);
            setEditingType(null);
            setFormData({ LeaveName: '', DefaultDays: 0, IsPaid: true, IsActive: true });
            fetchLeaveTypes();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this leave type?')) return;
        try {
            await axios.delete(`${API_URL}/leave/types/${id}`);
            alert('Leave type deleted successfully');
            fetchLeaveTypes();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    const handleEdit = (type) => {
        setEditingType(type);
        setFormData({
            LeaveName: type.LeaveName,
            DefaultDays: type.DefaultDays,
            IsPaid: type.IsPaid === 1 || type.IsPaid === true,
            IsActive: type.IsActive === 1 || type.IsActive === true
        });
        setShowModal(true);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Leave Types</h1>
                <button
                    onClick={() => {
                        setEditingType(null);
                        setFormData({ LeaveName: '', DefaultDays: 0, IsPaid: true, IsActive: true });
                        setShowModal(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add Leave Type
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {leaveTypes.map((type) => (
                                <tr key={type.LeaveTypeID}>
                                    <td className="px-6 py-4 whitespace-nowrap">{type.LeaveTypeID}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{type.LeaveName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{type.DefaultDays}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {type.IsPaid ? '✅' : '❌'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {type.IsActive ? '✅' : '❌'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleEdit(type)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(type.LeaveTypeID)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">
                            {editingType ? 'Edit Leave Type' : 'Add Leave Type'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Leave Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.LeaveName}
                                    onChange={(e) => setFormData({ ...formData, LeaveName: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Days
                                </label>
                                <input
                                    type="number"
                                    value={formData.DefaultDays}
                                    onChange={(e) => setFormData({ ...formData, DefaultDays: parseInt(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                    min="0"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.IsPaid}
                                        onChange={(e) => setFormData({ ...formData, IsPaid: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Paid Leave
                                </label>
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.IsActive}
                                        onChange={(e) => setFormData({ ...formData, IsActive: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Active
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveTypes;