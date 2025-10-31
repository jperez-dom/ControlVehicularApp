import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { DetalleFicha } from './components/DetalleFicha';
import { FormularioEntrada } from './components/FormularioEntrada';
import { FormularioSalida } from './components/FormularioSalida';
import { toast } from "sonner";
import { Plus, Eye, Trash2, ArrowLeft } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';
import { driversAPI, vehiclesAPI, comissionsAPI, placesAPI, passAPI } from './api';
import { Login } from "./components/Login";
import { AddDriverModal } from "./components/AddDriverModal";
import { AddVehicleModal } from "./components/AddVehicleModal";
import { DeleteDriverModal } from './components/DeleteDriverModal';
import { DeleteVehicleModal } from './components/DeleteVehicleModal';
import { AddDestinoModal } from "./components/AddDestinoModal";
import { DestinosList } from "./components/DestinosList";
import { BottomSheetSelect } from "./components/BottomSheet";

// --- TYPE DEFINITIONS ---
interface Destino {
    id: string;
    estado: string;
    ciudad: string;
    comentario: string;
}

interface PassDetails {
    id: number;
    departureMileage: number | null;
    arrivalMileage: number | null;
    fuel: string;
    comment_salida: string | null;
    comment_entrada: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    comission_folio: string | null;
}

interface FichaGuardada {
    folio: string;
    conductorNombre: string;
    conductorCargo: string;
    vehiculo?: string;
    destinos: Destino[];
    fechaCreacion: string;
    estado: 'creada' | 'con-entrada' | 'con-salida' | 'completada';
    passDetails: PassDetails | null;
}

interface Driver {
    id: number;
    value: string;
    label: string;
    cargo?: string;
    status?: number;
}

interface Vehicle {
    id: number;
    value: string;
    label: string;
    marca?: string;
    modelo?: string;
    placa?: string;
    color?: string;
    año?: string;
    status?: number;
}

// A simplified version for the form state
interface FichaFormData {
    folio: string;
    conductorNombre: string;
    conductorCargo: string;
    vehiculo: string;
    destinos: Destino[];
}

// Helper to check if a string is likely a hash code from the API
const isHashCode = (str: any): str is string =>
    typeof str === 'string' &&
    str.length > 1 && // Should not be a single character
    str.length < 25 &&
    /^[A-Za-z0-9]+$/.test(str) &&
    !/\s/.test(str) &&
    !/[áéíóúÁÉÍÓÚ]/.test(str) && // Should not contain accents
    !/^[A-Z][a-z]+/.test(str); // Should not look like a capitalized name

// Helper to resolve a list of hashes
const resolveCityHashes = async (hashes: string[]): Promise<{ city: string }[]> => {
    const cityPromises = hashes.map(async (hashCode) => {
        try {
            const cityResponse = await fetch(`https://api.copomex.com/query/getCityByHashCode/${hashCode}?token=pruebas`);
            if (!cityResponse.ok) return null;
            const cityData = await cityResponse.json();
            return cityData.response?.ciudad ? { city: cityData.response.ciudad } : null;
        } catch (e) {
            console.error(`Failed to resolve city hash ${hashCode}`, e);
            return null;
        }
    });
    return (await Promise.all(cityPromises)).filter((c): c is { city: string } => c !== null);
};

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'crear-ficha' | 'detalle-ficha' | 'formulario-entrada' | 'formulario-salida'>('login');
    const [fichasGuardadas, setFichasGuardadas] = useState<FichaGuardada[]>([]);
    const [selectedFicha, setSelectedFicha] = useState<FichaGuardada | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [estados, setEstados] = useState<{ value: string, label: string, codigo?: string }[]>([]);
    const [ciudades, setCiudades] = useState<{ [key: string]: { value: string, label: string }[] }>({});
    const [loadingCiudades, setLoadingCiudades] = useState<{ [key: string]: boolean }>({});
    const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
    const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
    const [isDeleteDriverModalOpen, setIsDeleteDriverModalOpen] = useState(false);
    const [isDeleteVehicleModalOpen, setIsDeleteVehicleModalOpen] = useState(false);
    const [isAddDestinoModalOpen, setIsAddDestinoModalOpen] = useState(false);
    const [editingDestino, setEditingDestino] = useState<Destino | null>(null);
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fichaToDelete, setFichaToDelete] = useState<string | null>(null);
    const [fichaData, setFichaData] = useState<FichaFormData>({
        folio: '',
        conductorNombre: '',
        conductorCargo: '',
        vehiculo: '',
        destinos: []
    });

    const generateFolio = () => {
        const currentCounter = parseInt(localStorage.getItem('folioCounter') || '1', 10);
        const number = currentCounter.toString().padStart(4, '0');
        localStorage.setItem('folioCounter', (currentCounter + 1).toString());
        return `PV-${number}`;
    };

    const refreshFichas = useCallback(async () => {
        try {
            const fichasResponse = await comissionsAPI.list();
            const freshFichas = Array.isArray(fichasResponse.data) ? fichasResponse.data as FichaGuardada[] : [];
            setFichasGuardadas(freshFichas);

            if (selectedFicha) {
                const updatedSelected = freshFichas.find(f => f.folio === selectedFicha.folio);
                setSelectedFicha(updatedSelected || null);
            }
            toast.success('Datos actualizados');
        } catch (error) {
            console.error('❌ Error al recargar las fichas:', error);
            toast.error('No se pudieron actualizar los datos');
        }
    }, [selectedFicha]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [driversResponse, vehiclesResponse, fichasResponse] = await Promise.all([
                    driversAPI.list(),
                    vehiclesAPI.list(),
                    comissionsAPI.list()
                ]);

                if (Array.isArray(driversResponse.data)) {
                    setDrivers(driversResponse.data.filter((d: any) => d.status !== 0).map((d: any) => ({ value: `${d.name.toLowerCase().replace(/\s+/g, '-')}-${d.id}`, label: d.name, cargo: d.position, id: d.id })));
                } else { setDrivers([]); }

                if (Array.isArray(vehiclesResponse.data)) {
                    setVehicles(vehiclesResponse.data.filter((v: any) => v.status !== 0).map((v: any) => ({ value: v.plate, label: `${v.brand} ${v.model} (${v.plate})`, marca: v.brand, modelo: v.model, placa: v.plate, color: v.color, año: v.year?.toString(), id: v.id })));
                } else { setVehicles([]); }

                if (Array.isArray(fichasResponse.data)) {
                    setFichasGuardadas(fichasResponse.data as FichaGuardada[]);
                }

                toast.success('Datos cargados desde la base de datos');
            } catch (error) {
                console.error('❌ Error al cargar datos iniciales:', error);
                toast.error('Error al cargar datos iniciales desde la BD');
            }
        };
        loadInitialData();

        // Estados mexicanos con sus códigos numéricos oficiales
        const estadosCompletos = [
            { value: 'aguascalientes', label: 'Aguascalientes', codigo: '01' },
            { value: 'baja-california', label: 'Baja California', codigo: '02' },
            { value: 'baja-california-sur', label: 'Baja California Sur', codigo: '03' },
            { value: 'campeche', label: 'Campeche', codigo: '04' },
            { value: 'coahuila', label: 'Coahuila', codigo: '05' },
            { value: 'colima', label: 'Colima', codigo: '06' },
            { value: 'chiapas', label: 'Chiapas', codigo: '07' },
            { value: 'chihuahua', label: 'Chihuahua', codigo: '08' },
            { value: 'ciudad-de-mexico', label: 'Ciudad de México', codigo: '09' },
            { value: 'durango', label: 'Durango', codigo: '10' },
            { value: 'guanajuato', label: 'Guanajuato', codigo: '11' },
            { value: 'guerrero', label: 'Guerrero', codigo: '12' },
            { value: 'hidalgo', label: 'Hidalgo', codigo: '13' },
            { value: 'jalisco', label: 'Jalisco', codigo: '14' },
            { value: 'estado-de-mexico', label: 'Estado de México', codigo: '15' },
            { value: 'michoacan', label: 'Michoacán', codigo: '16' },
            { value: 'morelos', label: 'Morelos', codigo: '17' },
            { value: 'nayarit', label: 'Nayarit', codigo: '18' },
            { value: 'nuevo-leon', label: 'Nuevo León', codigo: '19' },
            { value: 'oaxaca', label: 'Oaxaca', codigo: '20' },
            { value: 'puebla', label: 'Puebla', codigo: '21' },
            { value: 'queretaro', label: 'Querétaro', codigo: '22' },
            { value: 'quintana-roo', label: 'Quintana Roo', codigo: '23' },
            { value: 'san-luis-potosi', label: 'San Luis Potosí', codigo: '24' },
            { value: 'sinaloa', label: 'Sinaloa', codigo: '25' },
            { value: 'sonora', label: 'Sonora', codigo: '26' },
            { value: 'tabasco', label: 'Tabasco', codigo: '27' },
            { value: 'tamaulipas', label: 'Tamaulipas', codigo: '28' },
            { value: 'tlaxcala', label: 'Tlaxcala', codigo: '29' },
            { value: 'veracruz', label: 'Veracruz', codigo: '30' },
            { value: 'yucatan', label: 'Yucatán', codigo: '31' },
            { value: 'zacatecas', label: 'Zacatecas', codigo: '32' }
        ];
        setEstados(estadosCompletos);

        setFichaData(prev => ({
            ...prev,
            folio: generateFolio()
        }));
    }, []);

    const handleLogin = () => setCurrentScreen('dashboard');
    const handleBackToDashboard = () => setCurrentScreen('dashboard');

    const handleCreateNewFicha = () => {
        setSelectedFicha(null);
        setFichaData({ folio: generateFolio(), conductorNombre: '', conductorCargo: '', vehiculo: '', destinos: [] });
        setShowValidationErrors(false);
        setCurrentScreen('crear-ficha');
    };

    const handleSelectFicha = (ficha: FichaGuardada) => {
        setSelectedFicha(ficha);
        setCurrentScreen('detalle-ficha');
    };

    const handleGoToSalida = () => setCurrentScreen('formulario-salida');
    const handleGoToEntrada = () => setCurrentScreen('formulario-entrada');
    const handleEditSalida = () => setCurrentScreen('formulario-salida');
    const handleEditEntrada = () => setCurrentScreen('formulario-entrada');

    const handleSalidaComplete = async (salidaData: any) => {
        if (!selectedFicha) return toast.error("No hay una ficha seleccionada.");
        try {
            const isEditing = !!selectedFicha.passDetails?.id;
            const payload = {
                pass_id: isEditing ? selectedFicha.passDetails!.id : undefined,
                comission_id: selectedFicha.folio,
                mileage: parseInt(salidaData.kmSalida?.replace(/,/g, '') || '0'),
                fuel: salidaData.combustible?.toString() || '8',
                departure_comment: salidaData.departure_comment || '',
                start_date: new Date().toISOString(),
            };
            await passAPI.salida(payload);
            toast.success(`Salida ${isEditing ? 'actualizada' : 'registrada'} correctamente`);
            await refreshFichas();
            setCurrentScreen('detalle-ficha');
        } catch (error) {
            console.error('Error al guardar la salida:', error);
            toast.error('Error al guardar la salida');
        }
    };

    const handleEntradaComplete = async (entradaData: any) => {
        const passId = selectedFicha?.passDetails?.id;
        if (!passId) return toast.error("Falta el ID del Pase para registrar la entrada.");
        try {
            const isEditing = !!selectedFicha.passDetails?.endDate && new Date(selectedFicha.passDetails.endDate).getFullYear() > 1970;
            const payload = {
                pass_id: passId,
                end_date: new Date().toISOString(),
                mileage: parseInt(entradaData.kmEntrada?.replace(/,/g, '') || '0'),
                fuel: entradaData.combustible?.toString() || '8',
                arrival_comment: entradaData.arrival_comment || '',
            };
            await passAPI.entrada(payload);
            toast.success(`Entrada ${isEditing ? 'actualizada' : 'registrada'} correctamente`);
            await refreshFichas();
            setCurrentScreen('detalle-ficha');
        } catch (error) {
            console.error('Error al guardar la entrada:', error);
            toast.error('Error al guardar la entrada');
        }
    };

    const handleOpenDeleteModal = (folio: string) => {
        setFichaToDelete(folio);
        setShowDeleteModal(true);
    };

    const handleDeleteFicha = async () => {
        if (!fichaToDelete) return;
        try {
            await comissionsAPI.delete(fichaToDelete);
            setFichasGuardadas(prevFichas => prevFichas.filter(f => f.folio !== fichaToDelete));
            toast.success(`Ficha ${fichaToDelete} eliminada`);
        } catch (error) {
            console.error('Error al eliminar la ficha:', error);
            toast.error('Error al eliminar la ficha');
        } finally {
            setShowDeleteModal(false);
            setFichaToDelete(null);
        }
    };

    const validateFichaForm = () => {
        const hasNombre = fichaData.conductorNombre.trim() !== '';
        const hasCargo = fichaData.conductorCargo.trim() !== '';
        const hasVehiculo = fichaData.vehiculo.trim() !== '';
        const hasDestinos = fichaData.destinos.length > 0;
        return hasNombre && hasCargo && hasVehiculo && hasDestinos;
    };

    const handleSaveFicha = async () => {
        if (!validateFichaForm()) {
            setShowValidationErrors(true);
            toast.error('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            const driver = drivers.find(d => d.label === fichaData.conductorNombre);
            const vehicle = vehicles.find(v => v.label === fichaData.vehiculo);

            if (!driver?.id || !vehicle?.id) {
                toast.error('Error: conductor o vehículo no encontrado. Verifica que se hayan cargado desde la BD');
                return;
            }

            const userIdString = localStorage.getItem("user_id");
            if (!userIdString) {
                toast.error("Error: No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.");
                return;
            }
            const userId = parseInt(userIdString, 10);

            const comissionResponse = await comissionsAPI.create({
                driver_id: driver.id,
                vehicle_id: vehicle.id,
                user_id: userId,
                city: fichaData.destinos[0]?.ciudad || 'Por definir',
                state: fichaData.destinos[0]?.estado || 'Por definir',
                description: fichaData.destinos.map(d => `${d.estado}, ${d.ciudad}`).join(' | ')
            });

            if (comissionResponse.data.success) {
                const comissionId = comissionResponse.data.comission.id;

                for (const destino of fichaData.destinos) {
                    await placesAPI.create({
                        comission_id: comissionId,
                        city: destino.ciudad,
                        state: destino.estado,
                        comment: destino.comentario
                    });
                }

                const nuevaFicha: FichaGuardada = {
                    ...fichaData,
                    folio: comissionResponse.data.comission.folio.toString(),
                    fechaCreacion: comissionResponse.data.comission.created_at,
                    estado: 'creada',
                    passDetails: null
                };

                setFichasGuardadas(prev => [...prev, nuevaFicha]);
                setSelectedFicha(nuevaFicha);
                toast.success('Ficha guardada en la base de datos');
                setCurrentScreen('detalle-ficha');
            }
        } catch (error) {
            console.error('Error al guardar ficha:', error);
            toast.error('Error al guardar la ficha');
        }
    };

    const getSelectedVehicleName = (vehicleIdentifier?: string) => {
        const identifier = vehicleIdentifier || fichaData.vehiculo;
        const vehicle = vehicles.find(v => v.label === identifier || v.value === identifier || v.placa === identifier);
        return vehicle ? vehicle.label : identifier;
    };

    const getEstadoLabel = (value: string) => {
        const estado = estados.find(e => e.value === value);
        return estado ? estado.label : value;
    };

    const getCiudadLabel = (estadoValue: string, ciudadValue: string) => {
        const ciudadOptions = ciudades[estadoValue] || [];
        const ciudad = ciudadOptions.find(c => c.value === ciudadValue);
        return ciudad ? ciudad.label : ciudadValue;
    };

    const handleDriverAdded = (newDriver: Driver) => {
        setDrivers(prev => [...prev, newDriver]);
        setFichaData(prev => ({
            ...prev,
            conductorNombre: newDriver.label,
            conductorCargo: newDriver.cargo || ''
        }));
        toast.success('Conductor agregado correctamente');
    };

    const handleDriverDeleted = (driverId: number) => {
        setDrivers(prev => prev.filter(d => d.id !== driverId));
    };

    const handleVehicleAdded = (newVehicle: Vehicle) => {
        setVehicles(prev => [...prev, newVehicle]);
        setFichaData(prev => ({
            ...prev,
            vehiculo: newVehicle.label
        }));
        toast.success('Vehículo agregado correctamente');
    };

    const handleVehicleDeleted = (vehicleId: number) => {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    };

    const handleDestinoAdded = (destino: Destino) => {
        if (editingDestino) {
            setFichaData(prev => ({
                ...prev,
                destinos: prev.destinos.map(d => d.id === destino.id ? destino : d)
            }));
            setEditingDestino(null);
        } else {
            setFichaData(prev => ({
                ...prev,
                destinos: [...prev.destinos, destino]
            }));
        }
    };

    const handleEditDestino = (destino: Destino) => {
        setEditingDestino(destino);
        setIsAddDestinoModalOpen(true);
    };

    const handleDeleteDestino = (id: string) => {
        setFichaData(prev => ({
            ...prev,
            destinos: prev.destinos.filter(d => d.id !== id)
        }));
        toast.success('Destino eliminado');
    };

    const openAddDestinoModal = () => {
        setEditingDestino(null);
        setIsAddDestinoModalOpen(true);
    };

    const loadCiudadesForEstado = async (estadoValue: string, estadoLabel: string) => {
        if (!estadoValue || ciudades[estadoValue]) return;

        setLoadingCiudades(prev => ({ ...prev, [estadoValue]: true }));

        try {
            const estado = estados.find(e => e.value === estadoValue);
            const estadoCodigo = estado?.codigo;

            if (!estadoCodigo) {
                throw new Error(`Código de estado no encontrado para ${estadoValue}`);
            }

            const apiUrl = `https://api.copomex.com/query/getCitiesByStateCode/${estadoCodigo}?token=pruebas`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // --- MORE ROBUST LOGIC ---
            let rawList: any[] = [];
            if (data && data.response && typeof data.response === 'object') {
                const cities = data.response.ciudades || data.response.cities;
                if (Array.isArray(cities)) {
                    rawList = cities;
                }
            } else if (Array.isArray(data)) {
                rawList = data;
            }

            let ciudadesList: { city: string }[] = [];

            if (rawList.length > 0) {
                const firstItem = rawList[0];
                
                if (isHashCode(firstItem)) {
                    ciudadesList = await resolveCityHashes(rawList as string[]);
                } else if (typeof firstItem === 'string') {
                    ciudadesList = rawList.map((ciudad: string) => ({ city: ciudad }));
                } else if (typeof firstItem === 'object' && firstItem !== null) {
                    ciudadesList = rawList;
                }
            }

            if (ciudadesList.length > 0) {
                const ciudadesFormatted = ciudadesList.map((ciudad: any) => {
                    const cityName = ciudad.city || ciudad.name || ciudad.municipio || ciudad;
                    if (typeof cityName !== 'string') return null;
                    return {
                        value: cityName.toLowerCase().replace(/\s+/g, '-').replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e').replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o').replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n').replace(/[^a-z0-9-]/g, ''),
                        label: cityName
                    };
                }).filter((c): c is { value: string, label: string } => c !== null);

                const ciudadesUnicas = ciudadesFormatted.filter((ciudad, index, self) =>
                    index === self.findIndex(c => c.value === ciudad.value)
                );

                if (ciudadesUnicas.length > 0) {
                    setCiudades(prev => ({
                        ...prev,
                        [estadoValue]: ciudadesUnicas.sort((a, b) => a.label.localeCompare(b.label))
                    }));
                    return;
                }
            }
            throw new Error('Using fallback data');

        } catch (error) {
            if (error.message !== 'Using fallback data') {
                console.error(`❌ Error loading ciudades for ${estadoLabel}:`, error);
            }

            const fallbackCiudades: {[key: string]: {value: string, label: string}[]} = {
                'aguascalientes': [
                    { value: 'aguascalientes', label: 'Aguascalientes' },
                    { value: 'calvillo', label: 'Calvillo' },
                    { value: 'jesus-maria', label: 'Jesús María' },
                    { value: 'pabellon-de-arteaga', label: 'Pabellón de Arteaga' },
                    { value: 'rincon-de-romos', label: 'Rincón de Romos' }
                ],
                'baja-california': [
                    { value: 'tijuana', label: 'Tijuana' },
                    { value: 'mexicali', label: 'Mexicali' },
                    { value: 'ensenada', label: 'Ensenada' },
                    { value: 'rosarito', label: 'Rosarito' },
                    { value: 'tecate', label: 'Tecate' }
                ],
                'baja-california-sur': [
                    { value: 'la-paz', label: 'La Paz' },
                    { value: 'los-cabos', label: 'Los Cabos' },
                    { value: 'cabo-san-lucas', label: 'Cabo San Lucas' },
                    { value: 'san-jose-del-cabo', label: 'San José del Cabo' },
                    { value: 'ciudad-constitucion', label: 'Ciudad Constitución' },
                    { value: 'loreto', label: 'Loreto' }
                ],
                'campeche': [
                    { value: 'campeche', label: 'Campeche' },
                    { value: 'ciudad-del-carmen', label: 'Ciudad del Carmen' },
                    { value: 'escarcega', label: 'Escárcega' },
                    { value: 'champoton', label: 'Champotón' }
                ],
                'coahuila': [
                    { value: 'saltillo', label: 'Saltillo' },
                    { value: 'torreon', label: 'Torreón' },
                    { value: 'monclova', label: 'Monclova' },
                    { value: 'piedras-negras', label: 'Piedras Negras' },
                    { value: 'acuna', label: 'Acuña' }
                ],
                'colima': [
                    { value: 'colima', label: 'Colima' },
                    { value: 'manzanillo', label: 'Manzanillo' },
                    { value: 'tecoman', label: 'Tecomán' },
                    { value: 'villa-de-alvarez', label: 'Villa de Álvarez' }
                ],
                'chiapas': [
                    { value: 'tuxtla-gutierrez', label: 'Tuxtla Gutiérrez' },
                    { value: 'san-cristobal-de-las-casas', label: 'San Cristóbal de las Casas' },
                    { value: 'tapachula', label: 'Tapachula' },
                    { value: 'palenque', label: 'Palenque' },
                    { value: 'comitan', label: 'Comitán' }
                ],
                'chihuahua': [
                    { value: 'chihuahua', label: 'Chihuahua' },
                    { value: 'ciudad-juarez', label: 'Ciudad Juárez' },
                    { value: 'delicias', label: 'Delicias' },
                    { value: 'cuauhtemoc', label: 'Cuauhtémoc' },
                    { value: 'parral', label: 'Parral' }
                ],
                'ciudad-de-mexico': [
                    { value: 'alvaro-obregon', label: 'Álvaro Obregón' },
                    { value: 'azcapotzalco', label: 'Azcapotzalco' },
                    { value: 'benito-juarez', label: 'Benito Juárez' },
                    { value: 'coyoacan', label: 'Coyoacán' },
                    { value: 'cuauhtemoc', label: 'Cuauhtémoc' },
                    { value: 'gustavo-a-madero', label: 'Gustavo A. Madero' },
                    { value: 'iztacalco', label: 'Iztacalco' },
                    { value: 'iztapalapa', label: 'Iztapalapa' },
                    { value: 'miguel-hidalgo', label: 'Miguel Hidalgo' },
                    { value: 'venustiano-carranza', label: 'Venustiano Carranza' }
                ],
                'durango': [
                    { value: 'durango', label: 'Durango' },
                    { value: 'gomez-palacio', label: 'Gómez Palacio' },
                    { value: 'lerdo', label: 'Lerdo' },
                    { value: 'santiago-papasquiaro', label: 'Santiago Papasquiaro' }
                ],
                'guanajuato': [
                    { value: 'leon', label: 'León' },
                    { value: 'guanajuato', label: 'Guanajuato' },
                    { value: 'celaya', label: 'Celaya' },
                    { value: 'irapuato', label: 'Irapuato' },
                    { value: 'salamanca', label: 'Salamanca' },
                    { value: 'san-miguel-de-allende', label: 'San Miguel de Allende' }
                ],
                'guerrero': [
                    { value: 'acapulco', label: 'Acapulco' },
                    { value: 'chilpancingo', label: 'Chilpancingo' },
                    { value: 'iguala', label: 'Iguala' },
                    { value: 'zihuatanejo', label: 'Zihuatanejo' },
                    { value: 'taxco', label: 'Taxco' }
                ],
                'hidalgo': [
                    { value: 'pachuca', label: 'Pachuca' },
                    { value: 'tulancingo', label: 'Tulancingo' },
                    { value: 'huejutla', label: 'Huejutla' },
                    { value: 'tizayuca', label: 'Tizayuca' }
                ],
                'jalisco': [
                    { value: 'guadalajara', label: 'Guadalajara' },
                    { value: 'zapopan', label: 'Zapopan' },
                    { value: 'tlaquepaque', label: 'Tlaquepaque' },
                    { value: 'tonala', label: 'Tonalá' },
                    { value: 'puerto-vallarta', label: 'Puerto Vallarta' },
                    { value: 'lagos-de-moreno', label: 'Lagos de Moreno' },
                    { value: 'el-salto', label: 'El Salto' },
                    { value: 'tepatitlan', label: 'Tepatitlán' }
                ],
                'estado-de-mexico': [
                    { value: 'ecatepec', label: 'Ecatepec de Morelos' },
                    { value: 'nezahualcoyotl', label: 'Nezahualcóyotl' },
                    { value: 'naucalpan', label: 'Naucalpan de Juárez' },
                    { value: 'tlalnepantla', label: 'Tlalnepantla de Baz' },
                    { value: 'toluca', label: 'Toluca' },
                    { value: 'atizapan', label: 'Atizapán de Zaragoza' },
                    { value: 'cuautitlan-izcalli', label: 'Cuautitlán Izcalli' }
                ],
                'michoacan': [
                    { value: 'morelia', label: 'Morelia' },
                    { value: 'uruapan', label: 'Uruapan' },
                    { value: 'zamora', label: 'Zamora' },
                    { value: 'lazaro-cardenas', label: 'Lázaro Cárdenas' },
                    { value: 'apatzingan', label: 'Apatzingán' }
                ],
                'morelos': [
                    { value: 'cuernavaca', label: 'Cuernavaca' },
                    { value: 'jiutepec', label: 'Jiutepec' },
                    { value: 'cuautla', label: 'Cuautla' },
                    { value: 'temixco', label: 'Temixco' }
                ],
                'nayarit': [
                    { value: 'tepic', label: 'Tepic' },
                    { value: 'bahia-de-banderas', label: 'Bahía de Banderas' },
                    { value: 'nuevo-vallarta', label: 'Nuevo Vallarta' },
                    { value: 'santiago-ixcuintla', label: 'Santiago Ixcuintla' }
                ],
                'nuevo-leon': [
                    { value: 'monterrey', label: 'Monterrey' },
                    { value: 'guadalupe', label: 'Guadalupe' },
                    { value: 'san-pedro-garza-garcia', label: 'San Pedro Garza García' },
                    { value: 'santa-catarina', label: 'Santa Catarina' },
                    { value: 'san-nicolas-de-los-garza', label: 'San Nicolás de los Garza' },
                    { value: 'apodaca', label: 'Apodaca' },
                    { value: 'general-escobedo', label: 'General Escobedo' },
                    { value: 'juarez', label: 'Juárez' }
                ],
                'oaxaca': [
                    { value: 'oaxaca-de-juarez', label: 'Oaxaca de Juárez' },
                    { value: 'salina-cruz', label: 'Salina Cruz' },
                    { value: 'tuxtepec', label: 'Tuxtepec' },
                    { value: 'juchitan', label: 'Juchitán' },
                    { value: 'huajuapan', label: 'Huajuapan' }
                ],
                'puebla': [
                    { value: 'puebla', label: 'Puebla' },
                    { value: 'tehuacan', label: 'Tehuacán' },
                    { value: 'san-martin-texmelucan', label: 'San Martín Texmelucan' },
                    { value: 'atlixco', label: 'Atlixco' },
                    { value: 'cholula', label: 'Cholula' }
                ],
                'queretaro': [
                    { value: 'queretaro', label: 'Querétaro' },
                    { value: 'san-juan-del-rio', label: 'San Juan del Río' },
                    { value: 'cadereyta', label: 'Cadereyta' },
                    { value: 'tequisquiapan', label: 'Tequisquiapan' }
                ],
                'quintana-roo': [
                    { value: 'cancun', label: 'Cancún' },
                    { value: 'chetumal', label: 'Chetumal' },
                    { value: 'playa-del-carmen', label: 'Playa del Carmen' },
                    { value: 'cozumel', label: 'Cozumel' },
                    { value: 'tulum', label: 'Tulum' }
                ],
                'san-luis-potosi': [
                    { value: 'san-luis-potosi', label: 'San Luis Potosí' },
                    { value: 'soledad-de-graciano-sanchez', label: 'Soledad de Graciano Sánchez' },
                    { value: 'ciudad-valles', label: 'Ciudad Valles' },
                    { value: 'matehuala', label: 'Matehuala' },
                    { value: 'rioverde', label: 'Rioverde' }
                ],
                'sinaloa': [
                    { value: 'culiacan', label: 'Culiacán' },
                    { value: 'mazatlan', label: 'Mazatlán' },
                    { value: 'los-mochis', label: 'Los Mochis' },
                    { value: 'guasave', label: 'Guasave' },
                    { value: 'navolato', label: 'Navolato' }
                ],
                'sonora': [
                    { value: 'hermosillo', label: 'Hermosillo' },
                    { value: 'ciudad-obregon', label: 'Ciudad Obregón' },
                    { value: 'nogales', label: 'Nogales' },
                    { value: 'san-luis-rio-colorado', label: 'San Luis Río Colorado' },
                    { value: 'navojoa', label: 'Navojoa' }
                ],
                'tabasco': [
                    { value: 'villahermosa', label: 'Villahermosa' },
                    { value: 'cardenas', label: 'Cárdenas' },
                    { value: 'comalcalco', label: 'Comalcalco' },
                    { value: 'paraiso', label: 'Paraíso' },
                    { value: 'cunduacan', label: 'Cunduacán' }
                ],
                'tamaulipas': [
                    { value: 'reynosa', label: 'Reynosa' },
                    { value: 'matamoros', label: 'Matamoros' },
                    { value: 'nuevo-laredo', label: 'Nuevo Laredo' },
                    { value: 'tampico', label: 'Tampico' },
                    { value: 'ciudad-victoria', label: 'Ciudad Victoria' }
                ],
                'tlaxcala': [
                    { value: 'tlaxcala', label: 'Tlaxcala' },
                    { value: 'apizaco', label: 'Apizaco' },
                    { value: 'huamantla', label: 'Huamantla' },
                    { value: 'san-pablo-del-monte', label: 'San Pablo del Monte' }
                ],
                'veracruz': [
                    { value: 'veracruz', label: 'Veracruz' },
                    { value: 'xalapa', label: 'Xalapa' },
                    { value: 'coatzacoalcos', label: 'Coatzacoalcos' },
                    { value: 'poza-rica', label: 'Poza Rica' },
                    { value: 'minatitlan', label: 'Minatitlán' },
                    { value: 'orizaba', label: 'Orizaba' }
                ],
                'yucatan': [
                    { value: 'merida', label: 'Mérida' },
                    { value: 'kanasín', label: 'Kanasín' },
                    { value: 'progreso', label: 'Progreso' },
                    { value: 'valladolid', label: 'Valladolid' },
                    { value: 'tizimin', label: 'Tizimín' }
                ],
                'zacatecas': [
                    { value: 'zacatecas', label: 'Zacatecas' },
                    { value: 'fresnillo', label: 'Fresnillo' },
                    { value: 'guadalupe', label: 'Guadalupe' },
                    { value: 'jerez', label: 'Jerez' },
                    { value: 'rio-grande', label: 'Río Grande' }
                ]
            };

            const fallback = fallbackCiudades[estadoValue] || [
                { value: 'centro', label: 'Centro' },
                { value: 'principal', label: 'Municipio Principal' }
            ];

            setCiudades(prev => ({
                ...prev,
                [estadoValue]: fallback
            }));
        } finally {
            setLoadingCiudades(prev => ({ ...prev, [estadoValue]: false }));
        }
    };

    const handleConductorChange = (conductorValue: string) => {
        const driver = drivers.find(d => d.value === conductorValue);
        if (driver) {
            setFichaData(prev => ({
                ...prev,
                conductorNombre: driver.label,
                conductorCargo: driver.cargo || ''
            }));
        }
    };

    const handleVehicleChange = (vehicleValue: string) => {
        const vehicle = vehicles.find(v => v.value === vehicleValue);
        if (vehicle) {
            setFichaData(prev => ({
                ...prev,
                vehiculo: vehicle.label
            }));
        }
    };

    const updateFichaData = (field: keyof FichaFormData, value: string | Destino[]) => {
        setFichaData(prev => ({ ...prev, [field]: value }));
    };

    const getDestinosText = (destinos: Destino[]) => {
        if (destinos.length === 0) return 'Sin destinos';
        return destinos.map(d => `${getEstadoLabel(d.estado)}, ${getCiudadLabel(d.estado, d.ciudad)}`).join(' • ');
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'login':
                return <Login onLogin={handleLogin} />;
            case 'dashboard':
                return (
                    <div key="dashboard" className="min-h-screen bg-gray-50 pb-24">
                        <div className="h-12 bg-black"></div>
                        <div className="bg-black px-4 py-2">
                            <div className="flex items-center justify-center">
                                <img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto object-contain px-[54px] py-[0px]"/>
                            </div>
                        </div>
                        <div className="bg-white px-4 py-4 border-b"><h1 className="text-black text-center text-xl">Fichas</h1></div>
                        <div className="max-w-[360px] mx-auto px-4 py-6 space-y-4">
                            {fichasGuardadas.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No hay fichas registradas</p>
                                    <p className="text-gray-400 text-sm mt-1">Crea tu primera ficha</p>
                                </div>
                            ) : (
                                fichasGuardadas
                                    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
                                    .map((ficha) => (
                                        <div
                                            key={ficha.folio}
                                            className="bg-white rounded-lg p-6 shadow-lg transition-all relative hover:shadow-xl"
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenDeleteModal(ficha.folio);
                                                }}
                                                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Eliminar ficha"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>

                                            <div className="pr-8">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <p className="text-gray-500 text-sm">Folio</p>
                                                        <p className="text-black text-lg font-semibold">{ficha.folio}</p>
                                                        <p className="text-gray-500 text-sm">Conductor</p>
                                                        <p className="text-black">{ficha.conductorNombre}</p>
                                                        <p className="text-gray-400 text-sm">{ficha.conductorCargo}</p>
                                                        {ficha.vehiculo && (
                                                            <p className="text-gray-400 text-sm">{getSelectedVehicleName(ficha.vehiculo)}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500 text-sm">Creación</p>
                                                        <p className="text-black text-sm">{new Date(ficha.fechaCreacion).toLocaleDateString()}</p>
                                                        <p className="text-gray-400 text-xs">{new Date(ficha.fechaCreacion).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2">
                                                    <p className="text-gray-500 text-sm">Ruta</p>
                                                    <p className="text-black text-sm line-clamp-2">{getDestinosText(ficha.destinos)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${
                                                            ficha.estado === 'creada' ? 'bg-blue-500' :
                                                                ficha.estado === 'con-salida' ? 'bg-orange-500' :
                                                                    'bg-green-500'
                                                        }`}></div>
                                                        <p className="text-sm text-gray-600">
                                                            {ficha.estado === 'creada' ? 'Ficha creada' :
                                                                ficha.estado === 'con-salida' ? 'Con salida' :
                                                                    'Completada'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 bg-[rgba(225,225,225,1)]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectFicha(ficha);
                                                        }}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Ver ficha
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
                            <div className="max-w-[360px] mx-auto">
                                <Button className="w-full h-12 bg-black text-white" onClick={handleCreateNewFicha}><Plus className="h-4 w-4 mr-2" />Crear ficha</Button>
                            </div>
                        </div>
                        {showDeleteModal && (
                            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                                <DialogContent className="max-w-[320px]">
                                    <DialogHeader><DialogTitle>Eliminar ficha</DialogTitle><DialogDescription>¿Estás seguro? Esta acción no se puede deshacer.</DialogDescription></DialogHeader>
                                    <div className="flex justify-center gap-2 pt-4">
                                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                                        <Button variant="destructive" onClick={handleDeleteFicha}>Eliminar</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                );
            case 'crear-ficha':
                return (
                    <div key="crear-ficha" className="min-h-screen bg-gray-50">
                         <div className="h-12 bg-black"></div>
                        <div className="bg-black px-4 py-2">
                            <div className="flex items-center justify-center">
                                <img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto object-contain px-[54px] py-[0px]"/>
                            </div>
                        </div>
                        <div className="bg-white px-4 py-4 border-b">
                             <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" onClick={handleBackToDashboard} className="p-2 h-auto"><ArrowLeft className="h-5 w-5" /></Button>
                                <h1 className="text-black text-xl flex-1 text-center mr-11">Crear Ficha</h1>
                            </div>
                        </div>
                        <div className="pb-40">
                            <div className="max-w-[360px] mx-auto px-4 py-6 space-y-6">
                                <div className="bg-white rounded-lg p-4 space-y-4">
                                    <div><Label htmlFor="folio">Folio</Label><Input id="folio" value={fichaData.folio} disabled className="mt-1 bg-gray-50" /></div>
                                    <div className="space-y-4">
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.conductorNombre ? "text-destructive" : ""}>
                                                Nombre del conductor *
                                            </Label>
                                            <div className="mt-1 flex gap-2">
                                                <div className="flex-1"><BottomSheetSelect options={drivers} value={drivers.find(d => d.label === fichaData.conductorNombre)?.value || ''} onValueChange={handleConductorChange} placeholder="Seleccionar conductor"/></div>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDriverModalOpen(true)} className="h-[42px] w-[42px] p-0 flex-shrink-0"><Plus className="h-4 w-4" /></Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteDriverModalOpen(true)} className="h-[42px] w-[42px] p-0 flex-shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                            {showValidationErrors && !fichaData.conductorNombre && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.conductorCargo ? "text-destructive" : ""}>
                                                Cargo *
                                            </Label>
                                            <Input
                                                id="conductorCargo"
                                                value={fichaData.conductorCargo}
                                                onChange={(e) => setFichaData(p => ({...p, conductorCargo: e.target.value}))}
                                                placeholder="Ingresa el cargo del conductor"
                                                className="mt-1"
                                            />
                                            {showValidationErrors && !fichaData.conductorCargo && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.vehiculo ? "text-destructive" : ""}>
                                                Vehículo *
                                            </Label>
                                            <div className="mt-1 flex gap-2">
                                                <div className="flex-1"><BottomSheetSelect options={vehicles} value={vehicles.find(v => v.label === fichaData.vehiculo)?.value || ''} onValueChange={handleVehicleChange} placeholder="Seleccionar vehículo"/></div>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddVehicleModalOpen(true)} className="h-[42px] w-[42px] p-0 flex-shrink-0"><Plus className="h-4 w-4" /></Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsDeleteVehicleModalOpen(true)} className="h-[42px] w-[42px] p-0 flex-shrink-0"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                            {showValidationErrors && !fichaData.vehiculo && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className={showValidationErrors && fichaData.destinos.length === 0 ? "text-destructive" : ""}>
                                                Ruta *
                                            </Label>
                                            <Button type="button" variant="outline" size="sm" onClick={openAddDestinoModal} className="h-8"><Plus className="h-4 w-4 mr-1" />Añadir destino</Button>
                                        </div>
                                        <DestinosList destinos={fichaData.destinos} onEditDestino={handleEditDestino} onDeleteDestino={handleDeleteDestino} getEstadoLabel={getEstadoLabel} getCiudadLabel={getCiudadLabel}/>
                                        {showValidationErrors && fichaData.destinos.length === 0 && (
                                            <p className="text-destructive text-sm">Debe agregar al menos un destino</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
                            <div className="max-w-[360px] mx-auto space-y-3"><Button className="w-full h-12" onClick={handleSaveFicha}>Guardar ficha</Button><Button variant="outline" className="w-full h-12" onClick={handleBackToDashboard}>Cancelar</Button></div>
                        </div>
                        <AddDriverModal open={isAddDriverModalOpen} onOpenChange={setIsAddDriverModalOpen} onDriverAdded={handleDriverAdded} />
                        <AddVehicleModal open={isAddVehicleModalOpen} onOpenChange={setIsAddVehicleModalOpen} onVehicleAdded={handleVehicleAdded} />
                        <DeleteDriverModal open={isDeleteDriverModalOpen} onOpenChange={setIsDeleteDriverModalOpen} drivers={drivers} onDriverDeleted={handleDriverDeleted} />
                        <DeleteVehicleModal open={isDeleteVehicleModalOpen} onOpenChange={setIsDeleteVehicleModalOpen} vehicles={vehicles} onVehicleDeleted={handleVehicleDeleted} />
                        <AddDestinoModal open={isAddDestinoModalOpen} onOpenChange={setIsAddDestinoModalOpen} onDestinoAdded={(d) => {if (editingDestino) {setFichaData(p => ({...p, destinos: p.destinos.map(dest => dest.id === d.id ? dest : dest)}));} else {setFichaData(p => ({...p, destinos: [...p.destinos, d]}));} setEditingDestino(null);}} editingDestino={editingDestino} estados={estados} ciudades={ciudades} loadCiudadesForEstado={loadCiudadesForEstado} loadingCiudades={loadingCiudades} />
                    </div>
                );
            case 'detalle-ficha':
                return selectedFicha && <DetalleFicha ficha={selectedFicha} onBack={handleBackToDashboard} onGoToEntrada={handleGoToEntrada} onGoToSalida={handleGoToSalida} onEditEntrada={handleEditEntrada} onEditSalida={handleEditSalida} getEstadoLabel={getEstadoLabel} getCiudadLabel={getCiudadLabel} getVehicleName={getSelectedVehicleName} refreshFichas={refreshFichas}/>;
            case 'formulario-salida':
                return selectedFicha && <FormularioSalida ficha={selectedFicha} onBack={() => setCurrentScreen('detalle-ficha')} onComplete={handleSalidaComplete}/>;
            case 'formulario-entrada':
                return selectedFicha && <FormularioEntrada ficha={selectedFicha} onBack={() => setCurrentScreen('detalle-ficha')} onComplete={handleEntradaComplete}/>;
            default:
                return <div>Pantalla no encontrada</div>;
        }
    };

    return <AnimatePresence mode="wait">{renderScreen()}</AnimatePresence>;
}
