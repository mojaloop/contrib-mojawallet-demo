module.exports = {
  header: '# Changelog: [mojaloop/mojawallet](https://github.com/mojaloop/mojawallet)',
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'chore', section: 'Maintenance' },
    { type: 'ci', section: 'CI/CD' },
    { type: 'doc', section: 'Documentation' },
    { type: 'lint', section: 'Linting' },
    { type: 'style', section: 'Style Improvements' },
    { type: 'refactor', section: 'Code Refactor' },
    { type: 'perf', section: 'Performance' },
    { type: 'test', section: 'Tests' }
  ],
  bumpFiles: [
    {
      filename: 'packages/frontend/package.json',
      // The `json` updater assumes the version is available under a `version` key in the provided JSON document.
      type: 'json'
    },
    {
      filename: 'packages/backend/package.json',
      type: 'json'
    },
    {
      filename: 'package.json',
      type: 'json'
    }
  ]
}