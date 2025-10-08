import React, { useState } from "react";
import { addVehicle } from "../services/vehicleService";

export default function VehicleForm({ onVehicleAdded }) {
    const [vehicle, setVehicle] = useState({
        plate: "",
        brand: "",
        model: "",
        year: "",
        color: "",
        internalNumber: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setVehicle({ ...vehicle, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await addVehicle(vehicle);
            alert("Vehículo agregado correctamente");
            onVehicleAdded(data.vehicle);
            setVehicle({
                plate: "",
                brand: "",
                model: "",
                year: "",
                color: "",
                internalNumber: "",
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
            <h3>📝 Registrar nuevo vehículo</h3>
            <input name="plate" placeholder="Placa" value={vehicle.plate} onChange={handleChange} required />
            <input name="brand" placeholder="Marca" value={vehicle.brand} onChange={handleChange} required />
            <input name="model" placeholder="Modelo" value={vehicle.model} onChange={handleChange} required />
            <input name="year" placeholder="Año" value={vehicle.year} onChange={handleChange} required />
            <input name="color" placeholder="Color" value={vehicle.color} onChange={handleChange} required />
            <input name="internalNumber" placeholder="Número interno" value={vehicle.internalNumber} onChange={handleChange} required />
            <button type="submit" disabled={loading}>
                {loading ? "Agregando..." : "Guardar"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
        </div>
    );
}