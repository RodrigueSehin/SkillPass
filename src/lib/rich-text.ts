/**
 * Descriptions are stored as light markdown (the form's toolbar inserts the markers).
 * This strips them for single-paragraph previews such as cards.
 */
export function stripFormatting(text: string) {
  return text
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(.+?)\1/g, "$2")
    .replace(/\s*\n+\s*/g, " ")
    .trim();
}
