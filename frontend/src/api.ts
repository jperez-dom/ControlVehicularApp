import axios from "axios";
import type {
    LoginResponse,
    Vehicle,
    Driver,
    Plate,
    Comission,
    ComissionCreateRequest,
    ComissionCreateResponse,
    PassResponse,
    PlaceCreateRequest,
    PlaceCreateResponse,
    PassDetailsResponse
} from "./types/api";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

// ------- INTERCEPTOR -------
// Manda el user_id automáticamente si existe en localStorage
api.interceptors.request.use((config) => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
        config.headers["X-USER-ID"] = userId;
    }
    return config;
});

// -------- AUTH API ----------
export const authAPI = {
    login: async (code: string) => {
        const response = await api.post<LoginResponse>("/auth/login", { code });
        if (response.data?.user?.id) {
            localStorage.setItem("user_id", response.data.user.id.toString());
        }
        return response;
    }
};

// -------- VEHICLES ----------
export const vehiclesAPI = {
    list: () => api.get<Vehicle[]>("/vehicles"),
    create: (data: { brand: string; model: string; plate: string; year?: number; color?: string; internal_number?: number }) =>
        api.post("/vehicles", data),
    delete: (id: number) => api.delete(`/vehicles/${id}`),
};

// -------- DRIVERS ----------
export const driversAPI = {
    list: () => api.get<Driver[]>("/drivers"),
    create: (data: { name: string; position: string; phone?: string; email?: string }) =>
        api.post("/drivers", data),
    delete: (id: number) => api.delete(`/drivers/${id}`),
};

// -------- COMISSIONS ----------
export const comissionsAPI = {
    list: () => api.get<Comission[]>("/comissions"),
    create: (data: ComissionCreateRequest) =>
        api.post<ComissionCreateResponse>("/comissions", data),
    delete: (folio: string) => api.delete(`/comissions/folio/${folio}`),
    updatePass: (folio: string, data: any) => api.put(`/comissions/folio/${folio}/pass`, data),
    send: (folio: string, email: string) => api.post(`/comissions/folio/${folio}/send`, { email }),
    downloadPdf: (folio: string) => api.get(`/comissions/folio/${folio}/download-pdf`, { responseType: 'blob' }),
};

// -------- PASSES ----------
export const passAPI = {
    salida: (data: FormData) => api.post<PassResponse>("/pass/salida", data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    entrada: (data: FormData) => api.post<PassResponse>("/pass/entrada", data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    getDetails: (passId: number) => api.get<PassDetailsResponse>(`/pass/details/${passId}`),
};

// -------- INSPECTIONS ----------
export const inspectionsAPI = {
    delete: (id: number) => api.delete(`/inspections/${id}`),
};

// -------- DESTINOS ----------
export const placesAPI = {
    create: (data: PlaceCreateRequest) => api.post<PlaceCreateResponse>("/places", data),
};

export default api;
