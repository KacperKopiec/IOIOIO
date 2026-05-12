import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';

function renderWithRouter(ui: React.ReactNode) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumb', () => {
    it('renders all items', () => {
        renderWithRouter(
            <Breadcrumb
                items={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: 'SFI 2024' },
                ]}
            />,
        );
        expect(screen.getByText('Wydarzenia')).toBeInTheDocument();
        expect(screen.getByText('SFI 2024')).toBeInTheDocument();
    });

    it('makes intermediate items into links and the last item a span', () => {
        renderWithRouter(
            <Breadcrumb
                items={[
                    { label: 'Wydarzenia', to: '/events' },
                    { label: 'SFI 2024', to: '/events/1' },
                    { label: 'Lejek' },
                ]}
            />,
        );
        const eventsLink = screen.getByText('Wydarzenia').closest('a');
        const sfiLink = screen.getByText('SFI 2024').closest('a');
        expect(eventsLink).toHaveAttribute('href', '/events');
        expect(sfiLink).toHaveAttribute('href', '/events/1');
        expect(screen.getByText('Lejek').tagName).toBe('SPAN');
    });

    it('renders separators between items', () => {
        const { container } = renderWithRouter(
            <Breadcrumb
                items={[{ label: 'A', to: '/a' }, { label: 'B' }]}
            />,
        );
        // one separator between two items
        const seps = container.querySelectorAll('[aria-hidden="true"]');
        expect(seps).toHaveLength(1);
    });
});
