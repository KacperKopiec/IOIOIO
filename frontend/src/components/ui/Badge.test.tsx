import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
    it('renders children', () => {
        render(<Badge>Aktywne</Badge>);
        expect(screen.getByText('Aktywne')).toBeInTheDocument();
    });

    it('applies tone class', () => {
        const { container } = render(<Badge tone="success">OK</Badge>);
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toMatch(/success/);
    });

    it('renders a dot when withDot is true', () => {
        const { container } = render(<Badge withDot>Z dot</Badge>);
        // dot is the first span inside the badge
        const dot = container.querySelector('span > span');
        expect(dot).toBeTruthy();
    });

    it('applies pill + uppercase modifiers', () => {
        const { container } = render(
            <Badge pill uppercase>
                Status
            </Badge>,
        );
        const badge = container.firstChild as HTMLElement;
        expect(badge.className).toMatch(/pill/);
        expect(badge.className).toMatch(/uppercase/);
    });
});
