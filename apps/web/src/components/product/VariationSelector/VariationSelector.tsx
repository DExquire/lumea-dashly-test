'use client';

import { useState } from 'react';
import type { VariationGroup } from '@/types/content';
import styles from './VariationSelector.module.scss';

interface VariationSelectorProps {
  group: VariationGroup;
  /** Scopes the radio group to one product card. */
  productId: string;
}

/**
 * One CMS-defined variation group ("Skin type", "Size", "Choose formula"...).
 *
 * Built on real radio inputs: the browser then provides the group semantics and
 * arrow-key navigation for free, while the visible chip is a `<label>` — no
 * click handlers on non-interactive elements.
 */
export function VariationSelector({ group, productId }: VariationSelectorProps) {
  const [selectedId, setSelectedId] = useState(group.options[0]?.id);
  const groupName = `variation-${productId}-${group.id}`;

  return (
    <fieldset className={styles.root}>
      <legend className={styles.legend}>{group.name}</legend>

      <div className={styles.options}>
        {group.options.map((option) => (
          <label key={option.id} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name={groupName}
              value={option.id}
              checked={selectedId === option.id}
              onChange={() => setSelectedId(option.id)}
            />
            <span className={styles.chip}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
