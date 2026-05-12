import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopBar from '../TopBar/TopBar';
import styles from './Layout.module.css';

const Layout = () => (
    <div className={styles.page}>
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.main}>
                <TopBar />
                <div className={styles.container}>
                    <Outlet />
                </div>
            </main>
        </div>
    </div>
);

export default Layout;