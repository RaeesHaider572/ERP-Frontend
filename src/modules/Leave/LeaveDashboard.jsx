import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LeaveDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calendarData, setCalendarData] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchStats();
        fetchCalendar();
    }, [currentMonth, currentYear]);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/leave/stats`);
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchCalendar = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/leave/calendar`, {
                params: { month: currentMonth, year: currentYear }
            });
            setCalendarData(response.data.data || []);
        } catch (error) {
            console.error('Error fetching calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Leave Dashboard</h1>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        <h3 className="text-sm text-gray-500">Total Requests</h3>
                        <p className="text-2xl font-bold">{stats.totalRequests || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg shadow-md border border-yellow-200">
                        <h3 className="text-sm text-gray-500">Pending</h3>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg shadow-md border border-green-200">
                        <h3 className="text-sm text-gray-500">Approved</h3>
                        <p className="text-2xl font-bold text-green-600">{stats.approvedRequests || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg shadow-md border border-red-200">
                        <h3 className="text-sm text-gray-500">Rejected</h3>
                        <p className="text-2xl font-bold text-red-600">{stats.rejectedRequests || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg shadow-md border border-blue-200">
                        <h3 className="text-sm text-gray-500">Total Employees</h3>
                        <p className="text-2xl font-bold text-blue-600">{stats.totalEmployees || 0}</p>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Leave Calendar</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => {
                                if (currentMonth === 1) {
                                    setCurrentMonth(12);
                                    setCurrentYear(currentYear - 1);
                                } else {
                                    setCurrentMonth(currentMonth - 1);
                                }
                            }}
                            className="px-3 py-1 border rounded hover:bg-gray-100"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1">
                            {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => {
                                if (currentMonth === 12) {
                                    setCurrentMonth(1);
                                    setCurrentYear(currentYear + 1);
                                } else {
                                    setCurrentMonth(currentMonth + 1);
                                }
                            }}
                            className="px-3 py-1 border rounded hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">Loading calendar...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left">Employee</th>
                                    <th className="px-4 py-2 text-left">Leave Type</th>
                                    <th className="px-4 py-2 text-left">From</th>
                                    <th className="px-4 py-2 text-left">To</th>
                                    <th className="px-4 py-2 text-left">Days</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calendarData.map((item) => (
                                    <tr key={item.RequestID} className="border-t">
                                        <td className="px-4 py-2">
                                            {item.EmployeeName}
                                            <div className="text-sm text-gray-500">{item.EmployeeCode}</div>
                                        </td>
                                        <td className="px-4 py-2">{item.LeaveName}</td>
                                        <td className="px-4 py-2">{formatDate(item.StartDate)}</td>
                                        <td className="px-4 py-2">{formatDate(item.EndDate)}</td>
                                        <td className="px-4 py-2">{item.TotalDays}</td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                item.Status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {item.Status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {calendarData.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-gray-500">
                                            No leave requests found for this month
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaveDashboard;