import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './context/AuthContext';
import { Card, EmptyState, Page } from './components/ui';

// Lightweight, always-in-bundle (these are the entry-level routes).
import Dashboard from './pages/Dashboard';
import Firms from './pages/Firms';
import Events from './pages/Events';

// Lazy: pulls in recharts (Reports), dnd-kit (EventPipeline), the deep
// detail screens, and their heavy subcomponent trees. Each lazy import
// becomes its own chunk so first paint on /dashboard, /firms, /events
// no longer ships the 400 KB recharts bundle.
const Reports = lazy(() => import('./pages/Reports'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventPipeline = lazy(() => import('./pages/EventPipeline'));
const EventCompany = lazy(() => import('./pages/EventCompany'));
const CompanyDetail = lazy(() => import('./pages/CompanyDetail'));

const RouteFallback = () => (
    <Page width="wide">
        <Card>
            <EmptyState>Ładowanie…</EmptyState>
        </Card>
    </Page>
);

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="firms" element={<Firms />} />
                        <Route
                            path="companies/:id"
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <CompanyDetail />
                                </Suspense>
                            }
                        />
                        <Route path="events" element={<Events />} />
                        <Route
                            path="events/:id"
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <EventDetail />
                                </Suspense>
                            }
                        />
                        <Route
                            path="events/:id/pipeline"
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <EventPipeline />
                                </Suspense>
                            }
                        />
                        <Route
                            path="events/:id/companies/:companyId"
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <EventCompany />
                                </Suspense>
                            }
                        />
                        <Route
                            path="reports"
                            element={
                                <Suspense fallback={<RouteFallback />}>
                                    <Reports />
                                </Suspense>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
