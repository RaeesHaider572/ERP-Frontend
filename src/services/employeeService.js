import api from "./authService";

const API_URL = "/employees";

// Simple CRUD operations matching projects pattern
export const getEmployees = () => api.get(API_URL);

export const getEmployeeById = (id) => api.get(`${API_URL}/${id}`);

export const createEmployee = (data) => api.post(API_URL, data);

export const updateEmployee = (id, data) => api.put(`${API_URL}/${id}`, data);

export const deleteEmployee = (id) => api.delete(`${API_URL}/${id}`);

// Get employee statistics (optional)
export const getEmployeeStats = () => api.get(`${API_URL}/stats`);