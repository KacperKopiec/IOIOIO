import React from 'react';
import type { CompanyFilters } from '../../hooks/api/companies';
import { useEvents } from '../../hooks/api/events';
import {
    useIndustries,
    usePipelineStages,
    useRelationshipTypes,
    useTags,
    useUsers,
} from '../../hooks/api/reference';
import { FIRM_TAGS } from '../../constants/firmTags';
import type { CompanySize, StageOutcome } from '../../types/api';
import styles from './FilterSidebar.module.css';

interface FilterSidebarProps {
    filters: CompanyFilters;
    onChange: (next: CompanyFilters) => void;
}

const COMPANY_SIZE_OPTIONS: { value: CompanySize; label: string }[] = [
    { value: 'corporation', label: 'Korporacja' },
    { value: 'sme', label: 'MŚP' },
    { value: 'startup', label: 'Startup' },
    { value: 'public_institution', label: 'Sektor publiczny' },
];

const PIPELINE_OUTCOME_OPTIONS: { value: StageOutcome; label: string }[] = [
    { value: 'won', label: 'Partner' },
    { value: 'open', label: 'W toku' },
    { value: 'lost', label: 'Odrzucony' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => CURRENT_YEAR - index);
type SegmentPreset = 'tech' | 'recruitment' | 'branding' | 'warm';

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onChange }) => {
    const industries = useIndustries();
    const pipelineStages = usePipelineStages();
    const relationshipTypes = useRelationshipTypes();
    const tags = useTags();
    const users = useUsers();
    const events = useEvents({ page: 1, page_size: 100 });

    const selectedTagIds = new Set(filters.tag_ids ?? []);

    const toggleTag = (tagId: number) => {
        const next = new Set(selectedTagIds);
        if (next.has(tagId)) next.delete(tagId);
        else next.add(tagId);
        onChange({ ...filters, tag_ids: Array.from(next), page: 1 });
    };

    const toggleSize = (size: CompanySize) => {
        const next: CompanySize | null =
            filters.company_size === size ? null : size;
        onChange({ ...filters, company_size: next, page: 1 });
    };

    const handleReset = () => {
        onChange({ page: 1, page_size: filters.page_size });
    };

    const applySegment = (segment: SegmentPreset) => {
        const tagNamesBySegment: Record<SegmentPreset, string[]> = {
            tech: ['ai_ml', 'cloud', 'cybersecurity', 'embedded', 'enterprise'],
            recruitment: ['recruitment'],
            branding: ['branding'],
            warm: ['partner', 'sponsor'],
        };
        const ids = tags.data
            ?.filter((tag) => tagNamesBySegment[segment].includes(tag.name))
            .map((tag) => tag.id) ?? [];
        const next = new Set([...(filters.tag_ids ?? []), ...ids]);
        onChange({
            ...filters,
            tag_ids: Array.from(next),
            pipeline_outcome: segment === 'warm' ? 'won' : filters.pipeline_outcome,
            page: 1,
        });
    };

    const pipelineStatusValue = filters.pipeline_stage_id
        ? `stage:${filters.pipeline_stage_id}`
        : filters.pipeline_outcome
          ? `outcome:${filters.pipeline_outcome}`
          : '';

    const handlePipelineStatusChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const value = e.target.value;
        if (!value) {
            onChange({
                ...filters,
                pipeline_stage_id: null,
                pipeline_outcome: null,
                page: 1,
            });
            return;
        }

        const [kind, rawValue] = value.split(':');
        if (kind === 'stage') {
            onChange({
                ...filters,
                pipeline_stage_id: Number.parseInt(rawValue, 10),
                pipeline_outcome: null,
                page: 1,
            });
            return;
        }

        onChange({
            ...filters,
            pipeline_stage_id: null,
            pipeline_outcome: rawValue as StageOutcome,
            page: 1,
        });
    };

    const tagColor = (tagName: string) => {
        const knownTag = Object.values(FIRM_TAGS).find((t) => t.id === tagName);
        return (
            knownTag ?? {
                bgColor: '#F3F4F6',
                textColor: '#374151',
                label: tagName,
            }
        );
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
                    <label className={styles.label}>Branża</label>
                    <div className={styles.selectBox}>
                        <select
                            className={styles.select}
                            value={filters.industry_id ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    industry_id: e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null,
                                    page: 1,
                                })
                            }
                        >
                            <option value="">Wszystkie branże</option>
                            {industries.data?.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Wielkość firmy</label>
                    {COMPANY_SIZE_OPTIONS.map((opt) => (
                        <label key={opt.value} className={styles.checkRow}>
                            <input
                                type="checkbox"
                                checked={filters.company_size === opt.value}
                                onChange={() => toggleSize(opt.value)}
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Relacja z AGH</label>
                    <label className={styles.checkRow}>
                        <input
                            type="checkbox"
                            checked={filters.relation_status === 'active'}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    relation_status: e.target.checked ? 'active' : null,
                                    page: 1,
                                })
                            }
                        />
                        <span>Aktywna umowa</span>
                    </label>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Typ współpracy</label>
                    <div className={styles.selectBox}>
                        <select
                            className={styles.select}
                            value={filters.relationship_type_id ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    relationship_type_id: e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null,
                                    page: 1,
                                })
                            }
                        >
                            <option value="">Wszystkie typy</option>
                            {relationshipTypes.data?.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Rok współpracy</label>
                    <div className={styles.selectBox}>
                        <select
                            className={styles.select}
                            value={filters.cooperation_year ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    cooperation_year: e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null,
                                    page: 1,
                                })
                            }
                        >
                            <option value="">Dowolny rok</option>
                            {YEAR_OPTIONS.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Opiekun relacji</label>
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
                            <option value="">Wszyscy opiekunowie</option>
                            {users.data?.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.first_name} {user.last_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Inicjatywa</label>
                    <div className={styles.selectBox}>
                        <select
                            className={styles.select}
                            value={filters.event_id ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...filters,
                                    event_id: e.target.value
                                        ? Number.parseInt(e.target.value, 10)
                                        : null,
                                    page: 1,
                                })
                            }
                        >
                            <option value="">Wszystkie inicjatywy</option>
                            {events.data?.items?.map((event) => (
                                <option key={event.id} value={event.id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Status pipeline</label>
                    <div className={styles.selectBox}>
                        <select
                            className={styles.select}
                            value={pipelineStatusValue}
                            onChange={handlePipelineStatusChange}
                        >
                            <option value="">Wszystkie statusy</option>
                            {PIPELINE_OUTCOME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={`outcome:${opt.value}`}>
                                    {opt.label}
                                </option>
                            ))}
                            {pipelineStages.data?.map((stage) => (
                                <option key={stage.id} value={`stage:${stage.id}`}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Segment pod zasiew lejka</label>
                    <div className={styles.segmentGrid}>
                        <button
                            type="button"
                            className={styles.segmentBtn}
                            onClick={() => applySegment('tech')}
                        >
                            Technologie
                        </button>
                        <button
                            type="button"
                            className={styles.segmentBtn}
                            onClick={() => applySegment('recruitment')}
                        >
                            Rekrutacja
                        </button>
                        <button
                            type="button"
                            className={styles.segmentBtn}
                            onClick={() => applySegment('branding')}
                        >
                            Branding
                        </button>
                        <button
                            type="button"
                            className={styles.segmentBtn}
                            onClick={() => applySegment('warm')}
                        >
                            Ciepłe kontakty
                        </button>
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Tagi</label>
                    <div className={styles.tags}>
                        {tags.data?.map((tag) => {
                            const isSelected = selectedTagIds.has(tag.id);
                            const colors = tagColor(tag.name);
                            return (
                                <button
                                    key={tag.id}
                                    className={`${styles.tagButton} ${isSelected ? styles.tagSelected : styles.tagUnselected
                                        }`}
                                    onClick={() => toggleTag(tag.id)}
                                    style={
                                        isSelected
                                            ? {
                                                backgroundColor: colors.bgColor,
                                                color: colors.textColor,
                                                border: `2px solid ${colors.textColor}`,
                                            }
                                            : {
                                                backgroundColor: '#F3F4F6',
                                                color: '#6B7280',
                                                border: '1px solid #E5E7EB',
                                            }
                                    }
                                >
                                    {colors.label ?? tag.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
