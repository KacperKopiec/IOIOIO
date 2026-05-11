import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCoordinator from './dashboards/DashboardCoordinator';
import DashboardPromotion from './dashboards/DashboardPromotion';
import DashboardRelationshipManager from './dashboards/DashboardRelationshipManager';

const Dashboard: React.FC = () => {
    const { role } = useAuth();

    switch (role) {
        case 'promocja':
            return <DashboardPromotion />;
        case 'opiekun':
            return <DashboardRelationshipManager />;
        case 'koordynator':
        default:
            return <DashboardCoordinator />;
    }
};

export default Dashboard;
