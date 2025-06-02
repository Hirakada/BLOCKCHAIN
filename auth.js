import { loadLoginPopup } from './profile/login.js';
import { loadLoader  } from './assets/component/loader.js';

(async () => {
  await loadLoader();
  await loadLoginPopup("login-btn");
})();