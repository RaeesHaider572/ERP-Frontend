import api from "./authService";

// ============================================
// GET WEB ATTENDANCE LOGS
// ============================================
export const getWebAttendanceLogs = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.startDate) {
            queryParams.append("startDate", filters.startDate);
        }

        if (filters.endDate) {
            queryParams.append("endDate", filters.endDate);
        }

        if (filters.employeeId) {
            queryParams.append("employeeId", filters.employeeId);
        }

        if (
            filters.punchType !== undefined &&
            filters.punchType !== ""
        ) {
            queryParams.append("punchType", filters.punchType);
        }

        if (filters.status) {
            queryParams.append("status", filters.status);
        }

        if (filters.page) {
            queryParams.append("page", filters.page);
        }

        if (filters.limit) {
            queryParams.append("limit", filters.limit);
        }

        const response = await api.get(
            `/web-attendance-logs?${queryParams.toString()}`
        );

        return response.data;
    } catch (error) {
        console.error(
            "API Error in getWebAttendanceLogs:",
            error
        );
        throw error;
    }
};

// ============================================
// GET WEB ATTENDANCE SUMMARY
// ============================================
export const getWebAttendanceSummary = async (filters = {}) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.startDate) {
            queryParams.append("startDate", filters.startDate);
        }

        if (filters.endDate) {
            queryParams.append("endDate", filters.endDate);
        }

        if (filters.employeeId) {
            queryParams.append("employeeId", filters.employeeId);
        }

        const response = await api.get(
            `/web-attendance-logs/summary?${queryParams.toString()}`
        );

        return response.data;
    } catch (error) {
        console.error(
            "API Error in getWebAttendanceSummary:",
            error
        );
        throw error;
    }
};

// ============================================
// EXPORT WEB ATTENDANCE REPORT
// ============================================
export const exportWebAttendanceReport = async (
    filters = {}
) => {
    try {
        const queryParams = new URLSearchParams();

        if (filters.startDate) {
            queryParams.append("startDate", filters.startDate);
        }

        if (filters.endDate) {
            queryParams.append("endDate", filters.endDate);
        }

        if (filters.employeeId) {
            queryParams.append("employeeId", filters.employeeId);
        }

        if (
            filters.punchType !== undefined &&
            filters.punchType !== ""
        ) {
            queryParams.append("punchType", filters.punchType);
        }

        if (filters.status) {
            queryParams.append("status", filters.status);
        }

        const response = await api.get(
            `/web-attendance-logs/export?${queryParams.toString()}`
        );

        return response.data;
    } catch (error) {
        console.error(
            "API Error in exportWebAttendanceReport:",
            error
        );
        throw error;
    }
};