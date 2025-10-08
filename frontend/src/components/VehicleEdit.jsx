import React, { useState, useEffect } from "react";

export default function VehicleEdit({ vehicle, onUpdate }) {
    const [form, setForm] = useState({
        id: "",
        plate: "",
        brand: "",
        model: "",
        year: "",
        color: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (vehicle) {
            setForm({ ...vehicle });
        }
    }, [vehicle]);

    if (!vehicle) {
        return <p style={{ color: "gray" }}>Selecciona un vehículo para editar...</p>;
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onUpdate(form.id, form);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleUpdate}
            style={{
                marginTop: "10px",
                background: "#fafafa",
                padding: "10px",
                borderRadius: "8px",
            }}
        >
            <h4>✏️ Editar vehículo #{form.id}</h4>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                    name="plate"
                    placeholder="Placa"
                    value={form.plate}
                    onChange={handleChange}
                    required
                />
                <input
                    name="brand"
                    placeholder="Marca"
                    value={form.brand}
                    onChange={handleChange}
                    required
                />
                <input
                    name="model"
                    placeholder="Modelo"
                    value={form.model}
                    onChange={handleChange}
                    required
                />
                <input
                    name="year"
                    placeholder="Año"
                    value={form.year}
                    onChange={handleChange}
                    required
                />
                <input
                    name="color"
                    placeholder="Color"
                    value={form.color}
                    onChange={handleChange}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Guardando..." : "💾 Guardar"}
                </button>
            </div>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
        </form>
    );
}
