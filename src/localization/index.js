import { reactive } from 'vue';
import dictionaries from './dictionaries.js';

const state = reactive({
    base: "en",
    country: "us",

    dictionary: {},

    setLang(langCode) {
        langCode = (langCode ?? navigator.language).toLowerCase().split('-');
        this.base = langCode[0] ?? '*';
        this.country = langCode[1] ?? '*';
        const baseGroup = dictionaries[this.base];
        this.dictionary = baseGroup
            ? baseGroup[this.country] ?? baseGroup['*']
            : dictionaries['*'];
    },

    tr(key) {
        key = Array.isArray(key) ? key[0] : key;
        return this.dictionary[key] ?? key;
    },

    date(date) {
        const langCode = this.dictionary['__lang_code__'];
        if (langCode)
            return date.toLocaleDateString(langCode);
        return '';
    }
});

export default {
    state,
    
    install(app) {
        app.config.globalProperties.$lang = state;
        app.config.globalProperties.$langDictionaries = dictionaries;
    }
};

