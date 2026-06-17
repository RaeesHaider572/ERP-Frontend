import api from "./authService";

const API_URL = "/employees";

// Employee CRUD operations
export const getEmployees = () => api.get(API_URL);
export const getEmployeeById = (id) => api.get(`${API_URL}/${id}`);
export const getEmployeeByCode = (code) => api.get(`${API_URL}/code/${code}`);
export const getEmployeeByDeviceUid = (deviceUid) => api.get(`${API_URL}/device/${deviceUid}`);
export const searchEmployees = (query) => api.get(`${API_URL}/search?q=${query}`);
export const getEmployeeStats = () => api.get(`${API_URL}/stats`);
export const createEmployee = (data) => api.post(API_URL, data);
export const updateEmployee = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteEmployee = (id) => api.delete(`${API_URL}/${id}`);
export const bulkImportEmployees = (data) => api.post(`${API_URL}/bulk-import`, data);