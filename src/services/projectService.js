import api from "./authService";

const API_URL = "/projects";

export const getProjects = () => api.get(API_URL);

export const getProjectByCode = (project_code) => api.get(`${API_URL}/${project_code}`);
export const createProject = (data) => api.post(API_URL, data);
export const updateProject = (project_code, data) => api.put(`${API_URL}/${project_code}`, data);
export const deleteProject = (project_code) => api.delete(`${API_URL}/${project_code}`);
