import axios from "axios";

// Get API URL from environment or detect from current host
const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:5000/api`;
    }
    
    return "http://localhost:5000/api";
};

const API_URL = getApiUrl();
console.log("🔗 API URL configured:", API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (!window.location.pathname.includes('/login')) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// ============================================
// AUTH FUNCTIONS
// ============================================

// Login with email
export const login = async (email, password) => {
    try {
        console.log("🔐 Attempting login to:", API_URL);
        const response = await api.post("/auth/login", { email, password });
        if (response.data.status === "success") {
            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data.user));
        }
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            const err = new Error(`Cannot connect to server. Please check that the backend is running at ${API_URL}`);
            err.response = {
                data: {
                    status: "error",
                    message: `Cannot connect to server. Please check that the backend is running at ${API_URL}`
                }
            };
            throw err;
        }
        throw error;
    }
};

// ✅ NEW: Login with employee code
export const loginWithEmployeeCode = async (employeeCode, password) => {
    try {
        console.log("🔐 Attempting login with employee code:", employeeCode);
        const response = await api.post("/auth/login/employee-code", { employeeCode, password });
        if (response.data.status === "success") {
            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data.user));
        }
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            const err = new Error(`Cannot connect to server. Please check that the backend is running at ${API_URL}`);
            err.response = {
                data: {
                    status: "error",
                    message: `Cannot connect to server. Please check that the backend is running at ${API_URL}`
                }
            };
            throw err;
        }
        throw error;
    }
};

export const register = async (name, email, password) => {
    try {
        console.log("📝 Attempting registration to:", API_URL);
        const response = await api.post("/auth/register", { name, email, password });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            const err = new Error(`Cannot connect to server. Please check that the backend is running at ${API_URL}`);
            err.response = {
                data: {
                    status: "error",
                    message: `Cannot connect to server. Please check that the backend is running at ${API_URL}`
                }
            };
            throw err;
        }
        throw error;
    }
};

export const getProfile = async () => {
    const response = await api.get("/auth/profile");
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const getUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
};

export default api;

export const authService = {
    login,
    loginWithEmployeeCode, // ✅ Added
    register,
    getProfile,
    logout,
    getToken,
    getUser,
    isAuthenticated
};