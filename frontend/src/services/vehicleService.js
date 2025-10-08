const API_URL = "http://localhost:8000/api/vehicles";
export async function getVehicles() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error("Error al obtener los vehículos");
    }
    return await response.json();
}

export async function addVehicle(vehicle) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicle),
    });
    if (!response.ok) {
        throw new Error("Error al agregar el vehículo");
    }
    return await response.json();
}

export async function updateVehicle(vehicle) {
    const response = await fetch(`${API_URL}/${vehicle.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicle),
    });
    if (!response.ok) {
        throw new Error("Error al actualizar el vehículo");
    }
    return await response.json();
}

export async function deleteVehicle(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Error al eliminar el vehículo");
    }
    return await response.json();
}
