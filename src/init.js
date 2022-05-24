import localization from './localization';
import axios from 'axios';
import store from './store';
import router from './router';

export default async function init() {
    axios.interceptors.response.use(undefined, async err => {
        // logout the user when they gets at least one 401
        if (err.response?.status === 401 && err.config && !err.config.__isRetryRequest && store.state?.user?.isAuthenticated) {
            store.dispatch('placeNotification', {
                text: localization.state.tr`Auth error`,
                type: "danger"
            })
            router.push('/');
            await store.dispatch('note/applyIdPairs');
            await store.dispatch('user/logout');
        }
        throw err;
    });

    // add requests localization
    axios.interceptors.request.use(config => {
        config.url = config.url.replace(/{{lang}}/gmi, localization.state.tr`__lang_code__`);
        return config;
    });

    // init the stuff
    await store.dispatch('note/sync');
    await store.dispatch('user/init');
    
    localization.state.setLang(store.state.user.lang);

    await store.dispatch('note/sync', store.state.user.isAuthenticated);
}
