import React, { useState } from "react";
import VehicleList from "./components/VehicleList";
import VehicleForm from "./components/VehicleForm";
import VehicleEdit from "./components/VehicleEdit";

export default function App() {
    const [refresh, setRefresh] = useState(false);

    // Crear vehículo (POST)
    const crearVehiculo = async (vehiculo) => {
        try {
            const response = await fetch('http://localhost:8000/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(vehiculo),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al crear vehículo');
            }
            setRefresh(r => !r);
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    // Actualizar vehículo (PUT)
    const actualizarVehiculo = async (id, datosActualizados) => {
        try {
            const response = await fetch(`http://localhost:8000/api/vehicles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosActualizados),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al actualizar vehículo');
            }
            setRefresh(r => !r);
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    // Eliminar vehículo (DELETE)
    const eliminarVehiculo = async (id) => {
        try {
            const response = await fetch(`http://localhost:8000/api/vehicles/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Error al eliminar vehículo');
            }
            setRefresh(r => !r);
            return data;
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>🚗 Sistema de Control Vehicular</h1>
            <VehicleForm onVehicleAdded={crearVehiculo} />
            <VehicleList
                key={refresh}
                onUpdate={actualizarVehiculo}
                onDelete={eliminarVehiculo}
            />
            <VehicleEdit onUpdate={actualizarVehiculo} onDelete={eliminarVehiculo} />

        </div>
    );
}