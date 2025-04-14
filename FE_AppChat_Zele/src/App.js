import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { privateRoutes, publicRoutes } from '~/routes';
import { DefaultLayout } from '~/components/Layout';
import { useState, useEffect } from 'react';
import { Fragment } from 'react';
import { useLocation } from 'react-router-dom';


function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));

    useEffect(() => {
        const checkAuth = () => {
            setIsAuthenticated(!!localStorage.getItem('accessToken'));
        };

        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    // Tạo component con để sử dụng useLocation
    const AuthWrapper = () => {
        const location = useLocation();

        const RequireAuth = ({ children }) => {
            if (!isAuthenticated) {
                return <Navigate to="/" state={{ from: location.pathname }} replace />;
            }
            return children;
        };

        const RedirectIfAuth = ({ children }) => {
            if (isAuthenticated) {
                return <Navigate to="/home" replace />;
            }
            return children;
        };

        return (
            <Routes>
                {/* Public routes */}
                {publicRoutes.map((route) => {
                    const Layout = route.layout === null ? Fragment : DefaultLayout;
                    const Element = route.component;
                    return (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <RedirectIfAuth>
                                    <Layout>
                                        <Element setIsAuthenticated={setIsAuthenticated} />
                                    </Layout>
                                </RedirectIfAuth>
                            }
                        />
                    );
                })}

                {/* Private routes */}
                {privateRoutes.map((route) => {
                    const Layout = route.layout === null ? Fragment : DefaultLayout;
                    const Element = route.component;
                    return (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <RequireAuth>
                                    <Layout>
                                        <Element />
                                    </Layout>
                                </RequireAuth>
                            }
                        />
                    );
                })}
            </Routes>
        );
    };

    return (
        <Router>
            <AuthWrapper />
        </Router>
    );
}

export default App;