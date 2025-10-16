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
} from "./types/api";

const api = axios.create({
    baseURL: "http://localhost:8000/api", // backend Symfony
    headers: {
        "Content-Type": "application/json",
    },
});

// Auth API
export const authAPI = {
    login: (code: string) => api.post<LoginResponse>("/auth/login", { code }),
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
    delete: (id: number) => api.delete(`/comissions/${id}`),
};

// Pass API
export const passAPI = {
    salida: (data: PassSalidaRequest) => api.post<PassResponse>("/pass/salida", data),
    entrada: (data: PassEntradaRequest) => api.post<PassResponse>("/pass/entrada", data),
};

// Place API
export const placesAPI = {
    create: (data: PlaceCreateRequest) => api.post<PlaceCreateResponse>("/places", data),
};

export default api;
