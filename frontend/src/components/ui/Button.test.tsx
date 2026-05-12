import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
    it('renders children and fires onClick', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Zapisz</Button>);
        const btn = screen.getByRole('button', { name: 'Zapisz' });
        await userEvent.click(btn);
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('does not fire onClick when disabled', async () => {
        const onClick = vi.fn();
        render(
            <Button onClick={onClick} disabled>
                Zapisz
            </Button>,
        );
        await userEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
        expect(onClick).not.toHaveBeenCalled();
    });

    it('applies variant + size classes', () => {
        render(<Button variant="ghost" size="sm">Anuluj</Button>);
        const btn = screen.getByRole('button', { name: 'Anuluj' });
        expect(btn.className).toMatch(/ghost/);
        expect(btn.className).toMatch(/sm/);
    });

    it('defaults to type=button', () => {
        render(<Button>OK</Button>);
        expect(screen.getByRole('button', { name: 'OK' })).toHaveAttribute(
            'type',
            'button',
        );
    });

    it('renders icons in iconOnly mode without the label', () => {
        render(
            <Button iconOnly aria-label="Add" iconLeft={<span data-testid="icon">+</span>}>
                Add
            </Button>,
        );
        const btn = screen.getByRole('button', { name: 'Add' });
        // children are omitted; icon stays
        expect(btn).not.toHaveTextContent('Add');
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
