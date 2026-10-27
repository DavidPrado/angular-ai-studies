export const environment = {
  production: true,
  port: 4200,
  api: {
    baseUrl: 'https://api.movimenttech.com',
    version: 'v1',
    timeout: 15
  },
   i18n: {
    apiUrl: '/api/i18n', 
    localFile: '/assets/i18n/messages.json',
    defaultLanguage: 'pt'
  }
};