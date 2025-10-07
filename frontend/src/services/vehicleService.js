const API_URL = "http://symfony_api:8000/api/vehicles";

export async function getVehicles() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error("Error al obtener los vehículos");
    }
    return await response.json();
}