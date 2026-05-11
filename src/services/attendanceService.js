import api from "./authService";

export const getAttendance       = (params) => api.get("/attendance", { params });
export const getAttendanceStats  = (params) => api.get("/attendance/stats", { params });
export const getEmployees        = ()        => api.get("/attendance/employees");
export const getRawLogs          = (params) => api.get("/attendance/logs", { params });
export const syncAttendance      = ()        => api.post("/attendance/sync");
export const processDaily        = (date)    => api.post("/attendance/process", null, { params: { date } });
export const reprocessAll        = ()        => api.get("/attendance/reprocess-now");
export const clearAndResync      = ()        => api.get("/attendance/clear-resync-now");