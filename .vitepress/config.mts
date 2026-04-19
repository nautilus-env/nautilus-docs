import { defineConfig } from 'vitepress'

const docsSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Install and First Run', link: '/guide/getting-started' },
      { text: 'How Nautilus Works', link: '/guide/how-nautilus-works' }
    ]
  },
  {
    text: 'Schema Language',
    items: [
      { text: 'Language Overview', link: '/schema/language' },
      { text: 'Datasource and Generator', link: '/schema/datasource-and-generator' },
      { text: 'Models, Relations, and Attributes', link: '/schema/models-relations-and-attributes' },
    ]
  },
  {
    text: 'Database Workflows',
    items: [
      { text: 'DB Commands', link: '/workflows/database-workflows' },
      { text: 'Migrations', link: '/workflows/migrations' }
    ]
  },
  {
    text: 'Generated Clients',
    items: [
      { text: 'Overview', link: '/clients/' }
    ]
  },
  {
    text: 'CLI Reference',
    items: [
      { text: 'Command Summary', link: '/reference/cli/' },
      { text: 'Core Commands', link: '/reference/cli/core-commands' },
      { text: 'Database Commands', link: '/reference/cli/database-commands' },
      { text: 'Migration Commands', link: '/reference/cli/migration-commands' },
      { text: 'Runtime and Tooling Commands', link: '/reference/cli/runtime-and-tools' }
    ]
  },
  {
    text: 'Database Providers',
    items: [
      { text: 'Provider Matrix', link: '/providers/provider-matrix' },
      { text: 'PostgreSQL', link: '/providers/postgresql' },
      { text: 'MySQL', link: '/providers/mysql' },
      { text: 'SQLite', link: '/providers/sqlite' }
    ]
  },
  {
    text: 'Editor and Studio',
    items: [
      { text: 'Editor and LSP', link: '/tools/editor-and-lsp' },
      { text: 'Studio', link: '/tools/studio' }
    ]
  }
] as const

export default defineConfig({
  title: 'Nautilus Docs',
  description: 'End-user documentation for the Nautilus schema-first ORM toolkit.',
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ['_upstream_nautilus/**'],
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Schema', link: '/schema/language' },
      { text: 'Workflows', link: '/workflows/database-workflows' },
      { text: 'Clients', link: '/clients/' },
      { text: 'CLI Reference', link: '/reference/cli/' },
      { text: 'Providers', link: '/providers/provider-matrix' },
      { text: 'Tools', link: '/tools/editor-and-lsp' }
    ],
    sidebar: docsSidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/y0gm4/nautilus' }
    ],
    footer: {
      message: 'Based on the upstream Nautilus project by y0gm4.',
      copyright: 'Documentation target: Nautilus ORM'
    }
  }
})
