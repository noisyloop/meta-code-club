import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
// Order matters: reset -> Astryx components -> theme tokens (see `astryx docs styling-overview`).
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './astryx-themes';
import './index.css';
import {App} from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
