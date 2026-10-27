import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './assets/environments/environment'; 

if (!environment.production) {
  console.log('🌍 Ambiente:', environment);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));