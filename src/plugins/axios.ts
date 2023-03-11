import axios from "axios";
import store from "@/plugins/store";

export default () => axios.create({
  baseURL: store.getters.backendURL,
  timeout: 30 * 1000, // Timeout
  withCredentials: false, // Check cross-site Access-Control
});
