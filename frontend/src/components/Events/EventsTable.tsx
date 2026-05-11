import React from 'react';
import EventRow from './EventRow';
import type { EventTypeId } from '../../constants/eventTypes';
import type { EventStatusId } from '../../constants/eventStatuses';
import styles from './EventsTable.module.css';

interface Event {
    id: number;
    name: string;
    date: string;
    type: EventTypeId;
    coordinator: string;
    partners: number;
    status: EventStatusId;
}

const sampleEvents: Event[] = [
    {
        id: 1,
        name: 'AI Summit 2024',
        date: '12.10.2024',
        type: 'conference',
        coordinator: 'Ewa Kowalska',
        partners: 3,
        status: 'planned'
    },
    {
        id: 2,
        name: 'Webinarium UX/UI',
        date: '15.11.2024',
        type: 'workshop',
        coordinator: 'Marek Wielki',
        partners: 2,
        status: 'ongoing'
    },
    {
        id: 3,
        name: 'Cybersecurity Hackathon',
        date: '05.09.2024',
        type: 'hackathon',
        coordinator: 'Piotr Zieliński',
        partners: 12,
        status: 'cancelled'
    },
    {
        id: 4,
        name: 'B2B Networking Night',
        date: '20.10.2024',
        type: 'networking',
        coordinator: 'Ewa Kowalska',
        partners: 8,
        status: 'planned'
    }
];

const EventsTable: React.FC = () => {
    return (
        <div className={styles.card}>
            <div className={styles.table}>
                <div className={styles.headerRow}>
                    <div className={styles.headerCell} style={{ width: '64px' }}>
                        <input type="checkbox" className={styles.headerCheckbox} />
                    </div>
                    <div className={styles.headerCell} style={{ width: '310px' }}>
                        NAZWA
                    </div>
                    <div className={styles.headerCell} style={{ width: '125px' }}>
                        TYP
                    </div>
                    <div className={styles.headerCell} style={{ width: '190px' }}>
                        KOORDYNATOR
                    </div>
                    <div className={styles.headerCell} style={{ width: '125px' }}>
                        PARTNERZY
                    </div>
                    <div className={styles.headerCell} style={{ width: '153px' }}>
                        STATUS
                    </div>
                </div>

                <div className={styles.body}>
                    {sampleEvents.map((event) => (
                        <EventRow key={event.id} {...event} />
                    ))}
                </div>
            </div>

            <div className={styles.pagination}>
                <span className={styles.paginationText}>Pokazano 1-10 z 84 wydarzeń</span>
                <div className={styles.paginationControls}>
                    <button className={styles.paginationBtn}>‹</button>
                    <button className={styles.paginationBtn} style={{ backgroundColor: '#1E3A8A', color: '#FFFFFF' }}>1</button>
                    <button className={styles.paginationBtn}>2</button>
                    <button className={styles.paginationBtn}>3</button>
                    <button className={styles.paginationBtn}>›</button>
                </div>
            </div>
        </div>
    );
};

export default EventsTable;
