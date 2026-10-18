import { useId } from 'react';

/**
 * A document-unique id for SVG defs (gradients, filters). SVG ids are global on web,
 * so two mounted screens with the same `id="fade"` would paint each other's gradients.
 */
export function useSvgId(name: string): string {
  return `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
