import React from 'react';
import type { EventFilters } from '../../hooks/api/events';
import { useUsers } from '../../hooks/api/reference';
import type { EventStatus } from '../../types/api';
import styles from './EventsFilterSidebar.module.css';

interface EventsFilterSidebarProps {
    filters: EventFilters;
    onChange: (next: EventFilters) => void;
}

const STATUS_OPTIONS: { value: EventStatus | ''; label: string }[] = [
    { value: '', label: 'Wszystkie statusy' },
    { value: 'draft', label: 'Wersja robocza' },
    { value: 'active', label: 'Aktywne' },
    { value: 'closed', label: 'Ukończone' },
    { value: 'cancelled', label: 'Anulowane' },
];

const EventsFilterSidebar: React.FC<EventsFilterSidebarProps> = ({
    filters,
    onChange,
}) => {
    const users = useUsers('koordynator');

    const handleReset = () => {
        onChange({ page: 1, page_size: filters.page_size });
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.title}>Filtry</h3>
                <button className={styles.resetBtn} onClick={handleReset}>
                    Resetuj
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>WYSZUKAJ</label>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Nazwa lub opis…"
                        value={filters.q ?? ''}
                        onChange={(e) =>
                            onChange({ ...filters, q: e.target.value || undefined, page: 1 })
                        }
                    />
                </div>

                <div className={styles.section}>
                    <label className={styles.sectionLabel}>STATUS</label>
                    <select
                        className={styles.select}
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...filters,
                                status: (e.target.value || null) as EventStatus | null,
                                page: 1,
                            })
                        }
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.section}>
                    <label className={styles.sectionLabel}>KOORDYNATOR</label>
                    <select
                        className={styles.select}
                        value={filters.owner_user_id ?? ''}
                        onChange={(e) =>
                            onChange({
                                ...filters,
                                owner_user_id: e.target.value
                                    ? Number.parseInt(e.target.value, 10)
                                    : null,
                                page: 1,
                            })
                        }
                    >
                        <option value="">Dowolny</option>
                        {users.data?.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.first_name} {u.last_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default EventsFilterSidebar;
