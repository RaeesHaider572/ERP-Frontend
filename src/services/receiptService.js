import api from "./authService";

const API_URL = "/receipts";

export const getReceipts = () => api.get(API_URL);
export const getReceiptById = (id) => api.get(`${API_URL}/${id}`);
export const createReceipt = (data) => api.post(API_URL, data);
export const getReceiptInvoice = (receiptId) => api.get(`${API_URL}/invoice/${receiptId}`);
export const updateReceipt = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteReceipt = (id) => api.delete(`${API_URL}/${id}`);
export const bulkImportReceipts = (data) => api.post(`${API_URL}/bulk-import`, { receipts: data });


