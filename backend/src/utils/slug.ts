export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function appendRandomSuffix(slug: string, length = 6): string {
  const suffix = Math.random().toString(36).slice(2, 2 + length);
  return `${slug}-${suffix}`;
}
