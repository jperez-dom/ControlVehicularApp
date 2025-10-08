import React, { useState } from "react";

export default function VehicleEdit({ vehicle, onUpdate, onDelete }) {
    const [form, setForm] = useState({ ...vehicle });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onUpdate(form.id, form);
            alert("Vehículo actualizado correctamente");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Seguro que deseas eliminar este vehículo?")) return;
        setLoading(true);
        setError(null);
        try {
            await onDelete(form.id);
            alert("Vehículo eliminado correctamente");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdate} style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
            <h3>✏️ Editar vehículo</h3>
            <input name="plate" placeholder="Placa" value={form.plate} onChange={handleChange} required />
            <input name="brand" placeholder="Marca" value={form.brand} onChange={handleChange} required />
            <input name="model" placeholder="Modelo" value={form.model} onChange={handleChange} required />
            <input name="year" placeholder="Año" value={form.year} onChange={handleChange} required />
            <input name="color" placeholder="Color" value={form.color} onChange={handleChange} required />
            <input name="internalNumber" placeholder="Número interno" value={form.internalNumber} onChange={handleChange} required />
            <button type="submit" disabled={loading}>
                {loading ? "Actualizando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading} style={{ marginLeft: "10px", color: "red" }}>
                Eliminar
            </button>
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
        </form>
    );
}