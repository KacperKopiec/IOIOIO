import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import EventDetail from './pages/EventDetail';
import EventPipeline from './pages/EventPipeline';
import Events from './pages/Events';
import Firms from './pages/Firms';
import { AuthProvider } from './context/AuthContext';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="firms" element={<Firms />} />
                        <Route path="events" element={<Events />} />
                        <Route path="events/:id" element={<EventDetail />} />
                        <Route path="events/:id/pipeline" element={<EventPipeline />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
