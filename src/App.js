// src/App.jsx - UPDATED WITH ROLE-BASED ACCESS
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth, MODULES } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardContent from './components/Dashboard/DashboardContent';

// Import modules
import Dashboard from "./modules/dashboard/Dashboard";
import Customers from "./modules/customers/Customers";
import Projects from "./modules/projects/Projects";
import ReceiptsForm from "./modules/receipts/ReceiptForm";
import Receipts from "./modules/receipts/ReceiptsList";
import PaymentTypes from "./modules/PaymentTypes/PaymentTypes";
import InstallmentPlans from "./modules/installmentPlans/InstallmentPlans";
import Inventory from "./modules/inventory/Inventory";
import TaxRates from "./modules/taxRates/TaxRates";
import CashAndBank from "./modules/CashAndBank/CashAndBank";
import CashAndBankForm from './modules/CashAndBank/CashAndBankForm';
import Employees from './modules/Employees/Employees';
import MobileCheckIn from './modules/Mobilecheckin';

// Leave Module 
import LeaveDashboard from './modules/Leave/LeaveDashboard';
import LeaveTypes from './modules/Leave/LeaveTypes';
import LeaveRequests from './modules/Leave/LeaveRequests';
import LeaveApply from './modules/Leave/LeaveApply';
import TeamRequests from './modules/Leave/TeamRequests';
import LeaveBalance from './modules/Leave/LeaveBalance';


import AllRequests from './modules/Leave/AllRequests';

import AttendanceCorrectionForm from './modules/attendance/AttendanceCorrectionForm';
import MyAttendanceCorrectionRequests from './modules/attendance/MyAttendanceCorrectionRequests';
import AttendanceCorrectionManagement from './modules/attendance/AttendanceCorrectionManagement';
import AttendanceTeamRequests from './modules/attendance/AttendanceTeamRequests';

import AttendanceLogs from './modules/attendance/AttendanceLogs';
import WebAttendanceLogs from "./modules/attendance/WebAttendanceLogs";

// ============================================
// ROLE-BASED ROUTE GUARD COMPONENT
// ============================================
const ModuleGuard = ({ children, module, fallbackPath = '/dashboard' }) => {
    const { canAccessModule } = useAuth();

    if (!canAccessModule(module)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

// ============================================
// ROLE-BASED ROUTE GUARD (For specific roles)
// ============================================
const RoleGuard = ({ children, roles, fallbackPath = '/dashboard' }) => {
    const { user } = useAuth();

    if (!user || !roles.includes(user.Role)) {
        return <Navigate to={fallbackPath} replace />;
    }

    return children;
};

function App() {
    return (
        <CustomThemeProvider>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />

                        {/* DASHBOARD - All roles */}
                        <Route path="dashboard" element={<DashboardContent />} />

                        {/* ======================================== */}
                        {/* LEAVE MODULE - All roles can access */}
                        {/* ======================================== */}
                        <Route path="leave-dashboard" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <LeaveDashboard />
                            </ModuleGuard>
                        } />
                        <Route path="LeaveTypes" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <LeaveTypes />
                            </ModuleGuard>
                        } />
                        <Route path="LeaveRequests" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <LeaveRequests />
                            </ModuleGuard>
                        } />
                        <Route path="LeaveApply" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <LeaveApply />
                            </ModuleGuard>
                        } />
                        <Route path="LeaveBalance" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <LeaveBalance />
                            </ModuleGuard>
                        } />
                        <Route path="team-requests" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <RoleGuard roles={['custodian', 'HR']}>
                                    <TeamRequests />
                                </RoleGuard>
                            </ModuleGuard>
                        } />
                        <Route path="leave/all-requests" element={
                            <ModuleGuard module={MODULES.LEAVE}>
                                <RoleGuard roles={['HR']}>
                                    <AllRequests />
                                </RoleGuard>
                            </ModuleGuard>
                        } />

                        {/* ======================================== */}
                        {/* ✅ ATTENDANCE CORRECTION MODULE */}
                        {/* ======================================== */}
                        {/* All employees can apply for attendance correction */}
                        <Route path="attendance-correction/apply" element={
                            <AttendanceCorrectionForm />
                        } />

                        {/* All employees can view their own correction requests */}
                        <Route path="attendance-correction/my-requests" element={
                            <MyAttendanceCorrectionRequests />
                        } />
                        <Route path="attendance-logs" element={<AttendanceLogs />} />
                        
                        <Route path="/web-attendance-logs" element={<WebAttendanceLogs />}/>

                        {/* Custodians can view team members' correction requests */}
                        <Route path="attendance-correction/team-requests" element={
                            <RoleGuard roles={['custodian']}>
                                <AttendanceTeamRequests />
                            </RoleGuard>
                        } />

                        {/* Only HR can manage/approve attendance correction requests */}
                        <Route path="attendance-correction/management" element={
                            <RoleGuard roles={['HR']}>
                                <AttendanceCorrectionManagement />
                            </RoleGuard>
                        } />

                        {/* ======================================== */}
                        {/* EMPLOYEES - Custodian & HR only */}
                        {/* ======================================== */}
                        <Route path="employees" element={
                            <RoleGuard roles={['custodian', 'HR']}>
                                <Employees />
                            </RoleGuard>
                        } />

                        {/* ======================================== */}
                        {/* OTHER MODULES - Currently restricted */}
                        {/* Only accessible by specific roles when granted */}
                        {/* ======================================== */}

                        {/* Customers - Only specific employees with granted access */}
                        <Route path="customers" element={
                            <ModuleGuard module={MODULES.CUSTOMERS}>
                                <Customers />
                            </ModuleGuard>
                        } />

                        {/* Projects - Only specific employees with granted access */}
                        <Route path="projects" element={
                            <ModuleGuard module={MODULES.PROJECTS}>
                                <Projects />
                            </ModuleGuard>
                        } />

                        {/* Receipts - Only specific employees with granted access */}
                        <Route path="receipts" element={
                            <ModuleGuard module={MODULES.RECEIPTS}>
                                <Receipts />
                            </ModuleGuard>
                        } />
                        <Route path="receipts/create" element={
                            <ModuleGuard module={MODULES.RECEIPTS}>
                                <ReceiptsForm />
                            </ModuleGuard>
                        } />
                        <Route path="receipts/edit/:id" element={
                            <ModuleGuard module={MODULES.RECEIPTS}>
                                <ReceiptsForm />
                            </ModuleGuard>
                        } />
                        <Route path="receipts-form" element={<Navigate to="/receipts/create" replace />} />

                        {/* Payment Types - Only specific employees with granted access */}
                        <Route path="payment-types" element={
                            <ModuleGuard module={MODULES.PAYMENT_TYPES}>
                                <PaymentTypes />
                            </ModuleGuard>
                        } />

                        {/* Installment Plans - Only specific employees with granted access */}
                        <Route path="installment-plans" element={
                            <ModuleGuard module={MODULES.INSTALLMENT}>
                                <InstallmentPlans />
                            </ModuleGuard>
                        } />

                        {/* Inventory - Only specific employees with granted access */}
                        <Route path="inventory" element={
                            <ModuleGuard module={MODULES.INVENTORY}>
                                <Inventory />
                            </ModuleGuard>
                        } />

                        {/* Tax Rates - Only specific employees with granted access */}
                        <Route path="tax-rates" element={
                            <ModuleGuard module={MODULES.TAX_RATES}>
                                <TaxRates />
                            </ModuleGuard>
                        } />

                        {/* Cash and Bank - Only specific employees with granted access */}
                        <Route path="cash-and-bank" element={
                            <ModuleGuard module={MODULES.CASH_BANK}>
                                <CashAndBank />
                            </ModuleGuard>
                        } />
                        <Route path="add-record-cb" element={
                            <ModuleGuard module={MODULES.CASH_BANK}>
                                <CashAndBankForm />
                            </ModuleGuard>
                        } />

                        {/* Mobile Checkin - Only specific employees with granted access */}
                        <Route path="mobile-checkin" element={
                            <ModuleGuard module={MODULES.MOBILE_CHECKIN}>
                                <MobileCheckIn />
                            </ModuleGuard>
                        } />

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </CustomThemeProvider>
    );
}

export default App;