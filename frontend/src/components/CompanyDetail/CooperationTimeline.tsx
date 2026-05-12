import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate, formatPLN } from '../../lib/format';
import type { CompanyEventLink } from '../../hooks/api/companies';
import styles from './CooperationTimeline.module.css';

interface CooperationTimelineProps {
    eventLinks: CompanyEventLink[];
    companyId: number;
    isLoading: boolean;
}

function dotClass(outcome: string): string {
    switch (outcome) {
        case 'won':
            return styles.dotWon;
        case 'lost':
            return styles.dotLost;
        case 'open':
            return styles.dotOpen;
        default:
            return styles.dotNeutral;
    }
}

function descriptionFor(link: CompanyEventLink): string {
    if (link.stage_outcome === 'won') {
        return `Współpraca sfinalizowana na etapie "${link.stage_name}".`;
    }
    if (link.stage_outcome === 'lost') {
        return `Pipeline zakończony na etapie "${link.stage_name}".`;
    }
    return `Aktywny pipeline na etapie "${link.stage_name}".`;
}

const CooperationTimeline: React.FC<CooperationTimelineProps> = ({
    eventLinks,
    companyId,
    isLoading,
}) => {
    if (isLoading) {
        return <div className={styles.empty}>Ładowanie historii…</div>;
    }
    if (eventLinks.length === 0) {
        return <div className={styles.empty}>Brak historii współpracy.</div>;
    }

    return (
        <div className={styles.timeline}>
            {eventLinks.map((link) => (
                <div key={link.pipeline_entry_id} className={styles.item}>
                    <span className={`${styles.dot} ${dotClass(link.stage_outcome)}`}>
                        <span className={styles.dotInner} />
                    </span>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Link
                                to={`/events/${link.event_id}/companies/${companyId}`}
                                className={styles.cardTitle}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {link.event_name}
                            </Link>
                            <span className={styles.cardDate}>
                                {formatDate(link.event_start_date)}
                            </span>
                        </div>
                        <div className={styles.cardBody}>{descriptionFor(link)}</div>
                        {(link.agreed_amount != null ||
                            link.expected_amount != null) && (
                                <div
                                    className={`${styles.cardAmount} ${link.stage_outcome === 'lost'
                                        ? styles.cardAmountLost
                                        : ''
                                        }`}
                                >
                                    {link.stage_outcome === 'won'
                                        ? `Wartość: ${formatPLN(link.agreed_amount ?? link.expected_amount)}`
                                        : `Oczekiwane: ${formatPLN(link.expected_amount ?? link.agreed_amount)}`}
                                </div>
                            )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CooperationTimeline;
