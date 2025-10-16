import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';
import { ArrowLeft, Camera, CheckCircle, Upload, Plus } from 'lucide-react';
import { toast } from "sonner";
import { SignaturePad } from './SignaturePad';
import { FuelGauge } from './FuelGauge';

import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

// Imagen de confirmación/éxito
const siImage = "https://images.unsplash.com/photo-1705258815892-ab751ae176ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGNoZWNrbWFyayUyMHllcyUyMGFwcHJvdmFsfGVufDF8fHx8MTc1OTUyMzU3NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

// Mock function to get a random image from Unsplash
const getImageUrl = (id: string) => {
    const imageIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
    return `https://picsum.photos/400/300?random=${randomId}&${id}`;
};

interface Destino {
    id: string;
    estado: string;
    ciudad: string;
    comentario: string;
}

interface ComisionData {
    destinos: Destino[];
    fechaSalida: string;
    fechaEntrega: string;
    horaEntrega: string;
    vehiculo: string;
}

interface RegistroEntradaProps {
    folio: string;
    conductor: string;
    horaSalida: string;
    onBack: () => void;
    onComplete: (entradaData: RegistroEntradaData) => void;
    comisionData: ComisionData;
}

interface FotoInterior {
    id: string;
    label: string;
    file: File | null;
}

interface RegistroEntradaData {
    kmEntrada: string;
    fotoKilometraje: File | null;
    combustible: number;
    fotoFrontal: File | null;
    fotoLatDer: File | null;
    fotoLatIzq: File | null;
    fotoPosterior: File | null;
    fotosInteriores: FotoInterior[];
    firmaConductor: string;
    firmaAprobador: string;
}

interface PhotoCardProps {
    id: string;
    label: string;
    photo: File | null;
    onPhotoChange: (id: string, file: File | null) => void;
    error?: boolean;
    onDelete?: () => void;
    showDelete?: boolean;
    onShowPhotoGuide?: (id: string, label: string) => void;
    onShowPhotoModal?: (photo: File, label: string, showDelete: boolean, onRetake: () => void, onDelete?: () => void) => void;
}

function PhotoCard({ id, label, photo, onPhotoChange, error, onDelete, showDelete, onShowPhotoGuide, onShowPhotoModal }: PhotoCardProps) {
    const handleTakePhoto = async () => {
        try {
            const imageUrl = getImageUrl(id);
            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error(`Error de red: ${response.status}`);
            }

            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Imagen vacía recibida');
            }

            const file = new File([blob], `${id}-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onPhotoChange(id, file);
            toast.success(`Foto ${label.toLowerCase()} capturada`);
        } catch (error) {
            console.error('Error capturando foto:', error);
            if (error instanceof TypeError) {
                toast.error('Error de conexión - Verifica tu internet');
            } else if (error.message.includes('Error de red')) {
                toast.error('Error de servidor - Intenta de nuevo');
            } else {
                toast.error('Error al capturar la foto - Intenta nuevamente');
            }
        }
    };

    const handleRetake = () => {
        onPhotoChange(id, null);
    };

    return (
        <Button
            type="button"
            variant={photo ? "default" : "outline"}
            onClick={() => {
                if (photo) {
                    // Si hay foto, mostrar modal con la foto
                    onShowPhotoModal?.(photo, label, showDelete || false, handleRetake, onDelete);
                } else {
                    // Si no hay foto, mostrar modal de instrucciones
                    onShowPhotoGuide?.(id, label);
                }
            }}
            className={`w-16 h-16 p-0 flex items-center justify-center mx-auto ${
                error ? 'border-destructive' : photo ? 'bg-green-600 hover:bg-green-700' : ''
            }`}
        >
            {photo ? (
                <CheckCircle className="h-6 w-6 text-white" />
            ) : (
                <Camera className="h-6 w-6" />
            )}
        </Button>
    );
}

export function RegistroEntrada({ folio, conductor, horaSalida, onBack, onComplete, comisionData }: RegistroEntradaProps) {
    const [formData, setFormData] = useState<RegistroEntradaData>({
        kmEntrada: '',
        fotoKilometraje: null,
        combustible: 0,
        fotoFrontal: null,
        fotoLatDer: null,
        fotoLatIzq: null,
        fotoPosterior: null,
        fotosInteriores: [
            { id: 'foto1', label: 'Foto 1', file: null }
        ],
        firmaConductor: '',
        firmaAprobador: ''
    });
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [photoGuideModal, setPhotoGuideModal] = useState<{open: boolean, id: string, label: string}>({
        open: false,
        id: '',
        label: ''
    });

    const [capturedPhotoPreview, setCapturedPhotoPreview] = useState<string | null>(null);

    const [photoViewModal, setPhotoViewModal] = useState<{
        open: boolean;
        photo: File | null;
        label: string;
        showDelete: boolean;
        onRetake: (() => void) | null;
        onDelete: (() => void) | null;
    }>({
        open: false,
        photo: null,
        label: '',
        showDelete: false,
        onRetake: null,
        onDelete: null
    });

    // Limpiar URLs de objetos cuando se cierre el modal
    useEffect(() => {
        if (!photoViewModal.open && photoViewModal.photo) {
            // Limpiar cualquier URL de objeto creada anteriormente
            const timeout = setTimeout(() => {
                setPhotoViewModal(prev => ({ ...prev, photo: null }));
            }, 100);
            return () => clearTimeout(timeout);
        }
    }, [photoViewModal.open]);

    // Limpiar preview cuando se cierre el modal de guía
    useEffect(() => {
        if (!photoGuideModal.open && capturedPhotoPreview) {
            setCapturedPhotoPreview(null);
        }
    }, [photoGuideModal.open]);

    const updateFormData = (field: keyof RegistroEntradaData, value: string | File | null | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when field is updated
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: false }));
        }
    };

    const handlePhotoChange = (id: string, file: File | null) => {
        // Check if this is a regular photo field (like fotoFrontal) or interior photo
        if (['fotoFrontal', 'fotoLatDer', 'fotoLatIzq', 'fotoPosterior', 'fotoKilometraje'].includes(id)) {
            updateFormData(id as keyof RegistroEntradaData, file);
        } else {
            // Handle interior photos
            setFormData(prev => ({
                ...prev,
                fotosInteriores: prev.fotosInteriores.map(foto =>
                    foto.id === id ? { ...foto, file } : foto
                )
            }));
        }
    };

    const handleAddInteriorPhoto = () => {
        const newId = `foto${formData.fotosInteriores.length + 1}`;
        setFormData(prev => ({
            ...prev,
            fotosInteriores: [
                ...prev.fotosInteriores,
                { id: newId, label: `Foto ${prev.fotosInteriores.length + 1}`, file: null }
            ]
        }));
    };

    const handleDeleteInteriorPhoto = (id: string) => {
        if (formData.fotosInteriores.length > 1) {
            setFormData(prev => ({
                ...prev,
                fotosInteriores: prev.fotosInteriores.filter(foto => foto.id !== id)
            }));
            toast.success('Foto eliminada');
        }
    };

    const formatNumber = (value: string) => {
        // Remove non-numeric characters
        const numeric = value.replace(/\D/g, '');
        // Add thousands separator
        return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatNumber(e.target.value);
        updateFormData('kmEntrada', formatted);
    };

    const handleShowPhotoGuide = (id: string, label: string) => {
        setPhotoGuideModal({ open: true, id, label });
    };

    const handleShowPhotoModal = (photo: File, label: string, showDelete: boolean, onRetake: () => void, onDelete?: () => void) => {
        setPhotoViewModal({
            open: true,
            photo,
            label,
            showDelete,
            onRetake,
            onDelete: onDelete || null
        });
    };

    const handleTakePhotoFromGuide = async () => {
        const { id, label } = photoGuideModal;

        // Generar foto de referencia específica según el tipo
        try {
            const referenceImages = {
                'fotoKilometraje': 'https://images.unsplash.com/photo-1549095244-09a0a8749b98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWhpY2xlJTIwb2RvbWV0ZXIlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzU5NzgxMTk2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'fotoFrontal': 'https://images.unsplash.com/photo-1615966996783-5d361a011237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmcm9udCUyMHZpZXd8ZW58MXx8fHwxNzU5NzgxMjAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'fotoLatDer': 'https://images.unsplash.com/photo-1690278289651-895463644114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBzaWRlJTIwdmlld3xlbnwxfHx8fDE3NTk3NDkwNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'fotoLatIzq': 'https://images.unsplash.com/photo-1690278289651-895463644114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBzaWRlJTIwdmlld3xlbnwxfHx8fDE3NTk3NDkwNjl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'fotoPosterior': 'https://images.unsplash.com/photo-1652727719719-3c43c7dc54cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjByZWFyJTIwdmlld3xlbnwxfHx8fDE3NTk3NDExMDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'foto1': 'https://images.unsplash.com/photo-1648799833118-c989da6907d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBpbnRlcmlvciUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NTk2ODAyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'foto2': 'https://images.unsplash.com/photo-1648799833118-c989da6907d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBpbnRlcmlvciUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NTk2ODAyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'foto3': 'https://images.unsplash.com/photo-1648799833118-c989da6907d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBpbnRlcmlvciUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NTk2ODAyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
            };

            const imageUrl = referenceImages[id] || referenceImages['fotoFrontal'];
            setCapturedPhotoPreview(imageUrl);
            toast.success(`Foto ${label.toLowerCase()} capturada`);
        } catch (error) {
            console.error('Error generando foto:', error);
            toast.error('Error al generar la foto');
        }
    };



    const handleConfirmPhoto = async () => {
        if (capturedPhotoPreview && photoGuideModal.id) {
            try {
                // Convertir la URL de imagen a un archivo simulado
                const response = await fetch(capturedPhotoPreview);
                const blob = await response.blob();
                const file = new File([blob], `${photoGuideModal.id}-${Date.now()}.jpg`, { type: 'image/jpeg' });

                handlePhotoChange(photoGuideModal.id, file);
                setCapturedPhotoPreview(null);
                setPhotoGuideModal({ open: false, id: '', label: '' });
                toast.success('Foto confirmada y guardada');
            } catch (error) {
                console.error('Error confirmando foto:', error);
                toast.error('Error al confirmar la foto');
            }
        }
    };

    const handleRetakePhoto = () => {
        setCapturedPhotoPreview(null);
        // No cerrar el modal, permitir tomar otra foto
    };

    // Mapear imágenes simuladas según el ID de la foto
    const getImageUrl = (photoId: string): string => {
        const imageMap: Record<string, string> = {
            'fotoKilometraje': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format',
            'fotoFrontal': 'https://images.unsplash.com/photo-1503736334592-24ad03b9e44d?w=400&h=300&fit=crop&auto=format',
            'fotoLatDer': 'https://images.unsplash.com/photo-1562911791-c7a8b6c69a86?w=400&h=300&fit=crop&auto=format',
            'fotoLatIzq': 'https://images.unsplash.com/photo-1562911791-c7a8b6c69a86?w=400&h=300&fit=crop&auto=format&flip=h',
            'fotoPosterior': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop&auto=format',
            // Para fotos de interiores
            'foto1': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&auto=format',
            'foto2': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format',
            'foto3': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=400&h=300&fit=crop&auto=format',
        };
        return imageMap[photoId] || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop&auto=format';
    };

    const validateForm = () => {
        const newErrors: Record<string, boolean> = {};

        // Validate kilometraje
        const kmValue = formData.kmEntrada.replace(/,/g, '');
        if (!kmValue || isNaN(Number(kmValue)) || Number(kmValue) <= 0) {
            newErrors.kmEntrada = true;
        }

        // Validate combustible
        if (formData.combustible === 0) {
            newErrors.combustible = true;
        }

        // Validate required photos
        const requiredPhotos: (keyof RegistroEntradaData)[] = ['fotoFrontal', 'fotoLatDer', 'fotoLatIzq', 'fotoPosterior'];
        requiredPhotos.forEach(photo => {
            if (!formData[photo]) {
                newErrors[photo] = true;
            }
        });

        // Validate signatures
        if (!formData.firmaConductor) {
            newErrors.firmaConductor = true;
        }

        if (!formData.firmaAprobador) {
            newErrors.firmaAprobador = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validateForm()) {
            toast.error('Por favor completa todos los campos obligatorios');
            return;
        }

        toast.success('Registro de entrada completado');
        onComplete(formData);
    };

    const isFormValid = () => {
        const kmValue = formData.kmEntrada.replace(/,/g, '');
        const hasValidKm = kmValue && !isNaN(Number(kmValue)) && Number(kmValue) > 0;
        const hasCombustible = formData.combustible > 0;
        const hasAllPhotos = formData.fotoFrontal && formData.fotoLatDer && formData.fotoLatIzq && formData.fotoPosterior;
        const hasSignatures = formData.firmaConductor && formData.firmaAprobador;

        return hasValidKm && hasCombustible && hasAllPhotos && hasSignatures;
    };



    return (
        <div className="min-h-screen bg-gray-50">
            {/* Safe Area Top */}
            <div className="h-12 bg-black"></div>

            {/* Header */}
            <div className="bg-black px-[16px] py-[5px]">
                <div className="flex items-center justify-center">
                    <img
                        src={grupoOptimoLogo}
                        alt="GRUPO OPTIMO"
                        className="h-12 w-auto object-contain px-[54px] py-[0px]"
                    />
                </div>
            </div>

            {/* Title and Back */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="p-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-black">Registro de entrada</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[360px] mx-auto px-4 py-6 pb-32 space-y-6">

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                    <Card className="p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Folio:</span>
                                <span>{folio}</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Kilometraje */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                >
                    <Card className="p-4">
                        <div className="space-y-3">
                            <Label className={errors.kmEntrada ? "text-destructive" : ""}>
                                Kilometraje *
                            </Label>
                            <Input
                                id="kmEntrada"
                                type="text"
                                inputMode="numeric"
                                value={formData.kmEntrada}
                                onChange={handleKmChange}
                                placeholder="0"
                                className={`${errors.kmEntrada ? 'border-destructive' : formData.kmEntrada && !errors.kmEntrada ? 'border-green-500' : ''}`}
                            />
                            {errors.kmEntrada && (
                                <p className="text-destructive text-sm">
                                    Ingresa un kilometraje válido mayor a 0
                                </p>
                            )}

                            {/* Foto del kilometraje */}
                            <div className="mt-3">
                                <Label className="text-sm">Evidencia del kilometraje</Label>
                                <div className="mt-2 max-w-[120px]">
                                    <PhotoCard
                                        id="fotoKilometraje"
                                        label="Kilometraje"
                                        photo={formData.fotoKilometraje}
                                        onPhotoChange={handlePhotoChange}
                                        error={false}
                                        onShowPhotoGuide={handleShowPhotoGuide}
                                        onShowPhotoModal={handleShowPhotoModal}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Combustible */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
                >
                    <Card className="p-4">
                        <div>
                            <Label className={errors.combustible ? "text-destructive" : ""}>
                                Combustible *
                            </Label>
                            <div className={`mt-2 ${errors.combustible ? 'ring-2 ring-destructive rounded-lg' : ''}`}>
                                <FuelGauge
                                    value={formData.combustible}
                                    onChange={(value) => updateFormData('combustible', value)}
                                    label=""
                                />
                            </div>
                            {errors.combustible && (
                                <p className="text-destructive text-sm mt-1">
                                    Selecciona el nivel de combustible
                                </p>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* Evidencia Exterior (Grid 2x2) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
                >
                    <Card className="p-4">
                        <div className="space-y-3">
                            <Label>Evidencia exterior *</Label>
                            <div className="flex justify-center">
                                <div className="flex flex-wrap justify-center gap-3 max-w-xs">
                                    <PhotoCard
                                        id="fotoFrontal"
                                        label="Frontal"
                                        photo={formData.fotoFrontal}
                                        onPhotoChange={handlePhotoChange}
                                        error={errors.fotoFrontal}
                                        onShowPhotoGuide={handleShowPhotoGuide}
                                        onShowPhotoModal={handleShowPhotoModal}
                                    />
                                    <PhotoCard
                                        id="fotoLatDer"
                                        label="Lateral derecha"
                                        photo={formData.fotoLatDer}
                                        onPhotoChange={handlePhotoChange}
                                        error={errors.fotoLatDer}
                                        onShowPhotoGuide={handleShowPhotoGuide}
                                        onShowPhotoModal={handleShowPhotoModal}
                                    />
                                    <PhotoCard
                                        id="fotoLatIzq"
                                        label="Lateral izquierda"
                                        photo={formData.fotoLatIzq}
                                        onPhotoChange={handlePhotoChange}
                                        error={errors.fotoLatIzq}
                                        onShowPhotoGuide={handleShowPhotoGuide}
                                        onShowPhotoModal={handleShowPhotoModal}
                                    />
                                    <PhotoCard
                                        id="fotoPosterior"
                                        label="Posterior"
                                        photo={formData.fotoPosterior}
                                        onPhotoChange={handlePhotoChange}
                                        error={errors.fotoPosterior}
                                        onShowPhotoGuide={handleShowPhotoGuide}
                                        onShowPhotoModal={handleShowPhotoModal}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Evidencia Interior */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.9 }}
                >
                    <Card className="p-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Evidencia interior</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddInteriorPhoto}
                                    className="h-8"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Añadir foto
                                </Button>
                            </div>
                            <div className="flex justify-center">
                                <div className="flex flex-wrap justify-center gap-3 max-w-xs">
                                    {formData.fotosInteriores.map((foto) => (
                                        <PhotoCard
                                            key={foto.id}
                                            id={foto.id}
                                            label={foto.label}
                                            photo={foto.file}
                                            onPhotoChange={handlePhotoChange}
                                            error={false}
                                            showDelete={formData.fotosInteriores.length > 1}
                                            onDelete={() => handleDeleteInteriorPhoto(foto.id)}
                                            onShowPhotoGuide={handleShowPhotoGuide}
                                            onShowPhotoModal={handleShowPhotoModal}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Firmas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1.0 }}
                >
                    <Card className="p-4 space-y-4">
                        {/* Firma del conductor */}
                        <div>
                            <Label className="text-black">
                                Firma del conductor *
                            </Label>
                            <div className={`mt-2 ${formData.firmaConductor ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-200'} rounded-lg`}>
                                <SignaturePad
                                    id="firmaConductor"
                                    onSignatureChange={(signature) => {
                                        updateFormData('firmaConductor', signature);
                                        // Always clear error when signature changes
                                        if (signature) {
                                            setErrors(prev => ({ ...prev, firmaConductor: false }));
                                        }
                                    }}
                                />
                            </div>
                            {formData.firmaConductor ? (
                                <p className="text-green-600 text-sm mt-1">
                                    ✓ Firma completada - Lista para continuar
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm mt-1">
                                    Toca el área para firmar
                                </p>
                            )}
                        </div>

                        {/* Firma de quien aprueba */}
                        <div>
                            <Label className="text-black">
                                Firma de quien aprueba *
                            </Label>
                            <div className={`mt-2 ${formData.firmaAprobador ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-200'} rounded-lg`}>
                                <SignaturePad
                                    id="firmaAprobador"
                                    onSignatureChange={(signature) => {
                                        updateFormData('firmaAprobador', signature);
                                        // Always clear error when signature changes
                                        if (signature) {
                                            setErrors(prev => ({ ...prev, firmaAprobador: false }));
                                        }
                                    }}
                                />
                            </div>
                            {formData.firmaAprobador ? (
                                <p className="text-green-600 text-sm mt-1">
                                    ✓ Firma completada - Lista para continuar
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm mt-1">
                                    Toca el área para firmar
                                </p>
                            )}
                        </div>

                        {/* Status global de firmas */}
                        {formData.firmaConductor && formData.firmaAprobador && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                                <p className="text-green-700 text-sm font-medium text-center">
                                    ✅ Ambas firmas completadas - Puedes continuar
                                </p>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </div>

            {/* Sticky CTA */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
                <div className="max-w-[360px] mx-auto">
                    <Button
                        id="guardarEntradaBtn"
                        className="w-full h-12"
                        onClick={() => {
                            // Forzar guardado incluso si hay validaciones pendientes
                            toast.success('Registro de entrada completado');
                            onComplete(formData);
                        }}
                        disabled={false}
                    >
                        Guardar entrada
                    </Button>
                </div>
            </div>

            {/* Modal de guía de foto */}
            {photoGuideModal.open && (
                <Dialog open={photoGuideModal.open} onOpenChange={(open) =>
                    setPhotoGuideModal(prev => ({ ...prev, open }))
                }>
                    <DialogContent className="max-w-[340px] rounded-lg">
                        <DialogHeader>
                            <DialogTitle>Captura de fotografías</DialogTitle>
                            <DialogDescription>
                                {photoGuideModal.label === 'Kilometraje'
                                    ? 'Captura del kilometraje del vehículo'
                                    : photoGuideModal.label
                                        ? `Captura de ${photoGuideModal.label.toLowerCase()}`
                                        : 'Captura del vehículo'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {!capturedPhotoPreview ? (
                                <>
                                    <div className="text-center">
                                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Camera className="h-12 w-12 text-gray-400" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 italic">
                                            Presiona el botón para tomar la fotografía
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setPhotoGuideModal({ open: false, id: '', label: '' })}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={handleTakePhotoFromGuide}
                                        >
                                            <Camera className="h-4 w-4 mr-2" />
                                            Tomar foto
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center">
                                        <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                            <img
                                                src={capturedPhotoPreview}
                                                alt={photoGuideModal.label}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Revisa la foto y confirma si está correcta
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={handleRetakePhoto}
                                        >
                                            Tomar otra
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={handleConfirmPhoto}
                                        >
                                            Confirmar
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modal de visualización de foto */}
            {photoViewModal.open && (
                <Dialog open={photoViewModal.open} onOpenChange={(open) =>
                    setPhotoViewModal(prev => ({ ...prev, open }))
                }>
                    <DialogContent className="max-w-[340px] rounded-lg">
                        <DialogHeader>
                            <DialogTitle>{photoViewModal.label || 'Visualizar foto'}</DialogTitle>
                            <DialogDescription>
                                Visualizar y gestionar la foto capturada
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Imagen */}
                            {photoViewModal.photo && (
                                <div className="text-center">
                                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={(() => {
                                                try {
                                                    return URL.createObjectURL(photoViewModal.photo);
                                                } catch (error) {
                                                    console.error('Error creando URL de objeto:', error);
                                                    toast.error('Error al mostrar la imagen');
                                                    return '';
                                                }
                                            })()}
                                            alt={photoViewModal.label}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                console.error('Error cargando imagen:', e);
                                                toast.error('Error al cargar la imagen');
                                            }}
                                            onLoad={(e) => {
                                                // Limpiar URL anterior si existe para evitar memory leaks
                                                const img = e.target as HTMLImageElement;
                                                if (img.src.startsWith('blob:')) {
                                                    // La URL se limpiará automáticamente cuando se cierre el modal
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setPhotoViewModal(prev => ({ ...prev, open: false }))}
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => {
                                        if (photoViewModal.onRetake) {
                                            photoViewModal.onRetake();
                                        }
                                        setPhotoViewModal(prev => ({ ...prev, open: false }));
                                    }}
                                >
                                    Repetir foto
                                </Button>
                                {photoViewModal.showDelete && photoViewModal.onDelete && (
                                    <Button
                                        variant="destructive"
                                        className="w-10 h-10 p-0"
                                        onClick={() => {
                                            if (photoViewModal.onDelete) {
                                                photoViewModal.onDelete();
                                            }
                                            setPhotoViewModal(prev => ({ ...prev, open: false }));
                                        }}
                                    >
                                        ×
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}