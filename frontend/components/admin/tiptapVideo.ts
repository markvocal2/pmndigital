import { Node, mergeAttributes } from '@tiptap/react';

/**
 * Block-level <video> node for the article editor.
 *
 * TipTap ships no video extension, so an uploaded clip used to be routed through the
 * Image node and came out as <img src="clip.mp4"> — a broken image, not a player.
 * controls/preload/playsinline are forced at render time rather than stored as
 * attributes, so nothing an author pastes can turn a body video into an autoplaying one.
 */
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'video[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        controls: 'controls',
        preload: 'metadata',
        playsinline: 'playsinline',
      }),
    ];
  },
});