import React, { useState } from "react";
import VehicleList from "./components/VehicleList";
import VehicleForm from "./components/VehicleForm";
import VehicleEdit from "./components/VehicleEdit";

export default function App() {
    const [refresh, setRefresh] = useState(false);

    const handleRefresh = () => setRefresh(!refresh);

    return (
        <div style={{ padding: "20px" }}>
            <h1>🚗 Sistema de Control Vehicular</h1>
            <VehicleForm onVehicleAdded={handleRefresh} />
            <VehicleList key={refresh} onVehicleChanged={handleRefresh} />
            <VehicleEdit onVehicleChanged={handleRefresh} />
        </div>
    );
}