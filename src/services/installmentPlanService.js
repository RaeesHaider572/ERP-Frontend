import api from "./authService";

const API_URL = "/installment-plans";

export const getInstallmentPlans = () => api.get(API_URL);
export const getInstallmentPlanById = (id) => api.get(`${API_URL}/${id}`);
export const createInstallmentPlan = (data) => api.post(API_URL, data);
export const updateInstallmentPlan = (id, data) => api.put(`${API_URL}/${id}`, data);
export const deleteInstallmentPlan = (id) => api.delete(`${API_URL}/${id}`);
export const bulkImportInstallmentPlans = (data) => api.post(`${API_URL}/bulk-import`, { plans: data });

export const getUnitCustomerInfo = (unitId) =>
  api.get(`/installment-plans/unit-info?unitId=${encodeURIComponent(unitId)}`);