import React from 'react';
import Breadcrumb, { type BreadcrumbItem } from './Breadcrumb';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    breadcrumb?: BreadcrumbItem[];
    title: React.ReactNode;
    chips?: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
    breadcrumb,
    title,
    chips,
    subtitle,
    actions,
}) => {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {breadcrumb && breadcrumb.length > 0 && (
                    <Breadcrumb items={breadcrumb} />
                )}
                <div className={styles.titleRow}>
                    <h1 className={styles.title}>{title}</h1>
                    {chips}
                </div>
                {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
        </header>
    );
};

export default PageHeader;
