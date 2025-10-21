import React, { useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { VisuallyHidden } from './components/ui/visually-hidden';
import { BottomSheetSelect, BottomSheetDatePicker } from './components/BottomSheet';
import { CalendarPicker } from './components/CalendarPicker';
import { Login } from './components/Login';
import { AddDriverModal } from './components/AddDriverModal';
import { AddVehicleModal } from './components/AddVehicleModal';
import { AddDestinoModal } from './components/AddDestinoModal';
import { DestinosList } from './components/DestinosList';
import { DetalleFicha } from './components/DetalleFicha';
import { FormularioEntrada } from './components/FormularioEntrada';
import { FormularioSalida } from './components/FormularioSalida';
import { RegistroEntrada } from './components/RegistroEntrada';
import { ResumenEntrada } from './components/ResumenEntrada';
import { EnvioCorreo } from './components/EnvioCorreo';
import { toast } from "sonner@2.0.3";
import { Plus, CheckCircle, Eye, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';
import { driversAPI, vehiclesAPI, comissionsAPI, placesAPI, passAPI } from './api';

interface Destino {
    id: string;
    estado: string;
    ciudad: string;
    comentario: string;
}

interface FichaData {
    folio: string;
    conductorNombre: string;
    conductorCargo: string;
    vehiculo: string;
    destinos: Destino[];
}

// --- INTERFACES ACTUALIZADAS ---

// Definición de la estructura de la Inspección
interface InspectionData {
    id: number;
    type: 'photo' | 'signature' | 'text';
    part: string; // 'front', 'general_comment_salida', 'entrada', etc.
    comment: string | null;
    photo_url: string | null;
    signature_conductor_url: string | null;
    signature_approver_url: string | null;
}

// Estructura de los detalles del Pase (viene de GET /api/pass/{id})
interface PassDetails {
    id: number;
    mileage: number;
    fuel: string;
    comment_salida: string | null;
    comment_entrada: string | null;
    startDate: string | null;
    endDate: string | null;
    status: string;
    comission_folio: string | null;
    inspections: InspectionData[]; // Array de todas las inspecciones (fotos, firmas, comentarios)
}

// FichaGuardada, usando PassDetails
interface FichaGuardada extends FichaData {
    id: number; // ID de la Comission en BD
    folio: string;
    fechaCreacion: string;
    estado: 'creada' | 'con-entrada' | 'con-salida' | 'completada';

    // Datos mínimos del pase (solo para saber si existe y su ID)
    salidaData?: {
        pass_id?: number;
        // Eliminamos los campos redundantes (fotos, firmas, km)
        // ya que ahora se cargan vía passDetails
    } & any;

    entradaData?: {
        // Eliminamos los campos redundantes
    } & any;

    // 🟢 ESTE CAMPO ALMACENARÁ TODA LA EVIDENCIA (fotos, firmas, comentarios)
    passDetails: PassDetails | null;
}

// Legacy interface for compatibility
interface ComisionData {
    folio: string;
    destinos: Destino[];
    fechaSalida: string;
    horaSalida: string;
    fechaEntrega: string;
    horaEntrega: string;
    conductor: string;
    vehiculo: string;
}

interface Driver {
    value: string;
    label: string;
    cargo?: string;
}

interface Vehicle {
    value: string;
    label: string;
    marca?: string;
    modelo?: string;
    color?: string;
    año?: string;
}

// API data will be loaded dynamically

const INITIAL_DRIVERS: Driver[] = [
    { value: 'nancy-godinez', label: 'Nancy Godínez', cargo: 'Chofer' },
    { value: 'oscar-perez', label: 'Oscar Pérez', cargo: 'Técnico' },
    { value: 'dulce-lopez', label: 'Dulce Jimena López', cargo: 'Supervisora' },
    { value: 'bladimir-rivera', label: 'Bladimir Rivera', cargo: 'Operador' },
    { value: 'omar-pillardo', label: 'Omar Pillardo', cargo: 'Chofer' }
];

const INITIAL_VEHICLES: Vehicle[] = [
    { value: 'toyota-hilux', label: 'Toyota Hilux', marca: 'Toyota', modelo: 'Hilux', color: 'Blanco', año: '2023' },
    { value: 'ford-f150', label: 'Ford F-150', marca: 'Ford', modelo: 'F-150', color: 'Azul', año: '2022' },
    { value: 'nissan-sentra', label: 'Nissan Sentra', marca: 'Nissan', modelo: 'Sentra', color: 'Gris', año: '2024' },
    { value: 'chevrolet-aveo', label: 'Chevrolet Aveo', marca: 'Chevrolet', modelo: 'Aveo', color: 'Rojo', año: '2021' }
];

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<'login' | 'dashboard' | 'crear-ficha' | 'detalle-ficha' | 'formulario-entrada' | 'formulario-salida' | 'confirmacion' | 'registro-entrada' | 'resumen-entrada' | 'envio-correo'>('login');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [fichaData, setFichaData] = useState<FichaData>({
        folio: '',
        conductorNombre: '',
        conductorCargo: '',
        vehiculo: '',
        destinos: []
    });

    // Estado para fichas guardadas
    const [fichasGuardadas, setFichasGuardadas] = useState<FichaGuardada[]>([]);
    const [selectedFicha, setSelectedFicha] = useState<FichaGuardada | null>(null);

    // Estado para datos de entrada temporal
    const [tempEntradaData, setTempEntradaData] = useState<any>(null);

    // Estado legacy para compatibilidad
    const [formData, setFormData] = useState<ComisionData>({
        folio: '',
        destinos: [],
        fechaSalida: '',
        horaSalida: '',
        fechaEntrega: '',
        horaEntrega: '',
        conductor: '',
        vehiculo: ''
    });
    const [comisionesGuardadas, setComisionesGuardadas] = useState<any[]>([]);
    const [selectedComision, setSelectedComision] = useState<any>(null);

    // Estados y ciudades de la API de Copomex
    const [estados, setEstados] = useState<{value: string, label: string, codigo?: string}[]>([]);
    const [ciudades, setCiudades] = useState<{[key: string]: {value: string, label: string}[]}>({});
    const [loadingEstados, setLoadingEstados] = useState(false);
    const [loadingCiudades, setLoadingCiudades] = useState<{[key: string]: boolean}>({});

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
    const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
    const [isAddDestinoModalOpen, setIsAddDestinoModalOpen] = useState(false);
    const [editingDestino, setEditingDestino] = useState<Destino | null>(null);
    const [dateError, setDateError] = useState<string>('');
    const [showValidationErrors, setShowValidationErrors] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPhotosModal, setShowPhotosModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [selectedSignatureType, setSelectedSignatureType] = useState<'conductor' | 'aprobador' | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [tempCargoInput, setTempCargoInput] = useState('');

    // Cargar datos iniciales desde la BD al montar la app
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                console.log('🔄 Cargando datos iniciales desde la BD...');

                // Cargar drivers
                const driversResponse = await driversAPI.list();
                const driversData = driversResponse.data.map((d: any) => ({
                    value: d.name.toLowerCase().replace(/\s+/g, '-'),
                    label: d.name,
                    cargo: d.position,
                    id: d.id
                }));
                setDrivers(driversData);

                // Cargar vehicles
                const vehiclesResponse = await vehiclesAPI.list();
                const vehiclesData = vehiclesResponse.data.map((v: any) => ({
                    value: `${v.brand}-${v.model}`.toLowerCase().replace(/\s+/g, '-'),
                    label: `${v.brand} ${v.model}`,
                    marca: v.brand,
                    modelo: v.model,
                    color: v.color,
                    año: v.year?.toString(),
                    id: v.id
                }));
                setVehicles(vehiclesData);

                // Cargar fichas guardadas
                const fichasResponse = await comissionsAPI.list();
                setFichasGuardadas(fichasResponse.data as FichaGuardada[]);

                toast.success('Datos cargados desde la base de datos');
            } catch (error) {
                console.error('❌ Error al cargar datos iniciales:', error);
                toast.error('Error al cargar datos iniciales desde la BD');
            }
        };

        loadInitialData();

        const generateFolio = () => {
            const currentCounter = parseInt(localStorage.getItem('folioCounter') || '1', 10);
            const number = currentCounter.toString().padStart(4, '0');
            localStorage.setItem('folioCounter', (currentCounter + 1).toString());
            return `PV-${number}`;
        };

        setFichaData(prev => ({
            ...prev,
            folio: generateFolio()
        }));
    }, []);

    // Cargar detalles del pase (evidencias) al ver una ficha
    useEffect(() => {
        const fetchPassDetails = async () => {
            if (currentScreen !== 'detalle-ficha' || !selectedFicha) {
                return;
            }

            const passId = selectedFicha.salidaData?.pass_id;

            // No hacer nada si no hay passId o si los detalles ya están cargados
            if (!passId || selectedFicha.passDetails) {
                return;
            }

            try {
                toast.info('Cargando evidencias de la ficha...');
                const response = await passAPI.getDetails(passId);

                if (response.data.success) {
                    const passDetails = response.data.pass;

                    // Actualizar la ficha en el estado global y en la ficha seleccionada
                    const updatedFichas = fichasGuardadas.map(f =>
                        f.folio === selectedFicha.folio
                            ? { ...f, passDetails }
                            : f
                    );
                    setFichasGuardadas(updatedFichas);
                    setSelectedFicha(prev => (prev ? { ...prev, passDetails } : null));

                    toast.success('Evidencias cargadas correctamente.');
                } else {
                    throw new Error(response.data.message || 'Respuesta no exitosa de la API');
                }
            } catch (error) {
                console.error('❌ Error al cargar los detalles del pase:', error);
                toast.error('No se pudieron cargar las evidencias (fotos, firmas).');
            }
        };

        fetchPassDetails();
    }, [currentScreen, selectedFicha]);


    // Estados completos de México con códigos numéricos para la API
    useEffect(() => {
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
    }, []);

    // Función helper para guardar fichas en localStorage con manejo de QuotaExceeded
    const saveFichasToLocalStorage = (fichas: FichaGuardada[]) => {
        const MAX_FICHAS = 10; // Límite de fichas para evitar exceder quota

        try {
            // Ordenar por fecha de creación (más recientes primero)
            const fichasOrdenadas = [...fichas].sort((a, b) =>
                new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
            );

            // Limitar a las últimas MAX_FICHAS
            const fichasLimitadas = fichasOrdenadas.slice(0, MAX_FICHAS);

            // Intentar guardar
            localStorage.setItem('fichasGuardadas', JSON.stringify(fichasLimitadas));

            // Si tuvimos que eliminar fichas antiguas, notificar
            if (fichasOrdenadas.length > MAX_FICHAS) {
                const eliminadas = fichasOrdenadas.length - MAX_FICHAS;
                toast.info(`Se eliminaron ${eliminadas} ficha(s) antigua(s) para liberar espacio`);
            }

            return fichasLimitadas;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                // Si aún así excedemos la quota, intentar con menos fichas
                console.warn('QuotaExceededError: Reduciendo número de fichas...');

                const fichasReducidas = fichas.slice(0, Math.max(1, Math.floor(MAX_FICHAS / 2)));
                try {
                    localStorage.setItem('fichasGuardadas', JSON.stringify(fichasReducidas));
                    toast.warning(`Espacio insuficiente. Se guardaron solo las ${fichasReducidas.length} fichas más recientes`);
                    return fichasReducidas;
                } catch (secondError) {
                    console.error('Error crítico al guardar fichas:', secondError);
                    toast.error('No hay espacio suficiente. Por favor elimina fichas antiguas');
                    return fichas; // Retornar las fichas sin guardar
                }
            } else {
                console.error('Error saving fichas:', error);
                toast.error('Error al guardar la ficha');
                return fichas;
            }
        }
    };

    const updateFichaData = (field: keyof FichaData, value: string | Destino[]) => {
        setFichaData(prev => ({ ...prev, [field]: value }));

        // Clear validation errors when user starts filling fields
        if (showValidationErrors && value) {
            setShowValidationErrors(false);
        }
    };

    const handleDriverAdded = (newDriver: Driver) => {
        setDrivers(prev => [...prev, newDriver]);
        // Actualizar nombre y cargo del conductor en la ficha
        setFichaData(prev => ({
            ...prev,
            conductorNombre: newDriver.label,
            conductorCargo: newDriver.cargo || ''
        }));
        toast.success('Conductor agregado correctamente');
    };

    const handleVehicleAdded = (newVehicle: Vehicle) => {
        setVehicles(prev => [...prev, newVehicle]);
        // Seleccionar automáticamente el vehículo recién creado
        setFichaData(prev => ({
            ...prev,
            vehiculo: newVehicle.value
        }));
        toast.success('Vehículo agregado correctamente');
    };

    const handleLogin = () => {
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
    };

    const handleDestinoAdded = (destino: Destino) => {
        if (editingDestino) {
            // Update existing destino
            setFichaData(prev => ({
                ...prev,
                destinos: prev.destinos.map(d => d.id === destino.id ? destino : d)
            }));
            setEditingDestino(null);
        } else {
            // Add new destino
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
            console.log('🔍 Datos de ficha:', fichaData);
            console.log('🔍 Drivers disponibles:', drivers);
            console.log('🔍 Vehicles disponibles:', vehicles);

            // Buscar IDs del conductor y vehículo
            const driver = drivers.find(d => d.label === fichaData.conductorNombre);
            const vehicle = vehicles.find(v => v.value === fichaData.vehiculo);

            console.log('🔍 Driver encontrado:', driver);
            console.log('🔍 Vehicle encontrado:', vehicle);

            if (!driver?.id || !vehicle?.id) {
                console.error('❌ Driver o vehicle sin ID');
                toast.error('Error: conductor o vehículo no encontrado. Verifica que se hayan cargado desde la BD');
                return;
            }

            // Obtener user_id del localStorage (asumiendo que se guardó en el login)
            const userId = 1; // TODO: Obtener del contexto de usuario logueado

            // Crear comisión en la BD
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

                // Guardar destinos en la BD
                for (const destino of fichaData.destinos) {
                    await placesAPI.create({
                        comission_id: comissionId,
                        city: destino.ciudad,
                        state: destino.estado,
                        comment: destino.comentario
                    });
                }

                // Crear ficha local para mantener compatibilidad con la UI
                const nuevaFicha: FichaGuardada = {
                    ...fichaData,
                    id: comissionId,
                    folio: comissionResponse.data.comission.folio.toString(),
                    fechaCreacion: comissionResponse.data.comission.created_at,
                    estado: 'creada',
                    passDetails: null
                };

                const fichasActualizadas = [...fichasGuardadas, nuevaFicha];
                setFichasGuardadas(fichasActualizadas);

                // Seleccionar la nueva ficha y navegar a detalles
                setSelectedFicha(nuevaFicha);
                toast.success('Ficha guardada en la base de datos');
                setCurrentScreen('detalle-ficha');
            }
        } catch (error) {
            console.error('Error al guardar ficha:', error);
            toast.error('Error al guardar la ficha');
        }
    };

    const handleGoToEntrada = () => {
        setCurrentScreen('formulario-entrada');
    };

    const handleGoToSalida = () => {
        setCurrentScreen('formulario-salida');
    };

    const handleSalidaComplete = async (salidaData: any) => {
        if (!selectedFicha || !selectedFicha.folio) {
            console.error('Error: selectedFicha no está definida o le falta el folio.');
            toast.error("Error", { description: "No se pudo obtener el Folio de la Ficha para el registro de Salida." });
            return;
        }

        try {
            const comissionFolio = selectedFicha.folio.replace('PV-', '');

            const payload = {
                comission_id: comissionFolio,
                mileage: parseInt(salidaData.kmSalida?.replace(/,/g, '') || '0'),
                fuel: salidaData.combustible?.toString() || '8',
                departure_comment: salidaData.departure_comment || '',
                start_date: new Date().toISOString(),
                signature_conductor: salidaData.firmaConductor || null,
                signature_approver: salidaData.firmaAprobador || null,
                inspections: [
                    salidaData.fotos?.fotoKilometraje ? {
                        type: 'photo',
                        part: 'mileage',
                        photo: salidaData.fotos.fotoKilometraje,
                        comment: salidaData.kmComentario
                    } : null,
                    salidaData.fotos?.fotoFrontal ? { type: 'photo', part: 'front', photo: salidaData.fotos.fotoFrontal } : null,
                    salidaData.fotos?.fotoLatDer ? { type: 'photo', part: 'right_side', photo: salidaData.fotos.fotoLatDer } : null,
                    salidaData.fotos?.fotoLatIzq ? { type: 'photo', part: 'left_side', photo: salidaData.fotos.fotoLatIzq } : null,
                    salidaData.fotos?.fotoPosterior ? { type: 'photo', part: 'back', photo: salidaData.fotos.fotoPosterior } : null,
                    ...(salidaData.fotosInteriores || []).map((interior: any) => interior.foto ? {
                        type: 'photo',
                        part: 'interior',
                        photo: interior.foto,
                        comment: interior.tipo,
                    } : null),
                ].filter(Boolean),
            };

            const response = await passAPI.salida(payload);
            const passId = response.data.pass_id;

            if (!passId) {
                throw new Error("El servidor no devolvió el ID del Pase creado.");
            }

            const newSalidaData = { ...salidaData, pass_id: passId };

            const fichasActualizadas = fichasGuardadas.map(ficha => {
                if (ficha.folio === selectedFicha.folio) {
                    const nuevoEstado = ficha.entradaData ? 'completada' : 'con-salida';
                    return { ...ficha, estado: nuevoEstado as const, salidaData: newSalidaData };
                }
                return ficha;
            });

            setFichasGuardadas(fichasActualizadas);

            const fichaActualizada = fichasActualizadas.find(f => f.folio === selectedFicha.folio);
            if (fichaActualizada) {
                setSelectedFicha(fichaActualizada);
            }

            toast.success('Salida registrada en la base de datos');
            setCurrentScreen('detalle-ficha');
        } catch (error) {
            console.error('Error al registrar salida:', error);
            toast.error('Error al registrar la salida');
        }
    };

    const handleEntradaComplete = async (entradaData: any) => {
        const passId = selectedFicha?.salidaData?.pass_id;

        if (!passId) {
            console.error('Error: El ID del Pase (pass_id) no se encontró en la ficha seleccionada.');
            toast.error("Error", { description: "Falta el ID del Pase (Pass) para registrar la entrada." });
            return;
        }

        try {
            const payload = {
                pass_id: passId,
                end_date: new Date().toISOString(),
                mileage: parseInt(entradaData.kmEntrada?.replace(/,/g, '') || '0'),
                fuel: entradaData.combustible?.toString() || '8',
                arrival_comment: entradaData.arrival_comment || '',
                signature_conductor: entradaData.firmaConductor || null,
                signature_approver: entradaData.firmaAprobador || null,
                inspections: [
                    entradaData.fotos?.fotoKilometraje ? {
                        type: 'photo',
                        part: 'mileage_entry',
                        photo: entradaData.fotos.fotoKilometraje,
                        comment: entradaData.kmComentario
                    } : null,
                    entradaData.fotos?.fotoFrontal ? { type: 'photo', part: 'front_entry', photo: entradaData.fotos.fotoFrontal } : null,
                    entradaData.fotos?.fotoLatDer ? { type: 'photo', part: 'right_side_entry', photo: entradaData.fotos.fotoLatDer } : null,
                    entradaData.fotos?.fotoLatIzq ? { type: 'photo', part: 'left_side_entry', photo: entradaData.fotos.fotoLatIzq } : null,
                    entradaData.fotos?.fotoPosterior ? { type: 'photo', part: 'back_entry', photo: entradaData.fotos.fotoPosterior } : null,
                    ...(entradaData.fotosInteriores || []).map((interior: any) => interior.foto ? {
                        type: 'photo',
                        part: 'interior_entry',
                        photo: interior.foto,
                        comment: interior.tipo,
                    } : null),
                ].filter(Boolean),
            };

            await passAPI.entrada(payload);

            const fichasActualizadas = fichasGuardadas.map(ficha => {
                if (ficha.folio === selectedFicha.folio) {
                    const nuevoEstado = 'completada';
                    return { ...ficha, estado: nuevoEstado as const, entradaData };
                }
                return ficha;
            });

            setFichasGuardadas(fichasActualizadas);

            const fichaActualizada = fichasActualizadas.find(f => f.folio === selectedFicha.folio);
            if (fichaActualizada) {
                setSelectedFicha(fichaActualizada);
            }

            toast.success('Entrada registrada en la base de datos');
            setCurrentScreen('detalle-ficha');
        } catch (error) {
            console.error('Error al registrar entrada:', error);
            toast.error('Error al registrar la entrada');
        }
    };

    // Load ciudades for a specific estado using exact Copomex API
    const loadCiudadesForEstado = async (estadoValue: string, estadoLabel: string) => {
        if (!estadoValue || ciudades[estadoValue]) return;

        setLoadingCiudades(prev => ({ ...prev, [estadoValue]: true }));

        try {
            // Encontrar el código del estado
            const estado = estados.find(e => e.value === estadoValue);
            const estadoCodigo = estado?.codigo;

            if (!estadoCodigo) {
                console.error(`❌ Código de estado no encontrado para: ${estadoValue}`);
                throw new Error(`Código de estado no encontrado para ${estadoValue}`);
            }

            console.log(`🚀 Cargando ciudades para: ${estadoLabel} (código: ${estadoCodigo})`);

            // Usar la API exacta proporcionada por el usuario
            const apiUrl = `https://api.copomex.com/query/getCitiesByStateCode/${estadoCodigo}?token=pruebas`;
            console.log(`📡 URL de API: ${apiUrl}`);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(`📦 Respuesta completa de la API:`, data);

            // Verificar diferentes estructuras posibles de respuesta
            let ciudadesList = [];

            if (data.response && data.response.ciudades && Array.isArray(data.response.ciudades)) {
                console.log(`✅ Estructura encontrada: data.response.ciudades (${data.response.ciudades.length} códigos)`);

                // Verificar si son códigos hash (contienen caracteres aleatorios)
                const firstItem = data.response.ciudades[0];
                const isHashCode = typeof firstItem === 'string' &&
                    (firstItem.length < 25 && /^[A-Za-z0-9]+$/.test(firstItem) &&
                        !/^[A-Za-z\s]+$/.test(firstItem));

                if (isHashCode) {
                    console.log(`🔄 API devuelve códigos hash, usando fallback data para ${estadoLabel}`);
                    // No lanzar error, usar directamente fallback
                } else {
                    // Si no son códigos hash, procesarlos como nombres de ciudades
                    ciudadesList = data.response.ciudades.map(codigo => ({ city: codigo }));
                }
            } else if (data.response && data.response.cities && Array.isArray(data.response.cities)) {
                console.log(`✅ Estructura encontrada: data.response.cities (${data.response.cities.length} ciudades)`);
                ciudadesList = data.response.cities;
            } else if (data.cities && Array.isArray(data.cities)) {
                console.log(`✅ Estructura encontrada: data.cities (${data.cities.length} ciudades)`);
                ciudadesList = data.cities;
            } else if (Array.isArray(data)) {
                console.log(`✅ Estructura encontrada: data directa (${data.length} ciudades)`);
                ciudadesList = data;
            } else {
                console.error(`❌ Estructura de respuesta no reconocida:`, data);
                throw new Error('Estructura de respuesta de API no válida');
            }

            // Procesar ciudades solo si tenemos datos válidos
            if (ciudadesList.length > 0) {
                const ciudadesFormatted = ciudadesList.map((ciudad: any) => {
                    // Manejar diferentes formatos de ciudad en la respuesta
                    const cityName = ciudad.city || ciudad.name || ciudad.municipio || ciudad;

                    if (typeof cityName !== 'string') {
                        console.warn(`⚠️ Formato de ciudad no válido:`, ciudad);
                        return null;
                    }

                    return {
                        value: cityName.toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[áàäâ]/g, 'a')
                            .replace(/[éèëê]/g, 'e')
                            .replace(/[íìïî]/g, 'i')
                            .replace(/[óòöô]/g, 'o')
                            .replace(/[úùüû]/g, 'u')
                            .replace(/ñ/g, 'n')
                            .replace(/[^a-z0-9-]/g, ''),
                        label: cityName
                    };
                }).filter(Boolean); // Remover entradas null

                // Remover duplicados y ordenar
                const ciudadesUnicas = ciudadesFormatted.filter((ciudad, index, self) =>
                    index === self.findIndex(c => c.value === ciudad.value)
                );

                if (ciudadesUnicas.length > 0) {
                    console.log(`🎯 Ciudades procesadas para ${estadoLabel}: ${ciudadesUnicas.length}`);
                    console.log(`🏙️ Primeras ciudades:`, ciudadesUnicas.slice(0, 5).map(c => c.label));

                    setCiudades(prev => ({
                        ...prev,
                        [estadoValue]: ciudadesUnicas.sort((a, b) => a.label.localeCompare(b.label))
                    }));

                    return; // Salir exitosamente si procesamos ciudades reales
                }
            }

            // Si llegamos aquí, usar fallback data sin mostrar errores
            console.log(`🔄 Usando fallback data para ${estadoLabel}`);
            throw new Error('Using fallback data');

        } catch (error) {
            // Solo loggear errores reales, no cuando usamos fallback intencionalmente
            if (error.message !== 'Using fallback data') {
                console.error(`❌ Error loading ciudades for ${estadoLabel}:`, error);
            }

            // Fallback data completo para todos los estados mexicanos
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

            console.log(`🔄 Usando fallback data para ${estadoLabel}: ${fallback.length} ciudades`);

            setCiudades(prev => ({
                ...prev,
                [estadoValue]: fallback
            }));
        } finally {
            setLoadingCiudades(prev => ({ ...prev, [estadoValue]: false }));
        }
    };

    const getCiudadOptions = (estadoValue: string) => {
        if (!estadoValue) return [];
        return ciudades[estadoValue] || [];
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

    const getEstadoLabel = (value: string) => {
        const estado = estados.find(e => e.value === value);
        return estado ? estado.label : value;
    };

    const getCiudadLabel = (estadoValue: string, ciudadValue: string) => {
        const ciudadOptions = getCiudadOptions(estadoValue);
        const ciudad = ciudadOptions.find(c => c.value === ciudadValue);
        return ciudad ? ciudad.label : ciudadValue;
    };

    const getDestinosText = () => {
        if (fichaData.destinos.length === 0) return 'Sin destinos';
        return fichaData.destinos.map(d => `${getEstadoLabel(d.estado)}, ${getCiudadLabel(d.estado, d.ciudad)}`).join(' • ');
    };

    const handleBackToFormulario = () => {
        setCurrentScreen('dashboard');
    };

    const handleCreateNewFicha = () => {
        // Reset selected ficha
        setSelectedFicha(null);

        // Reset ficha data completely
        setFichaData({
            folio: '',
            conductorNombre: '',
            conductorCargo: '',
            vehiculo: '',
            destinos: []
        });

        // Generate new folio
        const generateFolio = () => {
            const currentCounter = parseInt(localStorage.getItem('folioCounter') || '1', 10);
            const number = currentCounter.toString().padStart(4, '0');
            localStorage.setItem('folioCounter', (currentCounter + 1).toString());
            return `PV-${number}`;
        };

        // Set new folio
        setFichaData(prev => ({
            ...prev,
            folio: generateFolio()
        }));

        // Reset validation errors
        setShowValidationErrors(false);

        // Go to crear ficha screen
        setCurrentScreen('crear-ficha');
    };

    const handleSelectFicha = (ficha: FichaGuardada) => {
        setSelectedFicha(ficha);
        setFichaData({
            folio: ficha.folio,
            conductorNombre: ficha.conductorNombre,
            conductorCargo: ficha.conductorCargo,
            vehiculo: ficha.vehiculo || '',
            destinos: ficha.destinos
        });
    };

    const handleGoToDetailFromSelected = () => {
        if (!selectedFicha) return;
        setCurrentScreen('detalle-ficha');
    };

    const handleBackToDashboard = () => {
        setCurrentScreen('dashboard');
    };

    const handleGoToResumenEntrada = (entradaData?: any) => {
        // Guardar datos de entrada temporalmente
        if (entradaData) {
            setTempEntradaData(entradaData);
        }

        setCurrentScreen('resumen-entrada');
    };

    const handleSendResumeToEmail = (email: string) => {
        // Actualizar la comisión con los datos de entrada
        if (tempEntradaData && tempEntradaData.kmEntrada && tempEntradaData.combustible !== undefined && tempEntradaData.firmaConductor && tempEntradaData.firmaAprobador) {
            const comisionesActualizadas = comisionesGuardadas.map(comision =>
                comision.folio === formData.folio
                    ? {
                        ...comision,
                        estado: 'con-entrada' as const,
                        entradaData: {
                            kmEntrada: tempEntradaData.kmEntrada,
                            combustible: tempEntradaData.combustible,
                            firmaConductor: tempEntradaData.firmaConductor,
                            firmaAprobador: tempEntradaData.firmaAprobador,
                            fotosFechas: new Date().toLocaleDateString('es-MX')
                        }
                    }
                    : comision
            );

            setComisionesGuardadas(comisionesActualizadas);

            // Actualizar selectedComision si es la misma comisión
            if (selectedComision && selectedComision.folio === formData.folio) {
                const comisionActualizada = comisionesActualizadas.find(c => c.folio === formData.folio);
                if (comisionActualizada) {
                    setSelectedComision(comisionActualizada);
                }
            }

            // Guardar en localStorage
            try {
                localStorage.setItem('comisionesGuardadas', JSON.stringify(comisionesActualizadas));
            } catch (error) {
                console.error('Error updating comision with entrada data:', error);
            }
        }

        // Ir a envío de correo con el email del destinatario
        setCurrentScreen('envio-correo');
    };

    const handleGoToEnvioCorreo = (entradaData?: any) => {
        // Funcionalidad legacy para mantener compatibilidad
        handleGoToResumenEntrada(entradaData);
    };

    const handleBackToRegistroEntrada = () => {
        setCurrentScreen('registro-entrada');
    };

    const handleBackToResumenEntrada = () => {
        setCurrentScreen('resumen-entrada');
    };

    const handleCompleteFlow = () => {
        // Actualizar estado de la comisión a 'enviada' (completamente terminada)
        const comisionesActualizadas = comisionesGuardadas.map(comision =>
            comision.folio === formData.folio
                ? { ...comision, estado: 'enviada' as const }
                : comision
        );

        setComisionesGuardadas(comisionesActualizadas);

        // Guardar en localStorage
        try {
            localStorage.setItem('comisionesGuardadas', JSON.stringify(comisionesActualizadas));
        } catch (error) {
            console.error('Error updating comision state:', error);
        }

        // Reset form and go back to dashboard
        setFormData({
            folio: '',
            destinos: [],
            fechaSalida: '',
            horaSalida: '',
            fechaEntrega: '',
            horaEntrega: '',
            conductor: '',
            vehiculo: ''
        });

        // Generate new folio
        const generateFolio = () => {
            const currentCounter = parseInt(localStorage.getItem('folioCounter') || '1', 10);
            const number = currentCounter.toString().padStart(4, '0');
            localStorage.setItem('folioCounter', (currentCounter + 1).toString());
            return `PV-${number}`;
        };

        setFormData(prev => ({
            ...prev,
            folio: generateFolio()
        }));

        setCurrentScreen('dashboard');
        toast.success('Proceso completado. Puedes crear una nueva comisión.');
    };

    const [fichaToDelete, setFichaToDelete] = useState<string | null>(null);

    const handleOpenDeleteModal = (folio: string) => {
        setFichaToDelete(folio);
        setShowDeleteModal(true);
    };

    const handleDeleteFicha = async () => {
        if (!fichaToDelete) return;

        try {
            // Llamar a la API para el borrado lógico
            const response = await comissionsAPI.delete(fichaToDelete);

            if (response.data.success) {
                // Filtrar la ficha eliminada del estado local
                const fichasActualizadas = fichasGuardadas.filter(ficha => ficha.folio !== fichaToDelete);
                setFichasGuardadas(fichasActualizadas);

                // Si la ficha eliminada era la seleccionada, deseleccionar
                if (selectedFicha?.folio === fichaToDelete) {
                    setSelectedFicha(null);
                }

                toast.success(`Ficha ${fichaToDelete} eliminada correctamente`);
            } else {
                throw new Error(response.data.message || 'Error en la respuesta de la API');
            }
        } catch (error) {
            console.error('Error al eliminar la ficha:', error);
            toast.error('Error al eliminar la ficha');
        } finally {
            // Cerrar modal y limpiar estado
            setShowDeleteModal(false);
            setFichaToDelete(null);
        }
    };

    // Funciones legacy para compatibilidad
    const getSelectedDriverName = () => {
        return fichaData.conductorNombre || 'N/A';
    };

    const getSelectedVehicleName = (vehicleValue?: string) => {
        const value = vehicleValue || fichaData.vehiculo;
        const vehicle = vehicles.find(v => v.value === value);
        return vehicle ? vehicle.label : 'N/A';
    };

    const handleSave = () => {
        handleSaveFicha();
    };

    const updateFormData = (field: keyof ComisionData, value: any) => {
        // Legacy function for compatibility
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <AnimatePresence mode="wait">
            {currentScreen === 'login' ? (
                <div key="login">
                    <Login onLogin={handleLogin} />
                </div>
            ) : currentScreen === 'dashboard' ? (
                <div key="dashboard">
                    <div className="min-h-screen bg-gray-50 pb-24">
                        {/* Safe Area Top */}
                        <div className="h-12 bg-[rgba(0,0,0,1)]"></div>

                        {/* Header */}
                        <div className="space-y-0">
                            {/* Logo header with black background */}
                            <div className="bg-black py-8 px-4 px-[16px] py-[5px]">
                                <div className="flex items-center justify-center">
                                    <img
                                        src={grupoOptimoLogo}
                                        alt="GRUPO OPTIMO"
                                        className="h-12 w-auto object-contain px-[54px] py-[0px]"
                                    />
                                </div>
                            </div>

                            {/* Title section */}
                            <div className="bg-white px-4 py-4 border-b border-gray-200">
                                <h1 className="text-black text-center text-xl">Fichas</h1>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-w-[360px] mx-auto px-4 py-6 space-y-4">

                            {/* Fichas Guardadas */}
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
                                            {/* Botón de eliminar */}
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
                                                        <p className="text-gray-500 text-sm">Conductor</p>
                                                        <p className="text-black">{ficha.conductorNombre}</p>
                                                        <p className="text-gray-400 text-sm">{ficha.conductorCargo}</p>
                                                        {ficha.vehiculo && (
                                                            <p className="text-gray-400 text-sm">{getSelectedVehicleName(ficha.vehiculo)}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-black">{ficha.folio}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Estado de la ficha */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${
                                                            ficha.estado === 'creada' ? 'bg-blue-500' :
                                                                ficha.estado === 'con-entrada' ? 'bg-green-500' :
                                                                    ficha.estado === 'con-salida' ? 'bg-orange-500' :
                                                                        'bg-gray-500'
                                                        }`}></div>
                                                        <p className="text-sm text-gray-600">
                                                            {ficha.estado === 'creada' ? 'Ficha creada' :
                                                                ficha.estado === 'con-entrada' ? 'Con entrada registrada' :
                                                                    ficha.estado === 'con-salida' ? 'Con salida registrada' :
                                                                        'Completada'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 bg-[rgba(225,225,225,1)]"
                                                        onClick={() => {
                                                            setSelectedFicha(ficha);
                                                            setFichaData({
                                                                folio: ficha.folio,
                                                                conductorNombre: ficha.conductorNombre,
                                                                conductorCargo: ficha.conductorCargo,
                                                                vehiculo: ficha.vehiculo || '',
                                                                destinos: ficha.destinos
                                                            });
                                                            setCurrentScreen('detalle-ficha');
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

                        {/* Sticky CTA */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
                            <div className="max-w-[360px] mx-auto">
                                <Button
                                    className="w-full h-12"
                                    style={{
                                        backgroundColor: '#000000 !important',
                                        color: '#ffffff !important',
                                        border: '1px solid #000000 !important',
                                        boxShadow: 'none !important'
                                    }}
                                    onClick={handleCreateNewFicha}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear ficha
                                </Button>
                            </div>
                        </div>

                        {/* Delete Confirmation Modal */}
                        {showDeleteModal && (
                            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                                <DialogContent className="max-w-[320px] rounded-lg">
                                    <DialogHeader>
                                        <DialogTitle>Eliminar ficha</DialogTitle>
                                        <DialogDescription>
                                            Se eliminará permanentemente la información.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setShowDeleteModal(false);
                                                    setFichaToDelete(null);
                                                }}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                onClick={handleDeleteFicha}
                                            >
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}

                        {/* Details Modal */}
                        {showDetailsModal && (
                            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                                <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Detalles de la comisión</DialogTitle>
                                        <DialogDescription>
                                            Información completa de la comisión incluyendo datos de salida, entrada y ruta
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Folio</p>
                                                <p className="text-black">{formData.folio}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Conductor</p>
                                                <p className="text-black">{getSelectedDriverName()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Vehículo</p>
                                                <p className="text-black">{getSelectedVehicleName()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Salida</p>
                                                <p className="text-black">{formData.fechaSalida}</p>
                                                <p className="text-gray-400 text-xs">{formData.horaSalida}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Entrega</p>
                                                <p className="text-black">{formData.fechaEntrega}</p>
                                                <p className="text-gray-400 text-xs">{formData.horaEntrega}</p>
                                            </div>
                                        </div>

                                        {/* Información de la comisión */}
                                        <div className="border-t pt-4">
                                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-2 w-2 bg-black rounded-full"></div>
                                                    <p className="text-black">Detalles de la comisión</p>
                                                </div>

                                                {/* Ruta programada */}
                                                <div className="mb-4 pb-3 border-b border-gray-200">
                                                    <p className="text-gray-600 text-sm mb-2">Ruta programada</p>
                                                    <div className="space-y-2">
                                                        {formData.destinos.map((destino, index) => (
                                                            <div key={destino.id} className="bg-white rounded-lg p-3 border border-gray-300">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-xs">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-700 text-sm">{getEstadoLabel(destino.estado)}, {getCiudadLabel(destino.estado, destino.ciudad)}</span>
                                                                        {destino.comentario && (
                                                                            <p className="text-xs text-gray-500">{destino.comentario}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Estado de la comisión */}
                                                <div className="text-center">
                                                    <p className="text-gray-600 text-sm">Estado actual</p>
                                                    <p className="text-black">
                                                        {selectedComision?.estado === 'completada' ? 'Lista para registro de entrada' :
                                                            selectedComision?.estado === 'con-entrada' ? 'Entrada registrada' :
                                                                selectedComision?.estado === 'enviada' ? 'Comisión finalizada' :
                                                                    'Comisión guardada'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Información de entrada - siempre visible */}
                                        <div className="border-t pt-4">
                                            <div className={`rounded-lg p-4 mb-4 ${selectedComision?.entradaData ? 'bg-gray-50 border border-gray-400' : 'bg-gray-100 border border-gray-300'}`}>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className={`h-2 w-2 rounded-full ${selectedComision?.entradaData ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                                                    <p className="text-black">
                                                        {selectedComision?.entradaData ? 'Información de entrada registrada' : 'Información de entrada'}
                                                    </p>
                                                </div>

                                                {/* Kilómetros y Combustible */}
                                                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                                    <div>
                                                        <p className="text-gray-600">Kilómetros de entrada</p>
                                                        <p className="text-black">
                                                            {selectedComision?.entradaData?.kmEntrada ? `${selectedComision.entradaData.kmEntrada} km` : 'Pendiente de registro'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-600">Nivel de combustible</p>
                                                        <p className="text-black">
                                                            {selectedComision?.entradaData?.combustible !== undefined ? `${selectedComision.entradaData.combustible}/8` : 'Pendiente de registro'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Fotos del vehículo */}
                                                <div className="mb-4 pb-3 border-b border-gray-300">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-gray-600 text-sm">Evidencia fotográfica</p>
                                                        {selectedComision?.entradaData && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs h-7"
                                                                onClick={() => setShowPhotosModal(true)}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Ver fotos
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`rounded-lg p-3 border ${selectedComision?.entradaData ? 'bg-white border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors' : 'bg-gray-50 border-gray-300'}`}
                                                        onClick={() => {
                                                            if (selectedComision?.entradaData) {
                                                                setShowPhotosModal(true);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {selectedComision?.entradaData ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-black" />
                                                                    <span className="text-gray-700 text-sm">Fotos del vehículo capturadas</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="h-4 w-4 rounded-full border-2 border-gray-400"></div>
                                                                    <span className="text-gray-500 text-sm">Fotos del vehículo pendientes</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 ml-6">
                                                            {selectedComision?.entradaData ?
                                                                `Vehículo recibido con ${selectedComision.entradaData.kmEntrada} km y combustible ${selectedComision.entradaData.combustible}/8` :
                                                                'Estado general, carrocería y compartimientos'
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Firmas */}
                                                <div className="mb-4 pb-3 border-b border-gray-300">
                                                    <p className="text-gray-600 text-sm mb-2">
                                                        {selectedComision?.entradaData ? 'Firmas completadas' : 'Firmas requeridas'}
                                                    </p>
                                                    <div className="space-y-2">
                                                        <div
                                                            className={`rounded-lg p-3 border ${selectedComision?.entradaData ? 'bg-white border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors' : 'bg-gray-50 border-gray-300'}`}
                                                            onClick={() => {
                                                                if (selectedComision?.entradaData) {
                                                                    setSelectedSignatureType('conductor');
                                                                    setShowSignatureModal(true);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {selectedComision?.entradaData ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 text-black" />
                                                                        <span className="text-gray-700 text-sm">Firma del conductor</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="h-4 w-4 rounded-full border-2 border-gray-400"></div>
                                                                        <span className="text-gray-500 text-sm">Firma del conductor</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 ml-6">
                                                                {selectedComision?.entradaData ? 'Autorización y validación de entrega' : 'Pendiente de captura'}
                                                            </p>
                                                        </div>
                                                        <div
                                                            className={`rounded-lg p-3 border ${selectedComision?.entradaData ? 'bg-white border-gray-400 cursor-pointer hover:bg-gray-50 transition-colors' : 'bg-gray-50 border-gray-300'}`}
                                                            onClick={() => {
                                                                if (selectedComision?.entradaData) {
                                                                    setSelectedSignatureType('aprobador');
                                                                    setShowSignatureModal(true);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {selectedComision?.entradaData ? (
                                                                    <>
                                                                        <CheckCircle className="h-4 w-4 text-black" />
                                                                        <span className="text-gray-700 text-sm">Firma de quien aprueba</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="h-4 w-4 rounded-full border-2 border-gray-400"></div>
                                                                        <span className="text-gray-500 text-sm">Firma de quien aprueba</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-500 ml-6">
                                                                {selectedComision?.entradaData ? 'Autorización de recepción' : 'Pendiente de captura'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fecha y hora de registro */}
                                                {selectedComision?.entradaData?.fotosFechas ? (
                                                    <div className="text-center">
                                                        <p className="text-gray-600 text-sm">Registro completado</p>
                                                        <p className="text-gray-600 text-sm">{selectedComision.entradaData.fotosFechas}</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <p className="text-gray-500 text-sm">Registro pendiente</p>
                                                        <p className="text-gray-400 text-sm">Se completará al hacer la entrada</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Modal de Fotos */}
                                            {showPhotosModal && (
                                                <Dialog open={showPhotosModal} onOpenChange={setShowPhotosModal}>
                                                    <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>Evidencia fotográfica</DialogTitle>
                                                            <DialogDescription>
                                                                Fotos capturadas del vehículo durante la entrada
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {/* Fotos de ejemplo - en un caso real estas vendrían de selectedComision?.entradaData */}
                                                                {[
                                                                    { title: 'Estado general', description: 'Vista frontal del vehículo' },
                                                                    { title: 'Tablero', description: 'Instrumentos y controles' },
                                                                    { title: 'Lateral izquierdo', description: 'Carrocería y puertas' },
                                                                    { title: 'Lateral derecho', description: 'Carrocería y puertas' },
                                                                    { title: 'Parte trasera', description: 'Vista posterior' },
                                                                    { title: 'Interior', description: 'Asientos y compartimientos' }
                                                                ].map((foto, index) => (
                                                                    <div key={index} className="bg-gray-100 rounded-lg p-4 aspect-square flex flex-col items-center justify-center text-center border border-gray-300">
                                                                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center mb-2">
                                                                            <Eye className="h-4 w-4 text-white" />
                                                                        </div>
                                                                        <p className="text-xs text-gray-700 mb-1">{foto.title}</p>
                                                                        <p className="text-xs text-gray-500">{foto.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                                                                <p className="text-sm text-gray-700 mb-1">Información del registro</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Fotos capturadas el {selectedComision?.entradaData?.fotosFechas || new Date().toLocaleDateString('es-MX')}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Kilometraje: {selectedComision?.entradaData?.kmEntrada || 'N/A'} km
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Combustible: {selectedComision?.entradaData?.combustible || 'N/A'}/8
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}

                                            {/* Modal de Firmas */}
                                            {showSignatureModal && selectedSignatureType && (
                                                <Dialog open={showSignatureModal} onOpenChange={setShowSignatureModal}>
                                                    <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                {selectedSignatureType === 'conductor'
                                                                    ? 'Firma del conductor'
                                                                    : selectedSignatureType === 'aprobador'
                                                                        ? 'Firma de quien aprueba'
                                                                        : 'Firma requerida'}
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                {selectedSignatureType === 'conductor'
                                                                    ? 'Autorización y validación de entrega del vehículo'
                                                                    : selectedSignatureType === 'aprobador'
                                                                        ? 'Autorización de recepción del vehículo'
                                                                        : 'Captura de firma para validación del proceso'}
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="space-y-4">
                                                            {/* Área de firma simulada */}
                                                            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
                                                                <div className="bg-black text-white rounded-full p-3 mb-4">
                                                                    <CheckCircle className="h-6 w-6" />
                                                                </div>
                                                                <p className="text-gray-700 mb-2">Firma capturada</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {selectedSignatureType === 'conductor'
                                                                        ? `Firmado por: ${getSelectedDriverName()}`
                                                                        : 'Firmado por: Supervisor autorizado'
                                                                    }
                                                                </p>

                                                                {/* Línea de firma simulada */}
                                                                <div className="mt-6 w-full">
                                                                    <div className="bg-black h-0.5 w-3/4 mx-auto mb-2 opacity-80"></div>
                                                                    <div className="bg-black h-0.5 w-1/2 mx-auto mb-2 opacity-60"></div>
                                                                    <div className="bg-black h-0.5 w-2/3 mx-auto opacity-40"></div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-300">
                                                                <p className="text-sm text-gray-700 mb-1">Detalles de la firma</p>
                                                                <p className="text-xs text-gray-500">
                                                                    Fecha: {selectedComision?.entradaData?.fotosFechas || new Date().toLocaleDateString('es-MX')}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Folio: {formData.folio}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </div>

                                        <div className="border-t pt-4">
                                            <p className="text-gray-500 text-sm mb-2">Ruta</p>
                                            <div className="space-y-2">
                                                {formData.destinos.map((destino, index) => (
                                                    <div key={destino.id} className="text-sm">
                                                        <p className="text-black">
                                                            {index + 1}. {getEstadoLabel(destino.estado)}, {getCiudadLabel(destino.estado, destino.ciudad)}
                                                        </p>
                                                        {destino.comentario && (
                                                            <p className="text-gray-400 text-xs ml-3">{destino.comentario}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>
            ) : currentScreen === 'registro-entrada' ? (
                <div key="registro-entrada">
                    <RegistroEntrada
                        folio={formData.folio}
                        conductor={getSelectedDriverName()}
                        horaSalida={formData.horaSalida}
                        onBack={handleBackToDashboard}
                        onComplete={handleGoToResumenEntrada}
                        comisionData={{
                            destinos: formData.destinos,
                            fechaSalida: formData.fechaSalida,
                            fechaEntrega: formData.fechaEntrega,
                            horaEntrega: formData.horaEntrega,
                            vehiculo: getSelectedVehicleName()
                        }}
                    />
                </div>
            ) : currentScreen === 'crear-ficha' ? (
                <div key="crear-ficha">
                    <div className="min-h-screen bg-gray-50">
                        {/* Safe Area Top */}
                        <div className="h-12 bg-[rgba(0,0,0,1)]"></div>

                        {/* Header */}
                        <div className="space-y-0">
                            {/* Logo header with black background */}
                            <div className="bg-black px-[16px] py-[5px]">
                                <div className="flex items-center justify-center">
                                    <img
                                        src={grupoOptimoLogo}
                                        alt="GRUPO OPTIMO"
                                        className="h-12 w-auto object-contain px-[54px] py-[0px]"
                                    />
                                </div>
                            </div>

                            {/* Title section */}
                            <div className="bg-white px-4 py-4 border-b border-gray-200">
                                <h1 className="text-black text-center text-xl">Crear Ficha</h1>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto pb-40">
                            <div className="max-w-[360px] mx-auto px-4 py-6 space-y-6">

                                {/* Main Form */}
                                <div className="bg-white rounded-lg p-4 space-y-4">
                                    {/* Folio */}
                                    <div>
                                        <Label htmlFor="folio">Folio</Label>
                                        <Input
                                            id="folio"
                                            value={fichaData.folio}
                                            disabled
                                            className="mt-1 bg-gray-50"
                                        />
                                    </div>

                                    {/* Datos generales */}
                                    <div className="space-y-4">
                                        {/* Conductor */}
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.conductorNombre ? "text-destructive" : ""}>
                                                Nombre del conductor *
                                            </Label>
                                            <div className="mt-1 flex gap-2">
                                                <div className="flex-1">
                                                    <BottomSheetSelect
                                                        id="conductorNombre"
                                                        options={drivers}
                                                        value={drivers.find(d => d.label === fichaData.conductorNombre)?.value || ''}
                                                        onValueChange={handleConductorChange}
                                                        placeholder="Seleccionar conductor"
                                                    />
                                                </div>
                                                <Button
                                                    id="addConductorBtn"
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsAddDriverModalOpen(true)}
                                                    className="h-[42px] w-[42px] p-0 flex-shrink-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {showValidationErrors && !fichaData.conductorNombre && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>

                                        {/* Cargo */}
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.conductorCargo ? "text-destructive" : ""}>
                                                Cargo *
                                            </Label>
                                            <Input
                                                id="conductorCargo"
                                                value={fichaData.conductorCargo}
                                                onChange={(e) => updateFichaData('conductorCargo', e.target.value)}
                                                placeholder="Ingresa el cargo del conductor"
                                                className="mt-1"
                                            />
                                            {showValidationErrors && !fichaData.conductorCargo && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>

                                        {/* Vehículo */}
                                        <div>
                                            <Label className={showValidationErrors && !fichaData.vehiculo ? "text-destructive" : ""}>
                                                Vehículo *
                                            </Label>
                                            <div className="mt-1 flex gap-2">
                                                <div className="flex-1">
                                                    <BottomSheetSelect
                                                        id="vehiculo"
                                                        options={vehicles}
                                                        value={fichaData.vehiculo}
                                                        onValueChange={(value) => updateFichaData('vehiculo', value)}
                                                        placeholder="Seleccionar vehículo"
                                                    />
                                                </div>
                                                <Button
                                                    id="addVehiculoBtn"
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setIsAddVehicleModalOpen(true)}
                                                    className="h-[42px] w-[42px] p-0 flex-shrink-0"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {showValidationErrors && !fichaData.vehiculo && (
                                                <p className="text-destructive text-sm mt-1">Este campo es obligatorio</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ruta */}
                                    <div
                                        id="rutaSection"
                                        className="space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Label className={showValidationErrors && fichaData.destinos.length === 0 ? "text-destructive" : ""}>
                                                Ruta *
                                            </Label>
                                            <Button
                                                id="addDestinoBtn"
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={openAddDestinoModal}
                                                className="h-8"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Añadir destino
                                            </Button>
                                        </div>

                                        <DestinosList
                                            id="destinosList"
                                            destinos={fichaData.destinos}
                                            onEditDestino={handleEditDestino}
                                            onDeleteDestino={handleDeleteDestino}
                                            getEstadoLabel={getEstadoLabel}
                                            getCiudadLabel={getCiudadLabel}
                                        />

                                        {showValidationErrors && fichaData.destinos.length === 0 && (
                                            <p className="text-destructive text-sm">Debe agregar al menos un destino</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky CTA */}
                        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
                            <div className="max-w-[360px] mx-auto space-y-3">
                                <Button
                                    id="guardarFichaBtn"
                                    className="w-full h-12"
                                    onClick={handleSaveFicha}
                                    disabled={!validateFichaForm()}
                                >
                                    Guardar ficha
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-12"
                                    onClick={handleBackToDashboard}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>

                        {/* Modals */}
                        <AddDriverModal
                            id="modalNuevoConductor"
                            open={isAddDriverModalOpen}
                            onOpenChange={setIsAddDriverModalOpen}
                            onDriverAdded={handleDriverAdded}
                        />

                        <AddVehicleModal
                            id="modalNuevoVehiculo"
                            open={isAddVehicleModalOpen}
                            onOpenChange={setIsAddVehicleModalOpen}
                            onVehicleAdded={handleVehicleAdded}
                        />

                        <AddDestinoModal
                            id="modalDestino"
                            open={isAddDestinoModalOpen}
                            onOpenChange={setIsAddDestinoModalOpen}
                            onDestinoAdded={handleDestinoAdded}
                            editingDestino={editingDestino}
                            estados={estados}
                            ciudades={ciudades}
                            loadCiudadesForEstado={loadCiudadesForEstado}
                            loadingCiudades={loadingCiudades}
                        />
                    </div>
                </div>
            ) : currentScreen === 'detalle-ficha' ? (
                <div key="detalle-ficha">
                    <DetalleFicha
                        ficha={selectedFicha || {
                            folio: fichaData.folio,
                            conductorNombre: fichaData.conductorNombre,
                            conductorCargo: ficha.conductorCargo,
                            vehiculo: fichaData.vehiculo,
                            destinos: fichaData.destinos,
                            fechaCreacion: new Date().toISOString(),
                            estado: 'creada'
                        }}
                        onBack={handleBackToDashboard}
                        onGoToEntrada={handleGoToEntrada}
                        onGoToSalida={handleGoToSalida}
                        getEstadoLabel={getEstadoLabel}
                        getCiudadLabel={getCiudadLabel}
                        getVehicleName={(value) => {
                            const vehicle = vehicles.find(v => v.value === value);
                            return vehicle ? vehicle.label : value;
                        }}
                    />
                </div>
            ) : currentScreen === 'formulario-entrada' ? (
                <div key="formulario-entrada">
                    <FormularioEntrada
                        ficha={selectedFicha || {
                            folio: fichaData.folio,
                            conductorNombre: fichaData.conductorNombre,
                            conductorCargo: fichaData.conductorCargo,
                            destinos: fichaData.destinos,
                            fechaCreacion: new Date().toISOString(),
                            estado: 'creada'
                        }}
                        onBack={() => setCurrentScreen('detalle-ficha')}
                        onComplete={handleEntradaComplete}
                    />
                </div>
            ) : currentScreen === 'formulario-salida' ? (
                <div key="formulario-salida">
                    <FormularioSalida
                        ficha={selectedFicha || {
                            folio: fichaData.folio,
                            conductorNombre: fichaData.conductorNombre,
                            conductorCargo: fichaData.conductorCargo,
                            destinos: fichaData.destinos,
                            fechaCreacion: new Date().toISOString(),
                            estado: 'creada'
                        }}
                        onBack={() => setCurrentScreen('detalle-ficha')}
                        onComplete={handleSalidaComplete}
                    />
                </div>
            ) : (
                <div key="legacy">
                    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <p className="text-gray-500">Pantalla no encontrada</p>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
