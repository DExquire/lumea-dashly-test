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
    description: 'One selectable value inside a variation group, e.g. "30 ml" or "Hyaluronic Acid 2%". `discountLabel` is the optional tilted badge the design pins to the top edge of the chip ("-10 %").';
    displayName: 'Variation value';
    icon: 'bulletList';
  };
  attributes: {
    discountLabel: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 12;
      }>;
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
