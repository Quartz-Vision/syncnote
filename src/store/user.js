import axios from 'axios';

import { UserStorage } from './storage';
import { BASE_URL } from '@/api.settings.js';
import localization from '@/localization';
import { handleError } from './utils';

export const AUTH_URL = `${BASE_URL}/user/auth/`;
export const REGISTER_URL = `${BASE_URL}/user/register/`;
export const PROFILE_URL = `${BASE_URL}/user/profile/`;

export const RESET_PASSWORD = `${BASE_URL}/user/reset-password/`;


function set_axios_auth(token=null) {
    if (token)
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
    else
        delete axios.defaults.headers.common['Authorization'];
}


function setQuartzTheme(theme="auto") {
    const classList = document.querySelector("html").classList;
    classList.remove("theme-auto", "theme-dark", "theme-light");
    classList.add("quartz-vars", "theme-"+theme);
}


export default {
    namespaced: true,
    state: () => ({
        isAuthenticated: false,
        token: "",
        status: null,
        theme: null,
        lang: null,
        maxDataSize: -1,
        usedDataSize: 0,
        email: "",
        username: "",
    }),
    mutations: {
        logout(state) {
            state.status = null;
            state.isAuthenticated = false;
            state.token = "";
            state.email = "";
            state.username = "";
        },
        setAuth(state, {token, isAuthenticated}) {
            state.token = token;
            state.isAuthenticated = isAuthenticated;
        },

        setTheme(state, theme="auto") {
            setQuartzTheme(theme || "auto");
            state.theme = theme;
        },
        setLang(state, lang) {
            state.lang = lang;
        },
        setEmail(state, email) {
            state.email = email;
        },
        setUsername(state, username) {
            state.username = username;
        },
        setMaxDataSize(state, size=-1) {
            state.maxDataSize = size;
        },
        setUsedDataSize(state, size=0) {
            state.usedDataSize = size;
        }
    },
    actions: {
        async init({ state, dispatch }) {
            await dispatch('loadStorage');

            if (state.isAuthenticated) {
                set_axios_auth(state.token);
                await dispatch('getProfile');
            }
        },

        async startAuth({ dispatch, commit }, data) {
            try {
                const res = await axios.post(AUTH_URL, data);
                const token = res.data.access;
                set_axios_auth(token);
                
                commit('setAuth', {
                    token: token,
                    isAuthenticated: true
                });
                await dispatch('updateStorage');
                await dispatch('getProfile');
                
                return res;
            }
            catch(e) {
                set_axios_auth();
                await handleError(dispatch, e, 2000);
            }
        },
        async startRegister({ dispatch, commit }, data) {
            try {
                const res = await axios.post(REGISTER_URL, data);
                const token = res.data.access;
                set_axios_auth(token);

                commit('setAuth', {
                    token: token,
                    isAuthenticated: true
                });
                await dispatch('updateStorage');
                await dispatch('getProfile');
                
                return res;
            }
            catch(e) {
                set_axios_auth();
                await handleError(dispatch, e, 2000);
            }
        },
        async logout({ commit, dispatch }) {
            set_axios_auth();
            commit('logout');
            await dispatch('updateStorage');
        },
        async resetPasswordInit(_, data) {
            try {
                await axios.post(RESET_PASSWORD, data);
            }
            catch(e) {
                // todo
            }
        },
        async getProfile({ commit, dispatch }) {
            try {
                const res = await axios.get(PROFILE_URL);
                const data = res.data;

                // commit('setTheme', await userStorage.get('theme'));
                data.lang && await dispatch('setLangLocal', data.lang);
                await dispatch('setMaxDataSizeLocal', data.max_data_size);

                commit('setUsedDataSize', data.used_data_size);
                commit('setEmail', data.email ?? null);
                commit('setUsername', data.username);

                await dispatch('updateStorage');
                
                return res;
            }
            catch(e) {
                await handleError(dispatch, e, 2000, true);
            }
        },
        async updateUserData({ dispatch }, data) {
            data = {...data};
            
            if (data.newPassword)
                data.new_password = data.newPassword,
                data.old_password = data.oldPassword;
            try {
                await axios.patch(PROFILE_URL, data);
                await dispatch('getProfile');
            }
            catch(e) {
                await handleError(dispatch, e, 2000);
            }
        },
        async deleteAccount({ dispatch }) {
            try {
                await axios.delete(PROFILE_URL);
                await dispatch('logout');
            }
            catch(e) {
                await handleError(dispatch, e, 4000);
            }
        },

        async updateStorage({state}) {
            const userStorage = await UserStorage;
            await Promise.all([
                userStorage.set('token', state.token),
                userStorage.set('isAuthenticated', state.isAuthenticated),
                userStorage.set('theme', state.theme),
                userStorage.set('lang', state.lang),
                userStorage.set('maxDataSize', state.maxDataSize),
                userStorage.set('usedDataSize', state.usedDataSize),
                userStorage.set('email', state.email),
                userStorage.set('username', state.username),
            ]);
        },

        async loadStorage({ state, dispatch, commit }) {
            const userStorage = await UserStorage;

            commit('setAuth', {
                token: await userStorage.get('token'),
                isAuthenticated: await userStorage.get('isAuthenticated')
            });

            commit('setTheme', await userStorage.get('theme'));
            
            await dispatch('setLangLocal', await userStorage.get('lang'));
            await dispatch('setMaxDataSizeLocal', await userStorage.get('maxDataSize') ?? -1);

            commit('setUsedDataSize', await userStorage.get('usedDataSize'));
            commit('setEmail', await userStorage.get('email'));
            commit('setUsername', await userStorage.get('username'));
        },

        async setTheme({ commit, dispatch }, theme) {
            commit('setTheme', theme);
            await dispatch('updateStorage');
        },

        async setLangLocal({ commit, dispatch }, lang) {
            commit('setLang', lang);
            localization.state.setLang(lang);
            await dispatch('updateStorage');
        },

        async setLang({ state, dispatch }, lang) {
            await dispatch('setLangLocal', lang);
            
            if (!state.isAuthenticated)
                return;

            try {
                await axios.patch(PROFILE_URL, {lang});
            }
            catch(e) {
                await handleError(dispatch, e, 2000, true);
            }
        },

        async setMaxDataSizeLocal({ commit, dispatch }, size=-1) {
            commit('setMaxDataSize', size);
            await commit('note/dataSizeLimitUpdate', size, {root: true});
            await dispatch('updateStorage');
        }
    },
    modules: {
    }
};
