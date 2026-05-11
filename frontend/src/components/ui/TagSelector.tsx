import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useCreateTag, useTags } from '../../hooks/api/reference';
import { toApiError } from '../../lib/api';
import type { Tag, TagCategory } from '../../types/api';
import styles from './TagSelector.module.css';

interface TagSelectorProps {
    value: number[];
    onChange: (next: number[]) => void;
    label?: string;
}

const CATEGORY_OPTIONS: { value: TagCategory; label: string }[] = [
    { value: 'technology', label: 'Technologia' },
    { value: 'interest', label: 'Zainteresowanie' },
    { value: 'relationship', label: 'Relacja' },
    { value: 'collaboration', label: 'Współpraca' },
];

const TagSelector: React.FC<TagSelectorProps> = ({ value, onChange }) => {
    const tags = useTags();
    const create = useCreateTag();

    const [search, setSearch] = useState('');
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<TagCategory>('interest');
    const [error, setError] = useState<string | null>(null);

    const allTags: Tag[] = tags.data ?? [];
    const byId = useMemo(() => {
        const map = new Map<number, Tag>();
        for (const t of allTags) map.set(t.id, t);
        return map;
    }, [allTags]);

    const selected = value.map((id) => byId.get(id)).filter((t): t is Tag => !!t);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return allTags;
        return allTags.filter((t) => t.name.toLowerCase().includes(q));
    }, [allTags, search]);

    const selectedSet = new Set(value);

    function toggle(id: number) {
        if (selectedSet.has(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    }

    function remove(id: number) {
        onChange(value.filter((v) => v !== id));
    }

    function handleCreate() {
        const name = newName.trim();
        if (!name) {
            setError('Nazwa tagu nie może być pusta.');
            return;
        }
        const existing = allTags.find(
            (t) => t.name.toLowerCase() === name.toLowerCase(),
        );
        if (existing) {
            if (!selectedSet.has(existing.id)) {
                onChange([...value, existing.id]);
            }
            setNewName('');
            setError(null);
            return;
        }
        setError(null);
        create.mutate(
            { name, category: newCategory },
            {
                onSuccess: (tag) => {
                    onChange([...value, tag.id]);
                    setNewName('');
                },
                onError: (err) => setError(toApiError(err).detail),
            },
        );
    }

    return (
        <div className={styles.wrap}>
            <div
                className={`${styles.selectedRow} ${selected.length === 0 ? styles.empty : ''
                    }`}
            >
                {selected.length === 0 ? (
                    <span>Brak wybranych tagów</span>
                ) : (
                    selected.map((tag) => (
                        <span key={tag.id} className={styles.pill}>
                            {tag.name}
                            <button
                                type="button"
                                className={styles.pillRemove}
                                onClick={() => remove(tag.id)}
                                aria-label={`Usuń tag ${tag.name}`}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                )}
            </div>

            <div className={styles.searchRow}>
                <input
                    type="search"
                    className={styles.searchInput}
                    placeholder="Filtruj tagi…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className={styles.list}>
                {tags.isLoading && (
                    <span className={styles.empty}>Ładowanie tagów…</span>
                )}
                {!tags.isLoading && filtered.length === 0 && (
                    <span className={styles.empty}>
                        Brak tagów pasujących do wyszukiwania.
                    </span>
                )}
                {filtered.map((tag) => (
                    <button
                        key={tag.id}
                        type="button"
                        className={`${styles.option} ${selectedSet.has(tag.id) ? styles.optionSelected : ''
                            }`}
                        onClick={() => toggle(tag.id)}
                    >
                        {tag.name}
                    </button>
                ))}
            </div>

            <div className={styles.createBox}>
                <div className={styles.createTitle}>Utwórz nowy tag</div>
                <div className={styles.createRow}>
                    <input
                        type="text"
                        className={styles.createInput}
                        placeholder="Nazwa, np. cybersecurity"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreate();
                            }
                        }}
                    />
                    <select
                        className={styles.createSelect}
                        value={newCategory}
                        onChange={(e) =>
                            setNewCategory(e.target.value as TagCategory)
                        }
                    >
                        {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className={styles.createBtn}
                        onClick={handleCreate}
                        disabled={create.isPending || newName.trim().length === 0}
                    >
                        <Plus size={14} style={{ verticalAlign: 'middle' }} />{' '}
                        {create.isPending ? 'Tworzenie…' : 'Utwórz'}
                    </button>
                </div>
                {error && <div className={styles.errorRow}>{error}</div>}
            </div>
        </div>
    );
};

export default TagSelector;
