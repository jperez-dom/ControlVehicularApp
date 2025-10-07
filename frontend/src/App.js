import React from "react";
import VehicleList from "./components/VehicleList";

export default function App() {
    return (
        <div>
            <h1 style={{ textAlign: "center", color: "#0066cc" }}>
                🚘 Sistema de Control Vehicular
            </h1>
            <VehicleList />
        </div>
    );
}
