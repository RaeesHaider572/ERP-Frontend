import api from "./authService";

const API_URL = "/leave";

// ==================== LEAVE TYPES ====================
export const getLeaveTypes = () => api.get(`${API_URL}/types`);
export const getLeaveTypeById = (id) => api.get(`${API_URL}/types/${id}`);
export const createLeaveType = (data) => api.post(`${API_URL}/types`, data);
export const updateLeaveType = (id, data) => api.put(`${API_URL}/types/${id}`, data);
export const deleteLeaveType = (id) => api.delete(`${API_URL}/types/${id}`);

// ==================== LEAVE BALANCES ====================
export const getLeaveBalances = (employeeId, year) => {
    const query = year ? `?year=${year}` : '';
    return api.get(`${API_URL}/balances/employee/${employeeId}${query}`);
};
export const getAllLeaveBalances = (year) => {
    const query = year ? `?year=${year}` : '';
    return api.get(`${API_URL}/balances${query}`);
};
export const resetLeaveBalances = (year) => api.post(`${API_URL}/balances/reset`, { year });

// ==================== LEAVE REQUESTS ====================
export const getEmployeeLeaveRequests = (employeeId) => 
    api.get(`${API_URL}/employee/${employeeId}`);

// ✅ ADD THIS - The missing export
export const getLeaveRequests = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.leaveTypeId) params.append('leaveTypeId', filters.leaveTypeId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return api.get(`${API_URL}/requests${queryString ? `?${queryString}` : ''}`);
};

// Alias for backward compatibility
export const getAllLeaveRequests = getLeaveRequests;

export const getLeaveRequestById = (id) => api.get(`${API_URL}/requests/${id}`);
export const applyLeave = (data) => api.post(`${API_URL}/apply`, data);
export const updateLeaveStatus = (id, data) => api.put(`${API_URL}/requests/${id}/status`, data);

// ==================== STATISTICS & CALENDAR ====================
export const getLeaveStats = () => api.get(`${API_URL}/stats`);
export const getLeaveCalendar = (month, year) => 
    api.get(`${API_URL}/calendar?month=${month}&year=${year}`);

// ==================== DEFAULT EXPORT ====================
const leaveService = {
    getLeaveTypes,
    getLeaveTypeById,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    getLeaveBalances,
    getAllLeaveBalances,
    resetLeaveBalances,
    getEmployeeLeaveRequests,
    getLeaveRequests,  // ✅ Added here too
    getAllLeaveRequests,
    getLeaveRequestById,
    applyLeave,
    updateLeaveStatus,
    getLeaveStats,
    getLeaveCalendar
};

export default leaveService;