export function slugify(value: string) {
  const source = value.trim().replace(/\.[^.]+$/, '');
  const ascii = source
    .normalize('NFKD')
    .replace(/[^\w\s.-]/g, '')
    .replace(/[\s.]+/g, '-')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return ascii || source.replace(/\s+/g, '-') || 'Custom';
}

export function id(prefix = 'id') {
  const random = crypto.getRandomValues(new Uint32Array(2));
  return `${prefix}-${Date.now().toString(36)}-${Array.from(random, (item) => item.toString(36)).join('')}`;
}
