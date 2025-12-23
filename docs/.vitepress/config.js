import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "SweepstacX",
  description: "Comprehensive Code Quality and Dead Code Detection CLI Tool",
  base: '/SweepstacX/', // Base path for GitHub Pages deployment
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Commands', link: '/commands/' },
      { text: 'Configuration', link: '/configuration' },
      { text: 'GitHub', link: 'https://github.com/1devteam/SweepstacX' }
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Installation', link: '/installation' },
          { text: 'Configuration', link: '/configuration' },
        ]
      },
      {
        text: 'Commands (v0.7.0)',
        items: [
          { text: 'Overview', link: '/commands/' },
          { text: 'scan', link: '/commands/scan' },
          { text: 'report', link: '/commands/report' },
          { text: 'patch', link: '/commands/patch' },
          { text: 'check', link: '/commands/check' },
          { text: 'insights', link: '/commands/insights' },
          { text: 'init', link: '/commands/init' },
          { text: 'watch', link: '/commands/watch' },
          { text: 'html', link: '/commands/html' },
          { text: 'export', link: '/commands/export' },
          { text: 'diff', link: '/commands/diff' },
          { text: 'security', link: '/commands/security' },
          { text: 'complexity', link: '/commands/complexity' },
          { text: 'benchmark', link: '/commands/benchmark' },
          { text: 'trends', link: '/commands/trends' },
          { text: 'plugins', link: '/commands/plugins' },
          { text: 'fix', link: '/commands/fix' },
          { text: 'ci-template', link: '/commands/ci-template' },
        ]
      },
      {
        text: 'Analyzers',
        items: [
          { text: 'Dead Code', link: '/analyzers/dead-code' },
          { text: 'Stale Dependencies', link: '/analyzers/stale-deps' },
          { text: 'Frameworks', link: '/analyzers/frameworks' },
          { text: 'Security', link: '/analyzers/security' },
          { text: 'Complexity', link: '/analyzers/complexity' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/1devteam/SweepstacX' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present 1devteam'
    }
  }
})
