import axios from "axios";

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
    },
    timeout: 30000
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
    (error) => Promise.reject(error)
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
// AUTH FUNCTIONS - FIXED
// ============================================

// ✅ Login with Employee Code
export const loginWithEmployeeCode = async (employeeCode, password) => {
    try {
        console.log("🔐 Attempting login with employee code:", employeeCode);
        const response = await api.post("/auth/login/employee-code", { employeeCode, password });
        console.log("📡 Full API Response:", response);
        console.log("📡 Response data:", response.data);
        
        if (response.data.status === "success") {
            // ✅ Get the data object
            const data = response.data.data;
            
            // ✅ Store token
            if (data.token) {
                localStorage.setItem("token", data.token);
                console.log("✅ Token stored in localStorage");
            } else {
                console.warn("⚠️ No token in response");
            }
            
            // ✅ Store user data
            if (data.user) {
                const userData = data.user;
                console.log("✅ User data from API:", userData);
                console.log("✅ EmployeeId:", userData.EmployeeId);
                console.log("✅ Role:", userData.Role);
                localStorage.setItem("user", JSON.stringify(userData));
                console.log("✅ User data stored in localStorage");
            } else {
                console.warn("⚠️ No user data in response");
            }
        } else {
            console.warn("⚠️ Login failed:", response.data.message);
        }
        return response.data;
    } catch (error) {
        console.error("❌ Login error:", error);
        throw error;
    }
};

// ✅ Login with Email
export const login = async (email, password) => {
    try {
        console.log("🔐 Attempting login with email:", email);
        const response = await api.post("/auth/login", { email, password });
        console.log("📡 API Response:", response.data);
        
        if (response.data.status === "success") {
            const data = response.data.data;
            if (data.token) {
                localStorage.setItem("token", data.token);
                console.log("✅ Token stored");
            }
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
                console.log("✅ User stored");
            }
        }
        return response.data;
    } catch (error) {
        console.error("❌ Login error:", error);
        throw error;
    }
};

export const register = async (name, email, password, employeeCode) => {
    try {
        console.log("📝 Attempting registration");
        const response = await api.post("/auth/register", { name, email, password, employeeCode });
        return response.data;
    } catch (error) {
        console.error("❌ Registration error:", error);
        throw error;
    }
};

export const getProfile = async () => {
    try {
        const response = await api.get("/auth/profile");
        return response.data;
    } catch (error) {
        console.error("❌ Get profile error:", error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("👋 Logged out");
};

export const getToken = () => {
    const token = localStorage.getItem("token");
    console.log("🔐 getToken:", token ? "✅ Present" : "❌ Missing");
    return token;
};

export const getUser = () => {
    const user = localStorage.getItem("user");
    if (user) {
        try {
            const parsed = JSON.parse(user);
            console.log("🔐 getUser:", parsed ? parsed.Name : "❌ Missing");
            console.log("🔐 User Role:", parsed?.Role);
            console.log("🔐 User EmployeeId:", parsed?.EmployeeId);
            return parsed;
        } catch (e) {
            console.error("❌ Error parsing user:", e);
            return null;
        }
    }
    console.log("🔐 getUser: ❌ No user in localStorage");
    return null;
};

export const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const isAuth = !!(token && user);
    console.log(`🔐 isAuthenticated: ${isAuth ? '✅ Yes' : '❌ No'}`);
    return isAuth;
};

export default api;

export const authService = {
    login,
    loginWithEmployeeCode,
    register,
    getProfile,
    logout,
    getToken,
    getUser,
    isAuthenticated
};