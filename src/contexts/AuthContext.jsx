import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/authService";

// ============================================
// MODULE ACCESS DEFINITIONS
// ============================================
export const MODULES = {
    DASHBOARD: 'dashboard',
    LEAVE: 'leave',
    EMPLOYEES: 'employees',
    CUSTOMERS: 'customers',
    RECEIPTS: 'receipts',
    INSTALLMENT: 'installment',
    INVENTORY: 'inventory',
    TAX_RATES: 'tax_rates',
    CASH_BANK: 'cash_bank',
    PROJECTS: 'projects',
    PAYMENT_TYPES: 'payment_types',
    ATTENDANCE: 'attendance',
    MOBILE_CHECKIN: 'mobile_checkin',
};

// ✅ Define which roles can access which modules
export const ROLE_MODULE_ACCESS = {
    // Employee: Only Leave module
    employee: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE],
        routes: [
            '/dashboard',
            '/leave/*',
            '/leave/apply',
            '/leave/requests',
            '/leave/balance',
            '/leave-dashboard',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
        ]
    },
    // Custodian: Leave + Employees (Team Management)
    custodian: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE, MODULES.EMPLOYEES],
        routes: [
            '/dashboard',
            '/leave/*',
            '/leave/apply',
            '/leave/requests',
            '/leave/balance',
            '/leave-dashboard',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
            '/employees'
        ]
    },
    // HR: Leave + Employees Only (No other modules)
    HR: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE, MODULES.EMPLOYEES],
        routes: [
            '/dashboard',
            '/leave/*',
            '/leave/apply',
            '/leave/requests',
            '/leave/balance',
            '/leave-dashboard',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
            '/employees'
        ]
    }
};

// ✅ Check if a route is allowed for a user
export const isRouteAllowed = (user, path) => {
    if (!user) return false;
    
    const access = ROLE_MODULE_ACCESS[user.Role];
    if (!access) return false;
    
    return access.routes.some(route => {
        if (route === '/*') return true;
        if (route.endsWith('/*')) {
            const baseRoute = route.replace('/*', '');
            return path.startsWith(baseRoute);
        }
        return path === route;
    });
};

// ✅ Check if a module is accessible
export const isModuleAccessible = (user, moduleName) => {
    if (!user) return false;
    
    const access = ROLE_MODULE_ACCESS[user.Role];
    if (!access) return false;
    
    return access.modules.includes(moduleName);
};

// ✅ Check if user has specific role
export const hasRole = (user, role) => {
    if (!user) return false;
    return user.Role === role;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
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
                const userData = response.data.user;
                setUser(userData);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: response.message || "Login failed" };
        } catch (error) {
            console.error("Login error in AuthContext:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Login failed"
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
            return {
                success: false,
                message: error.response?.data?.message || "Registration failed"
            };
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    // ============================================
    // ROLE-BASED ACCESS FUNCTIONS
    // ============================================

    const getRoleDisplay = () => {
        const roleMap = {
            'employee': 'Employee',
            'custodian': 'Custodian',
            'HR': 'HR'
        };
        return roleMap[user?.Role] || user?.Role || 'Unknown';
    };

    const isEmployee = () => user?.Role === 'employee';
    const isCustodian = () => user?.Role === 'custodian';
    const isHR = () => user?.Role === 'HR';
    
    const canApplyForOthers = () => {
        return user?.Role === 'custodian' || user?.Role === 'HR';
    };

    const getTeamMembers = () => {
        return user?.teamMembers || [];
    };

    // ✅ Check if user can access a specific module
    const canAccessModule = (moduleName) => {
        return isModuleAccessible(user, moduleName);
    };

    // ✅ Check if user can access a specific route
    const canAccessRoute = (path) => {
        return isRouteAllowed(user, path);
    };

    // ✅ Get all modules user can access
    const getAccessibleModules = () => {
        if (!user) return [];
        const access = ROLE_MODULE_ACCESS[user.Role];
        return access?.modules || [];
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        // Role functions
        getRoleDisplay,
        isEmployee,
        isCustodian,
        isHR,
        canApplyForOthers,
        getTeamMembers,
        canAccessModule,
        canAccessRoute,
        getAccessibleModules,
        // Convenience
        role: user?.Role,
        isEmployeeRole: user?.Role === 'employee',
        isCustodianRole: user?.Role === 'custodian',
        isHRRole: user?.Role === 'HR'
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