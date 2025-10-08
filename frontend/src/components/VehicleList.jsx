import React, { useEffect, useState } from "react";
import { getVehicles, updateVehicle, deleteVehicle } from "../services/vehicleService";
import VehicleEdit from "./VehicleEdit";

export default function VehicleList({ onVehicleChanged }) {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        async function fetchVehicles() {
            try {
                const data = await getVehicles();
                setVehicles(data);
            } catch (err) {
                console.error(err);
                setError("Error al cargar los vehículos");
            } finally {
                setLoading(false);
            }
        }
        fetchVehicles();
    }, [onVehicleChanged]);

    const handleEditClick = (id) => {
        setEditingId(editingId === id ? null : id);
    };

    const handleUpdate = async (id, updatedData) => {
        try {
            await updateVehicle(id, updatedData);
            alert("Vehículo actualizado correctamente");
            setEditingId(null);
            onVehicleChanged();
        } catch (err) {
            alert("Error al actualizar vehículo");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        try {
            if (!window.confirm("¿Seguro que deseas eliminar este vehículo?")) return;
            await deleteVehicle(id);
            alert("Vehículo eliminado correctamente");
            onVehicleChanged();
        } catch (err) {
            alert("Error al eliminar vehículo");
            console.error(err);
        }
    };

    if (loading) return <p>Cargando vehículos...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>🚗 Lista de Vehículos</h2>
            <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                    <th>ID</th>
                    <th>Placa</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Año</th>
                    <th>Color</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {vehicles.map((v) => (
                    <React.Fragment key={v.id}>
                        <tr>
                            <td>{v.id}</td>
                            <td>{v.plate}</td>
                            <td>{v.brand}</td>
                            <td>{v.model}</td>
                            <td>{v.year}</td>
                            <td>{v.color}</td>
                            <td>
                                <button onClick={() => handleEditClick(v.id)}>
                                    {editingId === v.id ? "Cancelar" : "✏️ Editar"}
                                </button>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    style={{ color: "red", marginLeft: "8px" }}
                                >
                                    🗑 Eliminar
                                </button>
                            </td>
                        </tr>

                        {editingId === v.id && (
                            <tr>
                                <td colSpan="7">
                                    <VehicleEdit vehicle={v} onUpdate={handleUpdate} />
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
                </tbody>
            </table>
        </div>
    );
}