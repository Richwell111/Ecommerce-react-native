import axios from "axios";
import { Platform } from "react-native";

const PRODUCTION_API_URL = "https://ecom-react-native-server.vercel.app/api";

const LOCAL_API_URL = Platform.select({
    android: "http://192.168.0.55:3000/api",
    ios: "http://192.168.0.55:3000/api",
    default: "http://localhost:3000/api",
});

const api = axios.create({ baseURL: PRODUCTION_API_URL || LOCAL_API_URL });

export default api;
