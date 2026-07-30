const path = require('path')

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const IS_DOCKER = process.env.DOCKER

/** @type {import('next').NextConfig} **/
const config = {
  reactStrictMode: true,
  transpilePackages: [
    '@silkflow/internal',
    '@silkflow/epubjs',
    '@material/material-color-utilities',
  ],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  ...(IS_DOCKER && {
    output: 'standalone',
    experimental: {
      outputFileTracingRoot: path.join(__dirname, '../../'),
    },
  }),
  webpack(config) {
    return config
  },
}

module.exports = withBundleAnalyzer(config)
