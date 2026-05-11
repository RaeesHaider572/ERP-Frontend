import api from "./authService";

export const getInventory            = ()         => api.get("/inventory");
export const getInventoryById        = (id)       => api.get(`/inventory/${id}`);
export const createInventory         = (data)     => api.post("/inventory", data);
export const updateInventory         = (id, data) => api.put(`/inventory/${id}`, data);
export const deleteInventory         = (id)       => api.delete(`/inventory/${id}`);

export const getCustomersForDropdown = ()         => api.get("/customers");
export const getProjectsForDropdown  = ()         => api.get("/projects");