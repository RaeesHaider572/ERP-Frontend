import api from "./authService";

const API_URL = "/employees";

// Employee CRUD operations
export const getEmployees = (params) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`${API_URL}${queryParams ? `?${queryParams}` : ''}`);
};

export const getEmployeeById = (id) => api.get(`${API_URL}/${id}`);

export const getEmployeeByDeviceUid = (deviceUid, deviceName) => 
    api.get(`${API_URL}/by-device?deviceUid=${deviceUid}&deviceName=${deviceName || ''}`);

export const createEmployee = (data) => api.post(API_URL, data);

export const updateEmployee = (id, data) => api.put(`${API_URL}/${id}`, data);

export const deleteEmployee = (id) => api.delete(`${API_URL}/${id}`);

export const getEmployeeStats = () => api.get(`${API_URL}/stats`);

export const syncDeviceUsers = (deviceUsers) => api.post(`${API_URL}/sync-device-users`, { deviceUsers });

// Utility functions
export const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const getStatusColor = (status) => {
    const colors = {
        active: 'success',
        inactive: 'default',
        'on-leave': 'warning',
        terminated: 'error'
    };
    return colors[status] || 'default';
};

export const departments = [
    "Administration", "HR", "IT", "Finance", "Marketing", 
    "Sales", "Operations", "Production", "Quality", "Maintenance"
];

export const designations = [
    "Manager", "Senior Manager", "Assistant Manager", "Executive",
    "Senior Executive", "Officer", "Senior Officer", "Coordinator",
    "Supervisor", "Team Lead", "Developer", "Accountant"
];

export const statuses = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "on-leave", label: "On Leave" },
    { value: "terminated", label: "Terminated" }
];