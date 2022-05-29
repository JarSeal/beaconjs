import './styles/index.scss';
import Base from './js/Base';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

document.addEventListener('DOMContentLoaded', () => {
  const fpPromise = FingerprintJS.load();

  (async () => {
    const fp = await fpPromise;
    const result = await fp.get();
    const browserId = result.visitorId;
    const app = new Base({ id: 'base-id', parentId: 'root', browserId });
    app.draw();
  })();
});
