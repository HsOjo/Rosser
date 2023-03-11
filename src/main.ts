import {createApp} from 'vue'
import App from '@/App.vue'

import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

import 'animate.css'
import '@/style.css'

import store from "@/plugins/store";

let app = createApp(App)
app.use(store)
app.use(Antd)
app.mount('#app')
