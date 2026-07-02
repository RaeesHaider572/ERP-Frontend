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

// ✅ Role-based module access
export const ROLE_MODULE_ACCESS = {
    employee: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE],
        routes: [
            '/dashboard',
            '/leave-dashboard',
            '/leave/*',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
            '/leave/balance',
        ],
        permissions: {
            canApplyForSelf: true,
            canApplyForOthers: false,
            canViewAllRequests: false,
            canApproveRequests: false,
            canViewTeamMembers: false,
        }
    },
    custodian: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE, MODULES.EMPLOYEES],
        routes: [
            '/dashboard',
            '/leave-dashboard',
            '/leave/*',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
            '/leave/balance',
            '/employees',
            '/team/*',
        ],
        permissions: {
            canApplyForSelf: true,
            canApplyForOthers: true,
            canViewAllRequests: false,
            canApproveRequests: false,
            canViewTeamMembers: true,
            canManageTeam: true,
        }
    },
    HR: {
        modules: [MODULES.DASHBOARD, MODULES.LEAVE, MODULES.EMPLOYEES],
        routes: [
            '/dashboard',
            '/leave-dashboard',
            '/leave/*',
            '/LeaveTypes',
            '/LeaveRequests',
            '/LeaveApply',
            '/ApplyLeave',
            '/leave/balance',
            '/employees',
            '/leave/approval/*',
            '/leave/reports/*',
        ],
        permissions: {
            canApplyForSelf: true,
            canApplyForOthers: false,
            canViewAllRequests: true,
            canApproveRequests: true,
            canViewTeamMembers: true,
            canManageTeam: true,
            canViewReports: true,
        }
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

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

export const isModuleAccessible = (user, moduleName) => {
    if (!user) return false;
    const access = ROLE_MODULE_ACCESS[user.Role];
    if (!access) return false;
    return access.modules.includes(moduleName);
};

export const hasRole = (user, role) => {
    if (!user) return false;
    return user.Role === role;
};

export const hasPermission = (user, permission) => {
    if (!user) return false;
    const access = ROLE_MODULE_ACCESS[user.Role];
    if (!access) return false;
    return access.permissions[permission] || false;
};

// ============================================
// AUTH CONTEXT
// ============================================

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ✅ Load user from localStorage on mount
    useEffect(() => {
        const token = authService.getToken();
        const userData = authService.getUser();

        console.log("🔐 AuthProvider - Token:", token ? "✅ Present" : "❌ Missing");
        console.log("🔐 AuthProvider - User:", userData ? userData.Name : "❌ Missing");

        if (token && userData) {
            setUser(userData);
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    // ✅ Login with Email
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
            console.error("Login error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Login failed"
            };
        }
    };

    // ✅ Login with Employee Code - FIXED
    const loginWithEmployeeCode = async (employeeCode, password) => {
        try {
            // ✅ Format employee code with hyphen
            let formattedCode = employeeCode.toUpperCase().trim();

            // If code doesn't start with "EMP-", add it
            if (formattedCode && !formattedCode.includes('-')) {
                if (formattedCode.startsWith('EMP')) {
                    const numPart = formattedCode.replace('EMP', '');
                    formattedCode = `EMP-${numPart}`;
                } else {
                    formattedCode = `EMP-${formattedCode}`;
                }
            }

            console.log("🔐 AuthContext - Login with formatted code:", formattedCode);

            const response = await authService.loginWithEmployeeCode(formattedCode, password);
            console.log("AuthContext - Login response:", response);

            if (response.status === "success") {
                // ✅ Get user data from response
                const userData = response.data.user;
                const token = response.data.token || response.data.data?.token;

                console.log("AuthContext - Setting user:", userData);
                console.log("AuthContext - Token:", token ? "✅ Present" : "❌ Missing");

                // ✅ Set user in state
                setUser(userData);
                setIsAuthenticated(true);

                // ✅ Store token if not already stored by authService
                if (token) {
                    localStorage.setItem("token", token);
                }

                // ✅ Store user data if not already stored
                if (userData) {
                    localStorage.setItem("user", JSON.stringify(userData));
                }

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
        return hasPermission(user, 'canApplyForOthers');
    };

    const getTeamMembers = () => {
        return user?.teamMembers || [];
    };

    const canAccessModule = (moduleName) => {
        return isModuleAccessible(user, moduleName);
    };

    const canAccessRoute = (path) => {
        return isRouteAllowed(user, path);
    };

    const getAccessibleModules = () => {
        if (!user) return [];
        const access = ROLE_MODULE_ACCESS[user.Role];
        return access?.modules || [];
    };

    const canApproveLeave = () => {
        return hasPermission(user, 'canApproveRequests');
    };

    const canViewAllRequests = () => {
        return hasPermission(user, 'canViewAllRequests');
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        loginWithEmployeeCode,
        logout,
        getRoleDisplay,
        isEmployee,
        isCustodian,
        isHR,
        canApplyForOthers,
        getTeamMembers,
        canAccessModule,
        canAccessRoute,
        getAccessibleModules,
        canApproveLeave,
        canViewAllRequests,
        hasPermission,
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