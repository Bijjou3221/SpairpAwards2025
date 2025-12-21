import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Toaster } from 'sonner';
import { StatusPage } from './pages/StatusPage';

function App() {
    return (
        <BrowserRouter>
            <Toaster position="top-center" richColors theme="dark" />
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
