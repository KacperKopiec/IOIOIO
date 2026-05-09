import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className={styles.wrapper}>
            <Navbar onMenuClick={toggleSidebar} />
            <div className={styles.main}>
                <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
                <main className={styles.content} onClick={closeSidebar}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;