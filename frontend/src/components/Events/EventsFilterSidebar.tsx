import React from 'react';
import type { EventFilters } from '../../hooks/api/events';
import { useUsers } from '../../hooks/api/reference';
import type { EventStatus } from '../../types/api';
import styles from './EventsFilterSidebar.module.css';

interface EventsFilterSidebarProps {
    filters: EventFilters;
    onChange: (next: EventFilters) => void;
}

const STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
    { value: 'draft', label: 'Wersja robocza' },
    { value: 'active', label: 'Aktywne' },
    { value: 'closed', label: 'Zakończone' },
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
            <div className={styles.headerRow}>
                <div className={styles.titleWrap}>
                    <div className={styles.icon} />
                    <div className={styles.heading}>Filtry</div>
                </div>
                <button className={styles.reset} onClick={handleReset}>
                    Resetuj
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <label className={styles.label}>Status</label>
                    {STATUS_OPTIONS.map((opt) => {
                        const checked = filters.status === opt.value;
                        return (
                            <label key={opt.value} className={styles.checkRow}>
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                        onChange({
                                            ...filters,
                                            status: checked ? null : opt.value,
                                            page: 1,
                                        })
                                    }
                                />
                                <span>{opt.label}</span>
                            </label>
                        );
                    })}
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Koordynator</label>
                    <div className={styles.selectBox}>
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
                            <option value="">Dowolny koordynator</option>
                            {users.data?.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsFilterSidebar;
