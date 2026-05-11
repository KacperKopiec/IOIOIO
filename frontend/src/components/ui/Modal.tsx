import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

interface ModalProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'default' | 'large';
}

const Modal: React.FC<ModalProps> = ({
    open,
    title,
    onClose,
    children,
    footer,
    size = 'default',
}) => {
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className={styles.backdrop}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            role="presentation"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={`${styles.dialog} ${size === 'large' ? styles.dialogLarge : ''
                    }`}
            >
                <header className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Zamknij"
                    >
                        <X size={18} />
                    </button>
                </header>
                <div className={styles.body}>{children}</div>
                {footer && <footer className={styles.footer}>{footer}</footer>}
            </div>
        </div>,
        document.body,
    );
};

export default Modal;
