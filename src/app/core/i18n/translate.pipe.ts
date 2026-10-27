import { Pipe, PipeTransform, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { I18nService } from './i18n.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private i18nService = inject(I18nService);
  private cdRef = inject(ChangeDetectorRef);
  private subscription: Subscription;
  private currentValue: string = '';

  constructor() {
    this.subscription = this.i18nService.translations$
      .subscribe(() => {
        this.cdRef.markForCheck();
      });
  }

  transform(key: string, params?: Record<string, string>): string {
    this.currentValue = this.i18nService.translate(key, params);
    return this.currentValue;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}