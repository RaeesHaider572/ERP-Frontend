import api from "./authService";

const API_URL = "/customers"; // Relative path since baseURL is set in authService

export const getCustomers = () => api.get(API_URL);
export const getCustomerById = (id) => api.get(`${API_URL}/${id}`);
export const createCustomer = (data) => api.post(API_URL, data);
export const updateCustomer = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteCustomer = (id) => api.delete(`${API_URL}/${id}`);
