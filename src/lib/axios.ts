// import axios from "axios";
// import { siteConfig } from "@/config/site";

// // const NEXT_BASE_URL =
// //   process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// const axiosInstance = axios.create({
//   //baseURL: NEXT_BASE_URL + "/api/mangadex", // uncomment this line and above if you want to use built-in proxy
//   baseURL: siteConfig.suicaodex.apiURL,
// });

// export default axiosInstance;

// axios.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { setCurrentApiUrl } from "./utils";

// Danh sách proxy
const proxyList = [
  "https://proxy.42015881.workers.dev",
  "https://api.suicaodex.com",
  "https://proxy.bltx.workers.dev",
  // "https://api2.suicaodex.com",
  "https://clf.suicaodex.com",
];

// Cache proxy thành công gần nhất
let lastSuccessfulProxyIndex = 0;
let lastProxySuccessTime = Date.now();
const PROXY_CACHE_DURATION = 60 * 1000; // Cache trong 1 phút

// Tạo axios instance theo baseURL
const createAxiosInstance = (baseURL: string): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Hàm fallback proxy
export const axiosWithProxyFallback = async <T = any>(
  config: AxiosRequestConfig
): Promise<T> => {
  let lastError;

  // Kiểm tra xem có proxy đã thành công gần nhất
  const now = Date.now();
  let startIndex = 0;
  if (now - lastProxySuccessTime < PROXY_CACHE_DURATION) {
    startIndex = lastSuccessfulProxyIndex;
  }

  for (let i = 0; i < proxyList.length; i++) {
    const index = (startIndex + i) % proxyList.length;
    const proxy = proxyList[index];
    const instance = createAxiosInstance(proxy);
    try {
      const response = await instance.request<T>(config);
      // Cập nhật proxy thành công
      lastSuccessfulProxyIndex = index;
      lastProxySuccessTime = Date.now();
      console.info(`[Proxy Success] Using proxy: ${proxy} | Status: ${response.status}`);
      
      const responseData = response.data as any;
      responseData.__proxy_url = proxy;
 
      setCurrentApiUrl(proxy);
      
      return responseData;
    } catch (error: any) {
      const status = error.response?.status || "No Response";
      lastError = error;
      console.warn(`[Proxy Failed] Proxy: ${proxy} failed with status: ${status}, trying next...`);
    }
  }
  console.error("[Proxy Error] All proxies failed");
  throw lastError;
};

// (luôn dùng pr1)
export const axiosInstance = createAxiosInstance(proxyList[0]);

// const data = await axiosWithProxyFallback({ url: "/author?name=abc", method: "get" });
// axiosInstance.get() nếu muốn luôn dùng PR1

