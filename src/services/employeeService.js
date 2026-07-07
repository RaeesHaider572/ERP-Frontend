import api from "./authService";

const API_URL = "/employees";

// ============================================
// EMPLOYEE CRUD OPERATIONS
// ============================================

// Get all employees (HR sees all, Custodian sees only their team)
export const getEmployees = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.role) params.append('role', filters.role);
    if (filters.search) params.append('search', filters.search);
    const queryString = params.toString();
    console.log("👥 Fetching employees...");
    return api.get(`${API_URL}${queryString ? `?${queryString}` : ''}`);
};

// Get employee by ID
export const getEmployeeById = (id) => {
    console.log(`🔍 Fetching employee by ID: ${id}`);
    return api.get(`${API_URL}/${id}`);
};

// Get employee by code
export const getEmployeeByCode = (code) => {
    console.log(`🔍 Fetching employee by code: ${code}`);
    return api.get(`${API_URL}/code/${code}`);
};

// Get employee by Device UID
export const getEmployeeByDeviceUid = (deviceUid) => {
    console.log(`🔍 Fetching employee by Device UID: ${deviceUid}`);
    return api.get(`${API_URL}/device/${deviceUid}`);
};

// Search employees
export const searchEmployees = (searchTerm) => {
    console.log(`🔍 Searching employees: ${searchTerm}`);
    return api.get(`${API_URL}/search?q=${searchTerm}`);
};

// Get employee stats (HR only)
export const getEmployeeStats = () => {
    console.log("📊 Fetching employee stats...");
    return api.get(`${API_URL}/stats`);
};

// Create employee (HR only)
export const createEmployee = (data) => {
    console.log("📝 Creating employee:", data);
    return api.post(`${API_URL}`, data);
};

// Update employee (HR only)
export const updateEmployee = (id, data) => {
    console.log(`📝 Updating employee ${id}:`, data);
    return api.put(`${API_URL}/${id}`, data);
};

// Delete employee (HR only)
export const deleteEmployee = (id) => {
    console.log(`🗑️ Deleting employee ${id}`);
    return api.delete(`${API_URL}/${id}`);
};

// Bulk import employees (HR only)
export const bulkImportEmployees = (data) => {
    console.log(`📤 Bulk importing ${data.length || 0} employees`);
    return api.post(`${API_URL}/bulk-import`, data);
};

// Get team members for custodian
export const getTeamMembers = (custodianId) => {
    console.log(`👥 Fetching team members for custodian: ${custodianId}`);
    return api.get(`${API_URL}/team/${custodianId}`);
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
    getEmployees,
    getEmployeeById,
    getEmployeeByCode,
    getEmployeeByDeviceUid,
    searchEmployees,
    getEmployeeStats,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImportEmployees,
    getTeamMembers
};