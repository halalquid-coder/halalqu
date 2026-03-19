export function getRestaurantSlug(name, id) {
    if (!name) return id;
    const cleanName = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return cleanName ? `${cleanName}-${id}` : id;
}

export function extractRestaurantId(slugOrId) {
    if (!slugOrId) return '';
    if (!slugOrId.includes('-')) return slugOrId;
    const parts = slugOrId.split('-');
    return parts[parts.length - 1]; // The Firebase ID is always at the end
}
