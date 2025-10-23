import axios from "axios";
import type {
    LoginResponse,
    Vehicle,
    Driver,
    Comission,
    ComissionCreateRequest,
    ComissionCreateResponse,
    PassSalidaRequest,
    PassEntradaRequest,
    PassResponse,
    PlaceCreateRequest,
    PlaceCreateResponse,
    PassDetailsResponse
} from "./types/api";

const api = axios.create({
    baseURL: "http://localhost:8000/api", // backend Symfony
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para mandar el id del usuario en cada petición
api.interceptors.request.use((config) => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
        config.headers["X-USER-ID"] = userId;
    }
    return config;
});

// Auth API
export const authAPI = {
    login: async (code: string) => {
        const response = await api.post<LoginResponse>("/auth/login", { code });

        // Guarda el user_id para Monolog
        if (response.data?.user?.id) {
            localStorage.setItem("user_id", response.data.user.id.toString());
        }

        return response;
    }
};

// Vehicle API
export const vehiclesAPI = {
    list: () => api.get<Vehicle[]>("/vehicles"),
    create: (data: { brand: string; model: string; plate?: string; year?: number; color?: string; internal_number?: number }) =>
        api.post("/vehicles", data),
};

// Driver API
export const driversAPI = {
    list: () => api.get<Driver[]>("/drivers"),
    create: (data: { name: string; position: string; phone?: string; email?: string }) =>
        api.post("/drivers", data),
};

// Comission API
export const comissionsAPI = {
    list: () => api.get<Comission[]>("/comissions"),
    create: (data: ComissionCreateRequest) =>
        api.post<ComissionCreateResponse>("/comissions", data),
    delete: (folio: string) => api.delete(`/comissions/folio/${folio}`),
    updatePass: (folio: string, data: any) => api.put(`/comissions/folio/${folio}/pass`, data),
    send: (folio: string, email: string) => api.post(`/comissions/folio/${folio}/send`, { email }),
};

// Pass API
export const passAPI = {
    salida: (data: PassSalidaRequest) => api.post<PassResponse>("/pass/salida", data),
    entrada: (data: PassEntradaRequest) => api.post<PassResponse>("/pass/entrada", data),
    getDetails: (passId: number) => api.get<PassDetailsResponse>(`/pass/${passId}`),
};

// Inspection API
export const inspectionsAPI = {
    delete: (id: number) => api.delete(`/inspections/${id}`),
};

// Place API
export const placesAPI = {
    create: (data: PlaceCreateRequest) => api.post<PlaceCreateResponse>("/places", data),
};

export default api;
