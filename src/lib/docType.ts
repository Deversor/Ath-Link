/** Turns "Liability Waiver Form" into "liability_waiver_form" - a stable key safe for storage paths and DB rows. */
export function slugifyDocType(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
