import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { setLicenseKey, settings } from 'survey-core';
import App from './App';
import { formRepository } from './repositories/formRepository';
import { session } from './repositories/session';
import './theme/campusTheme';
import './theme/demoTools';
import './styles.css';

const licenseKey = import.meta.env.SURVEYJS_KEY?.trim();
if (licenseKey) setLicenseKey(licenseKey);

settings.web.cacheLoadedChoices = false;
settings.web.onBeforeRequestChoices = (_sender, options) => {
  const token = session.getToken();
  if (!token) return;
  options.request?.setRequestHeader('Authorization', `Bearer ${token}`);
  if (options.fetchOptions) {
    const headers = new Headers(options.fetchOptions.headers);
    headers.set('Authorization', `Bearer ${token}`);
    options.fetchOptions.headers = headers;
  }
};

const root = createRoot(document.getElementById('root')!);

formRepository.init().finally(() => {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
