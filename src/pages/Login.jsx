import React, { useState } from "react";
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Tab,
    Tabs,
    CircularProgress
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { loginWithEmployeeCode } from "../services/authService";

const Login = () => {
    const [loginMethod, setLoginMethod] = useState(1); // Default to Employee Code
    const [email, setEmail] = useState("");
    const [employeeCode, setEmployeeCode] = useState("EMP0088");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            let result;
            
            if (loginMethod === 0) {
                // Email login
                if (!email || !password) {
                    setError("Please fill in all fields");
                    setLoading(false);
                    return;
                }
                result = await login(email, password);
            } else {
                // Employee code login
                if (!employeeCode || !password) {
                    setError("Please fill in all fields");
                    setLoading(false);
                    return;
                }
                // Use the employee code login function
                const response = await loginWithEmployeeCode(employeeCode, password);
                if (response.status === "success") {
                    // Update auth context with user data
                    const userData = response.data.user;
                    // The auth context will pick up the user from localStorage
                    // Force a refresh of the auth state
                    window.location.reload();
                    navigate("/dashboard");
                    setLoading(false);
                    return;
                } else {
                    setError(response.message || "Login failed");
                    setLoading(false);
                    return;
                }
            }

            setLoading(false);
            if (result?.success) {
                navigate("/dashboard");
            } else {
                setError(result?.message || "Login failed. Please try again.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || "Login failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Container 
            component="main" 
            maxWidth="xs"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                py: { xs: 4, sm: 6, md: 8 },
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: { xs: 3, sm: 4 },
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        borderRadius: 3,
                    }}
                >
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                        Leave Management System
                    </Typography>
                    <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 2 }}>
                        Sign in with your credentials
                    </Typography>

                    <Tabs
                        value={loginMethod}
                        onChange={(e, v) => setLoginMethod(v)}
                        sx={{ mb: 2 }}
                        variant="fullWidth"
                    >
                        <Tab label="Email" />
                        <Tab label="Employee Code" />
                    </Tabs>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        {loginMethod === 0 ? (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        ) : (
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="employeeCode"
                                label="Employee Code"
                                name="employeeCode"
                                autoComplete="username"
                                autoFocus
                                value={employeeCode}
                                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                                disabled={loading}
                                placeholder="e.g., EMP0001"
                            />
                        )}
                        
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Sign In"}
                        </Button>

                        <Box textAlign="center">
                            <Typography variant="body2" color="textSecondary">
                                Default password: password123
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Login;