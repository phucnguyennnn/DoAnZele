import Contact from '~/pages/Contact';
import Home from '~/pages/Home';
import LoginPage from '~/pages/LoginPage';
import RegisterPage from '~/pages/RegisterPage';
import VerifyOtpPage from '~/pages/VerifyOtpPage';

const publicRoutes = [];

//private routes
const privateRoutes = [
    { path: '/', component: LoginPage, layout: null }, // Không dùng layout
    { path: '/contact', component: Contact },
    {
        path: '/register',
        component: RegisterPage,
        layout: null, // không cần layout mặc định nếu muốn
    },
    {
        path: '/verify-otp',
        component: VerifyOtpPage,
        layout: null,
    },
    {
        path: '/home',
        component: Home,
        layout: null, // không cần layout mặc định nếu muốn
    }
];


export { publicRoutes, privateRoutes };
