import api from "./authService";

const API_URL = "/tax-rates";

export const getTaxRates = () => api.get(API_URL);
export const getTaxRateById = (id) => api.get(`${API_URL}/${id}`);
export const createTaxRate = (data) => api.post(API_URL, data);
export const updateTaxRate = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteTaxRate = (id) => api.delete(`${API_URL}/${id}`);