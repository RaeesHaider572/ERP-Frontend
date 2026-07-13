import React, { useState } from "react";
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    useTheme,
    alpha,
    InputAdornment,
    IconButton
} from "@mui/material";
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/BodlaGroupLogo.svg";

const Login = () => {
    const theme = useTheme();
    const [employeeCode, setEmployeeCode] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { loginWithEmployeeCode } = useAuth();
    const navigate = useNavigate();

    // ✅ Format employee code automatically
    const handleEmployeeCodeChange = (e) => {
        let value = e.target.value.toUpperCase().trim();

        if (value.startsWith('EMP') && !value.includes('-')) {
            const numPart = value.replace('EMP', '');
            if (numPart) {
                value = `EMP-${numPart}`;
            } else {
                value = 'EMP-';
            }
        }

        if (/^\d+$/.test(value) && !value.startsWith('EMP')) {
            value = `EMP-${value}`;
        }

        setEmployeeCode(value);
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    // ✅ Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (!employeeCode || !password) {
                setError("Please fill in all fields");
                setLoading(false);
                return;
            }

            let formattedCode = employeeCode.toUpperCase().trim();
            if (!formattedCode.startsWith('EMP-')) {
                if (formattedCode.startsWith('EMP')) {
                    const numPart = formattedCode.replace('EMP', '');
                    formattedCode = `EMP-${numPart}`;
                } else {
                    formattedCode = `EMP-${formattedCode}`;
                }
            }

            console.log("🔐 Attempting login with:", formattedCode);

            const result = await loginWithEmployeeCode(formattedCode, password);
            console.log("Login result:", result);

            if (result.success) {
                console.log("✅ Login successful! Redirecting to dashboard...");
                navigate("/dashboard", { replace: true });
            } else {
                setError(result.message || "Login failed. Invalid employee code or password.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.message || "Login failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                py: { xs: 4, sm: 6, md: 8 },
            }}
        >
            <Container maxWidth="xs">
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
                            backgroundColor: '#ffffff',
                        }}
                    >
                        {/* Logo/Header */}
                        <Box sx={{ textAlign: 'center', mb: 1 }}>
                            <Box
                                component="img"
                                src={logo}
                                alt="Bodla Group Logo"
                                sx={{
                                    width: 120,
                                    display: 'block',
                                    margin: '0 auto',
                                }}
                            />
                        </Box>

                        <Typography variant="body2" align="center" color="textSecondary" sx={{ mb: 3 }}>
                            Sign in with your employee credentials
                        </Typography>

                        {error && (
                            <Alert
                                severity="error"
                                sx={{ mb: 2, borderRadius: 2 }}
                            >
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                            {/* ✅ Employee Code Field */}
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
                                onChange={handleEmployeeCodeChange}
                                disabled={loading}
                                placeholder="e.g., EMP-0088"
                                // helperText="Format: EMP-XXXX (e.g., EMP-0088)"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon sx={{ color: '#666' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#1a237e',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#666',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#1a237e',
                                    },
                                    '& .MuiFormHelperText-root': {
                                        color: '#999',
                                    },
                                }}
                            />

                            {/* ✅ Password Field */}
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                placeholder="Enter your password"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: '#666' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePassword}
                                                edge="end"
                                                disabled={loading}
                                            >
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#1a237e',
                                        },
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: '#666',
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#1a237e',
                                    },
                                }}
                            />

                            {/* ✅ Submit Button */}
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: 2,
                                    backgroundColor: '#1a237e',
                                    '&:hover': {
                                        backgroundColor: '#0d1445',
                                        boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
                                    },
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <CircularProgress size={24} color="inherit" />
                                ) : (
                                    "Sign In"
                                )}
                            </Button>

                            {/* ✅ Help Text */}
                            {/* <Box textAlign="center" sx={{ mt: 1 }}>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{
                                        color: '#999',
                                    }}
                                >
                                    Default password: <strong style={{ color: '#1a237e' }}>password123</strong>
                                </Typography>
                            </Box> */}
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </Box>
    );
};

export default Login;