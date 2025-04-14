import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  CircularProgress, 
  Link 
} from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';


const Container = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f5f7fa',
});

const LoginCard = styled(Box)({
  width: '100%',
  maxWidth: 400,
  padding: '32px', // Tương đương theme.spacing(4)
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  boxShadow: '0px 3px 1px -2px rgba(0,0,0,0.2), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 1px 5px 0px rgba(0,0,0,0.12)', // Shadow mức 3
  textAlign: 'center',
});

const encryptData = (data) => {
  return JSON.stringify(data); // Có thể thay bằng mã hóa nâng cao nếu cần
};
const LoginPage = ({ setIsAuthenticated }) => {
  const location = useLocation(); // Thêm dòng này
  

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const { email, password } = formData;
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    
    if (!gmailRegex.test(email)) {
      setError('Vui lòng nhập địa chỉ Gmail hợp lệ');
      return false;
    }
    
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

      setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      const { accessToken, user } = response.data.data;

      // Lưu vào localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', encryptData(user)); // <-- SỬA Ở ĐÂY

      setIsAuthenticated(true);
      navigate(location.state?.from || '/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" color="primary" gutterBottom>
          Zele
        </Typography>
        
        <TextField
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        
        <TextField
          name="password"
          label="Mật khẩu"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        
        {error && (
          <Typography color="error" variant="body2" mt={1}>
            {error}
          </Typography>
        )}
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ mt: 3, mb: 2, height: 48 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Đăng nhập'}
        </Button>
        
        <Typography variant="body2">
          Chưa có tài khoản?{' '}
          <Link href="/register" underline="hover">
            Đăng ký ngay
          </Link>
        </Typography>
      </LoginCard>
    </Container>
  );
};

export default LoginPage;