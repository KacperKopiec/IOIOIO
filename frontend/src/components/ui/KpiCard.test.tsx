import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
    it('renders label, value, and sub', () => {
        render(
            <KpiCard
                label="Partnerzy"
                value="4 / 10"
                sub="40% celu"
                icon={<span data-testid="icon" />}
            />,
        );
        expect(screen.getByText('Partnerzy')).toBeInTheDocument();
        expect(screen.getByText('4 / 10')).toBeInTheDocument();
        expect(screen.getByText('40% celu')).toBeInTheDocument();
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('applies tone class on the icon wrapper', () => {
        const { container } = render(
            <KpiCard
                label="L"
                value="V"
                tone="danger"
                icon={<span data-testid="icon" />}
            />,
        );
        const wrap = container.querySelector('span');
        expect(wrap?.className).toMatch(/Danger/);
    });
});
