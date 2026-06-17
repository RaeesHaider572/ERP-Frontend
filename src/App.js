// src/App.jsx - CORRECTED VERSION
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardContent from './components/Dashboard/DashboardContent';

import Dashboard from "../src/modules/dashboard/Dashboard";
import Customers from "../src/modules/customers/Customers";
import Projects from "../src/modules/projects/Projects";
import ReceiptsForm from "../src/modules/receipts/ReceiptForm";
import Receipts from "../src/modules/receipts/ReceiptsList";
import PaymentTypes from "../src/modules/PaymentTypes/PaymentTypes";
import InstallmentPlans from "../src/modules/installmentPlans/InstallmentPlans";
import Inventory from "../src/modules/inventory/Inventory";
import TaxRates from "../src/modules/taxRates/TaxRates";
import CashAndBank from "../src/modules/CashAndBank/CashAndBank";
import CashAndBankForm from '../src/modules/CashAndBank/CashAndBankForm';
import AttendanceLiveFeed from '../src/modules/attendance/AttendanceLiveFeed';
import Employees from './modules/Employees/Employees';
import MobileCheckIn from '../src/modules/Mobilecheckin';
import ApplyLeave from './modules/Leave/ApplyLeave';
// import LeaveList from './modules/Leave/LeaveList';

import LeaveTypes from '../src/modules/Leave/LeaveTypes';
import LeaveRequests from '../src/modules/Leave/LeaveRequests';
import LeaveApply from '../src/modules/Leave/LeaveApply';
import LeaveDashboard from '../src/modules/Leave/LeaveDashboard';

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
            <Route path="dashboard" element={<DashboardContent />} />
            <Route path="customers" element={<Customers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="receipts/create" element={<ReceiptsForm />} />
            <Route path="receipts/edit/:id" element={<ReceiptsForm />} />
            <Route path="receipts-form" element={<Navigate to="/receipts/create" replace />} />
            <Route path="payment-types" element={<PaymentTypes />} />
            <Route path="installment-plans" element={<InstallmentPlans />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="tax-rates" element={<TaxRates />} />
            <Route path="cash-and-bank" element={<CashAndBank />} />
            <Route path="add-record-cb" element={<CashAndBankForm />} />
            <Route path="AttendanceLiveFeed" element={<AttendanceLiveFeed />} />
            <Route path="employees" element={<Employees />} />
            <Route path="mobile-checkin" element={<MobileCheckIn />} />
            <Route path="ApplyLeave" element={<ApplyLeave />} />
            {/* <Route path="LeaveList" element={<LeaveList />} /> */}
            <Route path="LeaveTypes" element={<LeaveTypes />} />
            <Route path="LeaveRequests" element={<LeaveRequests />} />
            <Route path="LeaveApply" element={<LeaveApply />} />


            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;