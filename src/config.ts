export const API_URL = process.env.EXPO_PUBLIC_API_URL!;
export const WS_URL = API_URL.replace(/^http/, "ws");