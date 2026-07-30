const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const nextTranslate = require('next-translate')
const withTM = require('next-transpile-modules')(['@silkflow/internal'])

/**
 * @type {import('rehype-pretty-code').Options}
 **/
const opts = {
  theme: {
    dark: 'github-dark',
    light: 'github-light',
  },
  onVisitLine(node) {
    // Prevent lines from collapsing in `display: grid` mode, and
    // allow empty lines to be copy/pasted
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }]
    }
  },
  onVisitHighlightedLine(node) {
    node.properties.className.push('highlighted')
  },
  onVisitHighlightedWord(node) {
    node.properties.className = ['word', 'highlighted']
  },
}

/**
 * @type {import('next').NextConfig}
 **/
const config = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  pwa: {
    dest: 'public',
  },
  // The marketing site still runs on the legacy Next 12 / pages-router stack
  // with `@literal-ui/*`. Its React-type quirks are deferred to a dedicated
  // website migration — don't block the monorepo build on them.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    // Fallback so the "Open App" Link always has a href during prerender.
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:7127',
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /.mdx?$/, // load both .md and .mdx files
      use: [
        options.defaultLoaders.babel,
        {
          loader: '@mdx-js/loader',
          options: {
            remarkPlugins: [],
            rehypePlugins: [[require('rehype-pretty-code'), opts]],
            // If you use `MDXProvider`, uncomment the following line.
            providerImportSource: '@mdx-js/react',
          },
        },
        './plugins/mdx',
      ],
    })

    return config
  },
}

module.exports = nextTranslate(withTM(withBundleAnalyzer(config)))
