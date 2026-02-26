// ============================================================================
// Resolver Configuration
// Species keywords and generic defaults — extracted from resolver.ts so they
// can be swapped per genus without editing resolver logic.
// ============================================================================

export interface ResolverConfig {
  /**
   * Maps lowercase keyword tokens to ordered candidate names to look up in the
   * alias index. The first match wins.
   * Example: 'american' → ['american hazelnut', 'corylus americana']
   */
  speciesKeywords: Record<string, string[]>;

  /**
   * Ordered list of alias index keys to try when the parsed core name is empty
   * or a generic seedling term (e.g., 'seedling', 'seeds', 'sdlg').
   * First key found in the alias index becomes the generic_default match.
   */
  genericDefaultCandidates: string[];
}

export const DEFAULT_RESOLVER_CONFIG: ResolverConfig = {
  speciesKeywords: {
    american: ['american hazelnut', 'corylus americana'],
    beaked: ['beaked hazelnut', 'corylus cornuta'],
    chilean: ['chilean hazelnut', 'gevuina avellana'],
    european: ['european hazelnut', 'corylus avellana'],
    turkish: ['turkish tree hazel', 'corylus colurna'],
  },
  genericDefaultCandidates: ['european hazelnut', 'corylus avellana'],
};
