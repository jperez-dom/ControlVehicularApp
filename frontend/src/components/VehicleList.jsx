import React, { useEffect, useState } from "react";
import { getVehicles } from "../services/vehicleService";

export default function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getVehicles();
                setVehicles(data);
            } catch (err) {
                console.log("Error al obetener vehiculos", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return <p>Cargando vehículos...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h2>🚗 Lista de Vehículos</h2>
            <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Placa</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Año</th>
                    <th>Color</th>
                </tr>
                </thead>
                <tbody>
                {vehicles.map((v) => (
                    <tr key={v.id}>
                        <td>{v.id}</td>
                        <td>{v.plate}</td>
                        <td>{v.brand}</td>
                        <td>{v.model}</td>
                        <td>{v.year}</td>
                        <td>{v.color}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
