import type { Schema, Struct } from '@strapi/strapi';

export interface ProductBadge extends Struct.ComponentSchema {
  collectionName: 'components_product_badges';
  info: {
    description: 'Badge on a product card, e.g. Sale / New / Bestseller.';
    displayName: 'Badge';
    icon: 'price-tag';
  };
  attributes: {
    label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 30;
      }>;
    tone: Schema.Attribute.Enumeration<['neutral', 'sale', 'new', 'bestseller']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'neutral'>;
  };
}

export interface ProductVariationGroup extends Struct.ComponentSchema {
  collectionName: 'components_product_variation_groups';
  info: {
    description: 'A named group of variations, e.g. "Skin type" with Dry / Normal / Sensitive. Both the name and the values are free-form, so every product can have its own variation types.';
    displayName: 'Variation group';
    icon: 'layer';
  };
  attributes: {
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
    values: Schema.Attribute.Component<'product.variation-value', true> & Schema.Attribute.Required;
  };
}

export interface ProductVariationValue extends Struct.ComponentSchema {
  collectionName: 'components_product_variation_values';
  info: {
    description: 'One selectable value inside a variation group, e.g. "30 ml" or "Hyaluronic Acid 2%". `discountPercent` is the discount this particular value carries and is what the price is recalculated from; it replaces the product\'s own discount rather than stacking on top of it, so the badge on the chip and the badge in the price row always show the same number. `discountLabel` is only the text drawn on the chip \u2014 leave it empty and it is derived from the percent, fill it in to write something the percent cannot say.';
    displayName: 'Variation value';
    icon: 'bulletList';
  };
  attributes: {
    discountLabel: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 12;
      }>;
    discountPercent: Schema.Attribute.Decimal &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      >;
    label: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 60;
      }>;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'product.badge': ProductBadge;
      'product.variation-group': ProductVariationGroup;
      'product.variation-value': ProductVariationValue;
    }
  }
}
