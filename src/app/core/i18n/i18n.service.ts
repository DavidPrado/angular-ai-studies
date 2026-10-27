import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../assets/environments/environment';

export type Language = 'pt' | 'en' | 'es' | 'zh' | 'hi' | 'ar';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.api.baseUrl;
  private readonly i18nConfig = environment.i18n;

  private translations = new Map<string, string>();
  private translationsSubject = new BehaviorSubject<Map<string, string>>(
    new Map(),
  );
  private currentLanguageSubject = new BehaviorSubject<Language>('pt');

  translations$ = this.translationsSubject.asObservable();
  currentLanguage$ = this.currentLanguageSubject.asObservable();

  readonly availableLanguages: LanguageOption[] = [
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

constructor() {
    const savedLanguage = localStorage.getItem('preferredLanguage') as Language;
    const defaultLang = (this.i18nConfig.defaultLanguage as Language) || 'pt';
    this.setLanguage(savedLanguage || defaultLang);
  }

setLanguage(language: Language): void {
    localStorage.setItem('preferredLanguage', language);
    
    this.http
      .get<Record<string, any>>('assets/i18n/messages.json')
      .pipe(
        map((allTranslations) => {
          const languageTranslations: Record<string, string> = {};
          Object.entries(allTranslations).forEach(([key, translations]) => {
            languageTranslations[key] =
              translations[language] || translations['pt'];
          });
          return languageTranslations;
        })
      )
      .subscribe({
        next: (data) => {
          this.translations.clear();
          Object.entries(data).forEach(([key, value]) => {
            this.translations.set(key, value);
          });
          this.translationsSubject.next(new Map(this.translations));
          this.currentLanguageSubject.next(language);
        }
      });
  }

  translate(key: string, params?: Record<string, string>): string {
    let translation = this.translations.get(key) || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, paramValue);
      });
    }

    return translation;
  }

  t(key: string, params?: Record<string, string>): string {
    return this.translate(key, params);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }
}
