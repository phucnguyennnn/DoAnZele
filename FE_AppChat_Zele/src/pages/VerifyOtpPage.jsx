import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, TextField, Button, CircularProgress } from "@mui/material";
import axios from "axios";

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";  // Lấy email từ state của router

  const [otp, setOtp] = useState("");  // Trạng thái mã OTP
  const [message, setMessage] = useState("");  // Thông báo xác thực
  const [loading, setLoading] = useState(false);  // Trạng thái loading khi gọi API

  const handleVerify = async () => {
    setLoading(true);
    setMessage("");  // Xóa thông báo trước khi gửi
  
    try {
      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email,
        otp,
      });
  
      console.log("Server Response:", res.data);  // Log toàn bộ phản hồi để kiểm tra cấu trúc
  
      if (res.status === 200) {
        setMessage("Xác thực thành công!");
        setTimeout(() => {
          navigate("/home");
        }, 2000);
      } else {
        setMessage("Xác thực thất bại!");
      }
    } catch (err) {
      console.error(err.response);
      setMessage("Lỗi khi xác thực OTP");
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleResendOTP = async () => {
    setMessage(""); // Xóa thông báo cũ
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/resend-otp", {
        email,
      });

      if (res.status === 200) {
        setMessage("Mã OTP mới đã được gửi!");
      } else {
        setMessage("Không thể gửi lại mã OTP!");
      }
    } catch (err) {
      setMessage("Lỗi khi gửi lại OTP");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <Box sx={{ maxWidth: 400, margin: "auto", mt: 6 }}>
      <Typography variant="h5" mb={2}>Xác thực OTP</Typography>
      <Typography mb={1}>
        Nhập mã OTP đã gửi tới email: <strong>{email}</strong>
      </Typography>
      <TextField
        fullWidth
        label="Mã OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        margin="normal"
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleVerify}
        sx={{ mt: 2 }}
        disabled={loading}  // Vô hiệu hóa nút khi đang loading
      >
        {loading ? <CircularProgress size={24} /> : "Xác nhận"}
      </Button>
      <Button
        fullWidth
        variant="text"
        onClick={handleResendOTP}
        sx={{ mt: 2 }}
        disabled={loading}  // Vô hiệu hóa nút khi đang loading
      >
        {loading ? <CircularProgress size={24} /> : "Gửi lại mã OTP"}
      </Button>
      {message && (
        <Typography mt={2} color={message === "Xác thực thành công!" ? "green" : "red"}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default VerifyOtpPage;
