import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
    // With HttpOnly cookies, we can't check the token directly.
    // We check for the user metadata which indicates a successful login flow occurred.
    // Real auth verification happens on every API call via the cookie.
    const user = localStorage.getItem('user');

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
