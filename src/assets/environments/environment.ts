export const environment = {
  production: false,
  port: 4200,
  api: {
    baseUrl: 'http://localhost:18080',
    version: 'v1',
    timeout: 30
  },
  i18n: {
    apiUrl: '/api/i18n', 
    localFile: '/assets/i18n/messages.json',
    defaultLanguage: 'pt'
  }
};