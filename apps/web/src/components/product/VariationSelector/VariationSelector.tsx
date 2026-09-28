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

      {/*
        Two options go one per line and fill the card, three or more share a
        line and keep their own width — that is how the design lays out
        "Choose formula" against "Skin type" and "Size".
      */}
      <div className={styles.options} data-stacked={group.options.length < 3 ? '' : undefined}>
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
            <span className={styles.chip}>
              {option.label}
              {/*
                The badge is a real part of the label, not decoration: a screen
                reader should announce "50 ml -10 %". It is taken out of the
                chip's flow so it cannot shift the label off centre or make the
                chip taller — in the design it straddles the chip's top edge.
              */}
              {option.discount && <span className={styles.discount}>{option.discount}</span>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
