// services/attendanceLogsService.js
import api from "./authService";

// ============================================
// GET ATTENDANCE LOGS (ROLE-BASED)
// ============================================
export const getAttendanceLogs = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
        if (filters.punchType !== undefined && filters.punchType !== '') queryParams.append('punchType', filters.punchType);
        if (filters.page) queryParams.append('page', filters.page);
        if (filters.limit) queryParams.append('limit', filters.limit);

        const url = `/attendance-logs?${queryParams.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getwebLogs:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET EMPLOYEE ATTENDANCE LOGS (WITH ACCESS CONTROL)
// ============================================
export const getEmployeeAttendance = async (employeeId, filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const url = `/attendance-logs/employee/${employeeId}?${queryParams.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getEmployeeAttendance:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET ATTENDANCE SUMMARY FOR DASHBOARD
// ============================================
export const getAttendanceSummary = async (date = null) => {
    try {
        const queryParams = new URLSearchParams();
        if (date) queryParams.append('date', date);

        const url = `/attendance-logs/summary?${queryParams.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getAttendanceSummary:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET ATTENDANCE STATISTICS (MONTHLY/YEARLY)
// ============================================
export const getAttendanceStatistics = async (period = 'monthly', year = null, month = null) => {
    try {
        const currentYear = year || new Date().getFullYear();
        const currentMonth = month || new Date().getMonth() + 1;

        const queryParams = new URLSearchParams();
        queryParams.append('period', period);
        queryParams.append('year', currentYear);
        queryParams.append('month', currentMonth);

        const url = `/attendance-logs/statistics?${queryParams.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getAttendanceStatistics:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET TODAY'S ATTENDANCE FOR CURRENT EMPLOYEE
// ============================================
export const getTodayAttendance = async () => {
    try {
        const response = await api.get("/attendance-logs/today");
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getTodayAttendance:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET TEAM MEMBERS (CUSTODIAN ONLY)
// ============================================
export const getTeamMembers = async () => {
    try {
        const response = await api.get("/attendance-logs/team-members");
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getTeamMembers:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// EXPORT ATTENDANCE REPORT
// ============================================
export const exportAttendanceReport = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);

        const url = `/attendance-logs/export?${queryParams.toString()}`;
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error("❌ API Error in exportAttendanceReport:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        throw error;
    }
};

// ============================================
// GET TODAY'S ATTENDANCE STATUS (QUICK VIEW)
// ============================================
export const getTodayStatus = async () => {
    try {
        const response = await getTodayAttendance();
        return response.data;
    } catch (error) {
        console.error("❌ API Error in getTodayStatus:", error);
        console.error("❌ Response:", error.response);
        console.error("❌ Error Message:", error.message);
        return { status: 'unknown', checkIn: null, checkOut: null };
    }
};