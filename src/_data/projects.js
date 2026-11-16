import { loadProjects } from '../lib/projects.js';

export default async function projects() {
  const data = await loadProjects();
  const updated = data.items
    .map((project) => project.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);
  const categories = [...new Set(data.items.map((project) => project.category))].sort((a, b) =>
    a.localeCompare(b, 'ru')
  );

  return {
    ...data,
    count: data.items.length,
    countLabel: String(data.items.length).padStart(2, '0'),
    featured: data.items.filter((project) => project.featured),
    lastUpdated: updated || null,
    categories,
    categoriesDetailed: categories.map((name) => ({
      name,
      count: data.items.filter((project) => project.category === name).length,
    })),
  };
}
