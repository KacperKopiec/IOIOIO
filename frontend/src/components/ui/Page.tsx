import React from 'react';
import styles from './Page.module.css';

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
    width?: 'default' | 'wide' | 'full';
}

const Page: React.FC<PageProps> = ({
    width = 'default',
    className,
    children,
    ...rest
}) => {
    const classes = [
        styles.page,
        width === 'wide' ? styles.pageWide : '',
        width === 'full' ? styles.pageFull : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
};

export default Page;
