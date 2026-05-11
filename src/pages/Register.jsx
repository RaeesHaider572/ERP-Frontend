import React, { useState } from "react";
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Link,
    CircularProgress
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        setLoading(true);
        const result = await register(name, email, password);
        setLoading(false);

        if (result.success) {
            setSuccess(result.message || "Registration successful! Please login.");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } else {
            setError(result.message || "Registration failed. Please try again.");
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
                        Sign Up
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                            {success}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="name"
                            label="Full Name"
                            name="name"
                            autoComplete="name"
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Email Address"
                            name="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm Password"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "Sign Up"}
                        </Button>
                        <Box textAlign="center">
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => navigate("/login")}
                                sx={{ cursor: "pointer" }}
                            >
                                Already have an account? Sign In
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;

