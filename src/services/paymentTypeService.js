import api from "./authService";

const API_URL = "/payment-types";

export const getPaymentTypes = () => api.get(API_URL);
export const getPaymentTypeById = (id) => api.get(`${API_URL}/${id}`);
export const createPaymentType = (data) => api.post(API_URL, data);
export const updatePaymentType = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deletePaymentType = (id) => api.delete(`${API_URL}/${id}`);
