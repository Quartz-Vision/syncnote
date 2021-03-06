import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';


/* Theme variables */
import './styles/variables.scss';

/* Quartz theming tools */
import './styles/quartz.scss';

import './styles/quartz-tiptap.scss';

/* Quartz libs */
import quartzIonicEvents from '@quartz-vision/ionic-events';

import store from './store/index.js';
import localization from './localization';

import init from './init';

const app = createApp(App)
  .use(store)
  .use(localization)
  .use(IonicVue)
  .use(router)
  .use(quartzIonicEvents);

init();

router.isReady().then(() => {
  app.mount('#app');
});
