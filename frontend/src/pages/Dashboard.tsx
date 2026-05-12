import React from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardManagement from './dashboards/DashboardManagement';

const Dashboard: React.FC = () => {
    const { role } = useAuth();

    switch (role) {
        case 'zarzad':
        // return <DashboardManagement />;
        case 'promocja':
        // return <DashboardPromotion />;
        case 'koordynator':
        // return <DashboardCoordinator />;
        case 'opiekun':
        // return <DashboardRelationshipManager />;
        default:
            return <DashboardManagement />;
    }
};

export default Dashboard;