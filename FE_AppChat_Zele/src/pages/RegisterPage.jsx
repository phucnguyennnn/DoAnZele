import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Snackbar } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        name: '',
        password: '',
    });

    const [loading, setLoading] = useState(false); // ✅ Thêm state loading
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async () => {
        setLoading(true); // ✅ Bật loading
        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            if (res.status === 200) {
                setSnackbarMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực OTP.');
                setOpenSnackbar(true);
                navigate("/verify-otp", { state: { email: formData.email } });
                console.log('Đăng ký thành công:', res.data);
            }
        } catch (error) {
            console.error('Đăng ký thất bại:', error);
            if (error.response) {
                console.log('Lỗi từ server:', error.response.data);
                alert('Đăng ký không thành công: ' + error.response.data.message);
            } else {
                alert('Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
            }
        } finally {
            setLoading(false); // ✅ Tắt loading dù thành công hay thất bại
        }
    };

    return (
        <Box
            sx={{
                backgroundColor: '#dfe8ef',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    padding: 4,
                    borderRadius: 3,
                    width: 400,
                    backgroundColor: 'white',
                }}
            >
                <Typography variant="h5" align="center" gutterBottom>
                    Đăng ký tài khoản
                </Typography>
                <TextField
                    label="Số điện thoại"
                    name="phone"
                    fullWidth
                    margin="normal"
                    value={formData.phone}
                    onChange={handleChange}
                />
                <TextField
                    label="Email"
                    name="email"
                    fullWidth
                    margin="normal"
                    value={formData.email}
                    onChange={handleChange}
                />
                <TextField
                    label="Họ và tên"
                    name="name"
                    fullWidth
                    margin="normal"
                    value={formData.name}
                    onChange={handleChange}
                />
                <TextField
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={formData.password}
                    onChange={handleChange}
                />
                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleRegister}
                    disabled={loading} // ✅ Vô hiệu nút khi đang xử lý
                >
                    {loading ? "Đang xử lý..." : "Đăng ký"} {/* ✅ Đổi chữ theo trạng thái */}
                </Button>
            </Paper>

            {/* Snackbar thông báo đăng ký thành công */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default RegisterPage;
