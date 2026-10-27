export interface Environment {
  production: boolean;
  port: number;
  api: {
    baseUrl: string;
    version: string;
    timeout: number;
  };
  auth: {
    loginUrl: string;
    registerUrl: string;
    refreshTokenUrl: string;
    logoutUrl: string;
  };
  i18n: {
    apiUrl: string;
    localFile: string;
    defaultLanguage: string;
  };
  features: {
    enableMocks: boolean;
    enableLogs: boolean;
    enableAnalytics: boolean;
  };
}