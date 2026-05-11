import React from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconLeft?: React.ReactNode;
    iconRight?: React.ReactNode;
    iconOnly?: boolean;
    fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {
        variant = 'primary',
        size = 'md',
        iconLeft,
        iconRight,
        iconOnly = false,
        fullWidth = false,
        className,
        children,
        type = 'button',
        ...rest
    },
    ref,
) {
    const classes = [
        styles.button,
        styles[variant],
        styles[size],
        iconOnly ? styles.iconOnly : '',
        fullWidth ? styles.fullWidth : '',
        className ?? '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button ref={ref} type={type} className={classes} {...rest}>
            {iconLeft}
            {!iconOnly && children}
            {iconRight}
        </button>
    );
});

export default Button;
