import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock, X } from 'lucide-react';
import { formatPLN, ownerInitials } from '../../lib/format';
import type { PipelineEntry } from '../../types/api';
import { formatRelativeDate, getStageTone } from './stageStyle';
import styles from './KanbanCard.module.css';

interface KanbanCardProps {
    entry: PipelineEntry;
}

function category(entry: PipelineEntry): string | null {
    if (entry.company?.industry?.name) {
        return entry.company.industry.name.toUpperCase();
    }
    if (entry.company?.tags?.[0]?.name) {
        return entry.company.tags[0].name.toUpperCase();
    }
    return null;
}

function ownerLabel(entry: PipelineEntry): string {
    if (!entry.owner) return 'Brak opiekuna';
    const initial = entry.owner.first_name.charAt(0).toUpperCase();
    return `Opiekun: ${initial}. ${entry.owner.last_name}`;
}

function bottomMeta(entry: PipelineEntry): {
    iconLabel: string;
    accent?: boolean;
} {
    const stage = entry.stage;
    if (stage?.outcome === 'won') {
        return {
            iconLabel: entry.closed_at
                ? `Zakończono: ${new Date(entry.closed_at).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                })}`
                : 'Zakończono',
        };
    }
    if (stage?.outcome === 'lost') {
        return {
            iconLabel: entry.closed_at
                ? `Przeniesiono: ${new Date(entry.closed_at).toLocaleDateString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                })}`
                : 'Odrzucono',
        };
    }
    if (stage?.name === 'Negocjacje') {
        return { iconLabel: 'Negocjacje w toku', accent: true };
    }
    if (stage?.name === 'Oferta wysłana') {
        return {
            iconLabel: entry.offer_sent_at
                ? `Wysłano ${formatRelativeDate(entry.offer_sent_at)}`
                : 'Oferta wysłana',
        };
    }
    if (entry.first_contact_at) {
        return { iconLabel: formatRelativeDate(entry.first_contact_at) };
    }
    return { iconLabel: formatRelativeDate(entry.updated_at) };
}

const KanbanCard: React.FC<KanbanCardProps> = ({ entry }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: entry.id,
            data: { entry },
        });

    const tone = getStageTone(entry.stage);
    const isWon = entry.stage?.outcome === 'won';
    const isLost = entry.stage?.outcome === 'lost';
    const isNegotiation = entry.stage?.name === 'Negocjacje';

    const cat = category(entry);
    const meta = bottomMeta(entry);
    const amount = entry.agreed_amount ?? entry.expected_amount;
    const showAmount = amount != null && (isWon || isLost === false);

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : undefined,
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`${styles.card} ${isWon ? styles.cardWon : ''} ${isLost ? styles.cardLost : ''
                } ${isDragging ? styles.cardActive : ''} ${isNegotiation ? styles.cardBorderHighlight : ''
                }`}
        >
            <header className={styles.header}>
                {cat && (
                    <span
                        className={styles.categoryBadge}
                        style={{
                            backgroundColor: tone.badgeBg,
                            color: tone.badgeText,
                        }}
                    >
                        {cat}
                    </span>
                )}
                <span className={styles.dragHandle} aria-hidden>
                    ⋮
                </span>
            </header>

            <div className={styles.body}>
                <div className={styles.companyIcon}>
                    {entry.company?.name.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className={styles.info}>
                    <span className={styles.companyName}>
                        {entry.company?.name ?? `Firma #${entry.company_id}`}
                    </span>
                    <span className={styles.ownerLine}>{ownerLabel(entry)}</span>
                </div>
            </div>

            {isWon && (
                <span className={`${styles.statusBadge} ${styles.statusBadgeWon}`}>
                    <Check size={11} />
                    Umowa podpisana
                </span>
            )}
            {isLost && (
                <span className={`${styles.statusBadge} ${styles.statusBadgeLost}`}>
                    <X size={11} />
                    {entry.rejection_reason ?? 'Brak budżetu'}
                </span>
            )}

            <footer className={styles.footer}>
                <span
                    className={`${styles.metaLeft} ${meta.accent ? styles.metaLeftAccent : ''
                        }`}
                >
                    <Clock size={11} />
                    {meta.iconLabel}
                </span>
                {showAmount && !isLost ? (
                    <span
                        className={`${styles.amountBadge} ${isWon ? styles.amountBadgeWon : ''
                            } ${isNegotiation ? styles.amountBadgeNegotiation : ''}`}
                    >
                        {formatPLN(amount)}
                    </span>
                ) : (
                    <span className={styles.avatarCircle}>
                        {entry.owner
                            ? ownerInitials(entry.owner.first_name, entry.owner.last_name)
                            : '—'}
                    </span>
                )}
            </footer>
        </article>
    );
};

export default KanbanCard;
