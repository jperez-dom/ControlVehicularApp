const BASE_URL = "http://localhost:8000/api/vehicles";

export async function getVehicles() {
    const response = await fetch(BASE_URL);
    if (!response.ok) throw new Error("Error al obtener vehículos");
    return response.json();
}

export async function addVehicle(vehicle) {
    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicle),
    });
    if (!response.ok) throw new Error("Error al crear vehículo");
    return response.json();
}

export async function updateVehicle(id, updatedData) {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
    });
    if (!response.ok) throw new Error("Error al actualizar vehículo");
    return response.json();
}

export async function deleteVehicle(id) {
    const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Error al eliminar vehículo");
    return response.json();
}