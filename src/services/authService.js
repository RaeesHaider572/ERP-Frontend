import axios from "axios";

// Get API URL from environment or detect from current host
const getApiUrl = () => {
    // If environment variable is set, use it
    if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    
    // Otherwise, detect from current hostname
    const hostname = window.location.hostname;
    const port = window.location.port || "3000";
    
    // If accessing via IP address (not localhost), use same IP for API
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
        return `http://${hostname}:5000/api`;
    }
    
    // Default to localhost
    return "http://localhost:5000/api";
};

const API_URL = getApiUrl();

// Log the API URL being used (helpful for debugging)
console.log("API URL configured:", API_URL);

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Add token to requests if available
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

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const login = async (email, password) => {
    try {
        console.log("Attempting login to:", API_URL);
        const response = await api.post("/auth/login", { email, password });
        if (response.data.status === "success") {
            localStorage.setItem("token", response.data.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.data.user));
        }
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        // Handle network errors
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            throw {
                response: {
                    data: {
                        status: "error",
                        message: `Cannot connect to server. Please check that the backend is running at ${API_URL}`
                    }
                }
            };
        }
        // Handle other errors
        throw error;
    }
};

export const register = async (name, email, password) => {
    try {
        console.log("Attempting registration to:", API_URL);
        const response = await api.post("/auth/register", { name, email, password });
        return response.data;
    } catch (error) {
        console.error("Registration error:", error);
        // Handle network errors
        if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
            throw {
                response: {
                    data: {
                        status: "error",
                        message: `Cannot connect to server. Please check that the backend is running at ${API_URL}`
                    }
                }
            };
        }
        // Handle other errors
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

// Export the configured axios instance for use in other services
export default api;

// Export as object for easier imports
export const authService = {
    login,
    register,
    getProfile,
    logout,
    getToken,
    getUser,
    isAuthenticated
};

