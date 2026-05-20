import api from "./authService";

const API_URL = "/employees";

// Basic CRUD operations
export const getEmployees = () => api.get(API_URL);
export const getEmployeeById = (id) => api.get(`${API_URL}/${id}`);
export const getEmployeeByDeviceUid = (deviceUid) => api.get(`${API_URL}/device/${deviceUid}`);
export const createEmployee = (data) => api.post(API_URL, data);
export const updateEmployee = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteEmployee = (id) => api.delete(`${API_URL}/${id}`);

// Additional operations
export const searchEmployees = (searchTerm) => api.get(`${API_URL}/search?q=${searchTerm}`);
export const getEmployeeStats = () => api.get(`${API_URL}/stats`);
export const bulkImportEmployees = (employees) => api.post(`${API_URL}/bulk-import`, { employees });