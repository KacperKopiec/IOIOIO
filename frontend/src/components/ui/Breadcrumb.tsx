import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbItem {
    label: string;
    to?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    separator?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = '›' }) => {
    return (
        <nav className={styles.nav} aria-label="breadcrumb">
            {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                return (
                    <React.Fragment key={`${item.label}-${idx}`}>
                        {item.to && !isLast ? (
                            <Link to={item.to} className={styles.item}>
                                {item.label}
                            </Link>
                        ) : (
                            <span
                                className={isLast ? styles.current : styles.item}
                            >
                                {item.label}
                            </span>
                        )}
                        {!isLast && (
                            <span className={styles.sep} aria-hidden>
                                {separator}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
