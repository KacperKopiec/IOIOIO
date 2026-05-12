import React from 'react';
import type { CompanyFilters } from '../../hooks/api/companies';
import { useIndustries, useTags } from '../../hooks/api/reference';
import { FIRM_TAGS } from '../../constants/firmTags';
import type { CompanySize } from '../../types/api';
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

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onChange }) => {
    const industries = useIndustries();
    const tags = useTags();

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
