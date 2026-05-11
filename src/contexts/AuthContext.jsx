import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = authService.getToken();
        const userData = authService.getUser();
        
        if (token && userData) {
            setUser(userData);
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await authService.login(email, password);
            if (response.status === "success") {
                setUser(response.data.user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: response.message || "Login failed" };
        } catch (error) {
            console.error("Login error in AuthContext:", error);
            const errorMessage = error.response?.data?.message 
                || error.message 
                || "Login failed. Please check your connection and try again.";
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    const register = async (name, email, password) => {
        try {
            const response = await authService.register(name, email, password);
            if (response.status === "success") {
                return { success: true, message: response.message };
            }
            return { success: false, message: response.message || "Registration failed" };
        } catch (error) {
            console.error("Registration error in AuthContext:", error);
            const errorMessage = error.response?.data?.message 
                || error.message 
                || "Registration failed. Please check your connection and try again.";
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};


