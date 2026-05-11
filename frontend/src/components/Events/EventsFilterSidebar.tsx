import React, { useState } from 'react';
import { EVENT_TYPES, type EventTypeId } from '../../constants/eventTypes';
import styles from './EventsFilterSidebar.module.css';

const EventsFilterSidebar: React.FC = () => {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<Set<EventTypeId>>(new Set());
    const [status, setStatus] = useState('all');
    const [coordinator, setCoordinator] = useState('');

    const toggleEventType = (typeId: EventTypeId) => {
        const newSelected = new Set(selectedTypes);
        if (newSelected.has(typeId)) {
            newSelected.delete(typeId);
        } else {
            newSelected.add(typeId);
        }
        setSelectedTypes(newSelected);
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setSelectedTypes(new Set());
        setStatus('all');
        setCoordinator('');
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
                {/* Date Range */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>DATA (ZAKRES)</label>
                    <div className={styles.dateInputsContainer}>
                        <input
                            type="date"
                            className={styles.dateInput}
                            placeholder="Od: DD.MM.RRRR"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <input
                            type="date"
                            className={styles.dateInput}
                            placeholder="Do: DD.MM.RRRR"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>

                {/* Event Type */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>TYP WYDARZENIA</label>
                    <div className={styles.checkboxGroup}>
                        {Object.values(EVENT_TYPES).map((type) => (
                            <label key={type.id} className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={selectedTypes.has(type.id as EventTypeId)}
                                    onChange={() => toggleEventType(type.id as EventTypeId)}
                                />
                                <span>{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>STATUS</label>
                    <select
                        className={styles.select}
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="all">Wszystkie statusy</option>
                        <option value="planned">Zaplanowane</option>
                        <option value="ongoing">W trakcie</option>
                        <option value="completed">Ukończone</option>
                        <option value="cancelled">Anulowane</option>
                    </select>
                </div>

                {/* Coordinator */}
                <div className={styles.section}>
                    <label className={styles.sectionLabel}>KOORDYNATOR</label>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Wyszukaj osobę..."
                        value={coordinator}
                        onChange={(e) => setCoordinator(e.target.value)}
                    />
                </div>

                {/* Apply Button */}
                <button className={styles.applyBtn}>ZASTOSUJ FILTRY</button>
            </div>
        </div>
    );
};

export default EventsFilterSidebar;
