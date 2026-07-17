import api from "./authService";

// Apply attendance correction
export const applyAttendanceCorrection = async (data) => {
    try {
        const response = await api.post("/attendance-correction/apply", data);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in applyAttendanceCorrection:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// Get employee's correction requests
export const getEmployeeCorrectionRequests = async (employeeId) => {
    try {
        const response = await api.get(`/attendance-correction/employee/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getEmployeeCorrectionRequests:", error);
        throw error;
    }
};

// Get all correction requests (HR only)
export const getAllCorrectionRequests = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await api.get(`/attendance-correction/all?${queryParams}`);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getAllCorrectionRequests:", error);
        throw error;
    }
};

// Get correction request by ID
export const getCorrectionRequestById = async (id) => {
    try {
        const response = await api.get(`/attendance-correction/${id}`);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getCorrectionRequestById:", error);
        throw error;
    }
};

// Update correction status (HR only)
export const updateCorrectionStatus = async (id, status) => {
    try {
        const response = await api.put(`/attendance-correction/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error("❌ API Error in updateCorrectionStatus:", error);
        throw error;
    }
};

// Get correction stats
export const getCorrectionStats = async () => {
    try {
        const response = await api.get("/attendance-correction/stats");
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getCorrectionStats:", error);
        throw error;
    }
};