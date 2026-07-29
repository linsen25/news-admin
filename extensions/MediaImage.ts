import { mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';

export const MediaImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-caption'),
        renderHTML: (attributes) =>
          attributes.caption
            ? { 'data-caption': attributes.caption as string }
            : {},
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { caption, ...imageAttributes } = HTMLAttributes;
    return [
      'figure',
      { class: 'media-image' },
      ['img', mergeAttributes(this.options.HTMLAttributes, imageAttributes)],
      ...(caption ? [['figcaption', {}, String(caption)]] : []),
    ] as never;
  },
});
