import React, { useState } from 'react';
import { FIRM_TAGS, type FirmTagId } from '../../constants/firmTags';
import styles from './FilterSidebar.module.css';

const FilterSidebar: React.FC = () => {
    const [selectedTags, setSelectedTags] = useState<Set<FirmTagId>>(new Set());

    const toggleTag = (tagId: FirmTagId) => {
        const newSelected = new Set(selectedTags);
        if (newSelected.has(tagId)) {
            newSelected.delete(tagId);
        } else {
            newSelected.add(tagId);
        }
        setSelectedTags(newSelected);
    };

    const handleReset = () => {
        setSelectedTags(new Set());
    };
    return (
        <div className={styles.card}>
            <div className={styles.headerRow}>
                <div className={styles.titleWrap}>
                    <div className={styles.icon} />
                    <div className={styles.heading}>Filtry</div>
                </div>
                <button className={styles.reset} onClick={handleReset}>Resetuj</button>
            </div>

            <div className={styles.content}>
                <div className={styles.section}>
                    <label className={styles.label}>Profil biznesowy</label>
                    <div className={styles.selectBox}>
                        <select className={styles.select}>
                            <option>Wszystkie branże</option>
                        </select>
                    </div>
                    <label className={styles.checkRow}>
                        <input type="checkbox" />
                        <span>Korporacja</span>
                    </label>
                    <label className={styles.checkRow}>
                        <input type="checkbox" />
                        <span>Startup</span>
                    </label>
                    <label className={styles.checkRow}>
                        <input type="checkbox" />
                        <span>MŚP</span>
                    </label>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <label className={styles.label}>Wielkość firmy</label>
                        <span className={styles.sectionValue}>1-500+</span>
                    </div>
                    <div className={styles.sliderTrack}>
                        <div className={styles.sliderFill} />
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Relacja z AGH</label>
                    <label className={styles.checkRow}>
                        <input type="checkbox" defaultChecked />
                        <span>Aktywna umowa</span>
                    </label>
                    <label className={styles.checkRow}>
                        <input type="checkbox" />
                        <span>Udział w wydarzeniach</span>
                    </label>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Tagi</label>
                    <div className={styles.tags}>
                        {Object.values(FIRM_TAGS).map((tag) => (
                            <button
                                key={tag.id}
                                className={`${styles.tagButton} ${selectedTags.has(tag.id as FirmTagId) ? styles.tagSelected : styles.tagUnselected
                                    }`}
                                onClick={() => toggleTag(tag.id as FirmTagId)}
                                style={
                                    selectedTags.has(tag.id as FirmTagId)
                                        ? {
                                            backgroundColor: tag.bgColor,
                                            color: tag.textColor,
                                            border: `2px solid ${tag.textColor}`
                                        }
                                        : {
                                            backgroundColor: '#F3F4F6',
                                            color: '#6B7280',
                                            border: '1px solid #E5E7EB'
                                        }
                                }
                            >
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Dane CRM</label>
                    <div className={styles.selectBox}>
                        <select className={styles.select}>
                            <option>Dowolny Koordynator</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterSidebar;
