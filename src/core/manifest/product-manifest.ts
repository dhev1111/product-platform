/**
 * Declarative description of a product. This is the *product contract*: the
 * platform's canonical, serializable definition of what gets registered,
 * built, tested, released, deployed and monitored.
 *
 * See docs/product-contract.md for the full specification.
 */
export interface ProductManifest {
  /**
   * Required. Unique, URL-safe product name: lowercase letters and digits
   * separated by `.`, `_` or `-` (e.g. `my-product`).
   */
  readonly name: string;

  /**
   * Required. Semantic version (`MAJOR.MINOR.PATCH`), optionally with a
   * pre-release or build suffix (e.g. `1.4.2`, `2.0.0-rc.1`).
   */
  readonly version: string;

  /** Optional. Human-readable summary of the product. */
  readonly description?: string;

  /** Optional. Team or person accountable for the product. */
  readonly owner?: string;

  /** Optional. Source repository URL. */
  readonly repository?: string;

  /** Optional. Free-form labels. */
  readonly tags?: string[];
}
