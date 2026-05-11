import React from 'react';
import FirmRow from './FirmRow';
import styles from './FirmsTable.module.css';

interface Firm {
    id: number;
    name: string;
    city: string;
    tags: string[];
    type: string;
    coordinator: string;
    status: 'Aktywny partner' | 'Kontakt' | 'Prospect';
    lastContact: string;
}

const sample: Firm[] = [
    {
        id: 1,
        name: 'CloudTech Solutions',
        city: 'Warszawa',
        tags: ['cloud', 'saas'],
        type: 'tech_startup',
        coordinator: 'Marek Nowak',
        status: 'Aktywny partner',
        lastContact: '12.10.2023'
    },
    {
        id: 2,
        name: 'DataAI Systems',
        city: 'Kraków',
        tags: ['ai_ml', 'research'],
        type: 'research_institute',
        coordinator: 'Anna Kowalski',
        status: 'Kontakt',
        lastContact: '05.11.2023'
    },
    {
        id: 3,
        name: 'Blockchain Ventures',
        city: 'Wrocław',
        tags: ['blockchain', 'startup'],
        type: 'tech_startup',
        coordinator: 'Piotr Lewandowski',
        status: 'Prospect',
        lastContact: '18.10.2023'
    },
    {
        id: 4,
        name: 'Enterprise Corp',
        city: 'Poznań',
        tags: ['enterprise', 'partner'],
        type: 'corporation',
        coordinator: 'Barbara Wójcik',
        status: 'Aktywny partner',
        lastContact: '02.11.2023'
    },
    {
        id: 5,
        name: 'FinTech Innovation',
        city: 'Gdańsk',
        tags: ['saas', 'startup'],
        type: 'tech_startup',
        coordinator: 'Marek Nowak',
        status: 'Kontakt',
        lastContact: '08.11.2023'
    },
    {
        id: 6,
        name: 'AGH Kraków',
        city: 'Kraków',
        tags: ['research', 'partner'],
        type: 'university',
        coordinator: 'Dr. Jarosław Zieliński',
        status: 'Aktywny partner',
        lastContact: '01.11.2023'
    },
    {
        id: 7,
        name: 'MicroStartup Pro',
        city: 'Warszawa',
        tags: ['cloud', 'ai_ml'],
        type: 'sme',
        coordinator: 'Anna Kowalski',
        status: 'Prospect',
        lastContact: '15.10.2023'
    },
    {
        id: 8,
        name: 'Global Consulting Ltd',
        city: 'Wrocław',
        tags: ['enterprise', 'consultant'],
        type: 'consultant',
        coordinator: 'Piotr Lewandowski',
        status: 'Kontakt',
        lastContact: '20.10.2023'
    }
];

const FirmsTable: React.FC = () => {
    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.checkboxHeader}></div>
                <div className={styles.nameHeader}>Nazwa firmy / Miasto</div>
                <div className={styles.tagsHeader}>Tagi & Typ</div>
                <div className={styles.coordinatorHeader}>Koordynator</div>
                <div className={styles.statusHeader}>Status</div>
                <div className={styles.dateHeader}>Ostatni kontakt</div>
            </div>

            <div className={styles.body}>
                {sample.map((firm) => (
                    <FirmRow key={firm.id} {...firm} />
                ))}
            </div>

            <div className={styles.pagination}>Pokazano 1-10 z 84 firm</div>
        </div>
    );
};

export default FirmsTable;
