import { formatDateRu, formatDuration, formatLongDuration, formatNumber } from './src/lib/format.js';

export default function eleventyConfig(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ public: '/' });

  eleventyConfig.addFilter('dateRu', formatDateRu);
  eleventyConfig.addFilter('duration', formatDuration);
  eleventyConfig.addFilter('longDuration', formatLongDuration);
  eleventyConfig.addFilter('number', formatNumber);

  eleventyConfig.addFilter('absoluteUrl', (value, base) => {
    try {
      return new URL(value, base).href;
    } catch {
      return value;
    }
  });

  eleventyConfig.addFilter('jsonld', (value) =>
    JSON.stringify(value)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
  );

  eleventyConfig.addFilter('limit', (value, amount) =>
    Array.isArray(value) ? value.slice(0, amount) : []
  );

  eleventyConfig.addFilter('unique', (value) => [...new Set(Array.isArray(value) ? value : [])]);

  eleventyConfig.addWatchTarget('src/assets/');
  eleventyConfig.addWatchTarget('public/audio/');

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      layouts: '_layouts',
      data: '_data',
    },
    templateFormats: ['njk', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
  };
}
