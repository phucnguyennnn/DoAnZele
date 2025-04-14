import LoginPage from '~/pages/LoginPage';
import RegisterPage from '~/pages/RegisterPage';
import VerifyOtpPage from '~/pages/VerifyOtpPage';
import Home from '~/pages/Home';
import ProfilePage from '~/pages/ProfilePage';

export const publicRoutes = [
    {
        path: '/',
        component: LoginPage,
        layout: null // No layout for the login page

    },
    {
        path: '/register',
        component: RegisterPage,
        layout: null // No layout for the register page

    },
    {
        path: '/verify-otp',
        component: VerifyOtpPage,
        layout: null // No layout for the verify OTP page
    }
];

export const privateRoutes = [
    {
        path: '/home',
        component: Home,
        layout: null // No layout for the home page
    },
    {
        path: '/profile',
        component: ProfilePage,
        layout: null // No layout for the profile page
    }
];

