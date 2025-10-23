import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ArrowLeft, CheckCircle, Mail, Pencil } from 'lucide-react';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';
import { toast } from "sonner";
import { comissionsAPI } from '../api';
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

// --- INTERFACES ---
interface Destino {
    id: string;
    estado: string;
    ciudad: string;
    comentario: string;
}

interface InspectionData {
    id: number;
    type: 'photo' | 'signature';
    part: string;
    comment: string | null;
    photo_url: string | null;
    signature_conductor_url: string | null;
    signature_approver_url: string | null;
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
    inspections: InspectionData[];
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

interface DetalleFichaProps {
    ficha: FichaGuardada;
    onBack: () => void;
    onGoToEntrada: () => void;
    onGoToSalida: () => void;
    onEditSalida: () => void;
    onEditEntrada: () => void;
    getEstadoLabel: (value: string) => string;
    getCiudadLabel: (estadoValue: string, ciudadValue: string) => string;
    getVehicleName?: (value: string) => string;
    refreshFichas: () => void;
}

export function DetalleFicha({
    ficha,
    onBack,
    onGoToEntrada,
    onGoToSalida,
    onEditSalida,
    onEditEntrada,
    getEstadoLabel,
    getCiudadLabel,
    getVehicleName,
    refreshFichas
}: DetalleFichaProps) {
    const [showEnvioModal, setShowEnvioModal] = useState(false);
    const [emailDestino, setEmailDestino] = useState('');
    const [galleryViewer, setGalleryViewer] = useState({ open: false, initialIndex: 0 });

    const handleImageClick = (photoId: string) => {
        const photos = (ficha.passDetails?.inspections || [])
            .filter(insp => insp.type === 'photo')
            .map(insp => ({ id: insp.id.toString(), url: `http://localhost:8000${insp.photo_url}`, label: insp.comment || getImageDisplayName(insp.part) }));

        const initialIndex = photos.findIndex(p => p.id === photoId);
        if (initialIndex !== -1) {
            setGalleryViewer({ open: true, initialIndex });
        }
    };

    const handleOpenEnvioModal = () => setShowEnvioModal(true);

    const handleEnviarFicha = async () => {
        if (!emailDestino.trim() || !/\S+@\S+\.\S+/.test(emailDestino)) {
            return toast.error('Por favor ingresa un email válido');
        }
        try {
            const response = await comissionsAPI.send(ficha.folio, emailDestino);
            if (response.data.success) {
                toast.success('Ficha enviada correctamente', { description: `La ficha ${ficha.folio} se ha enviado a ${emailDestino}` });
            } else {
                throw new Error(response.data.message || 'Error en la respuesta de la API');
            }
        } catch (error) {
            console.error('Error al enviar la ficha:', error);
            toast.error('Error al enviar la ficha');
        } finally {
            setShowEnvioModal(false);
            setEmailDestino('');
        }
    };

    const getImageDisplayName = (part: string) => ({
        'front': 'Vista frontal', 'right_side': 'Lateral derecho', 'left_side': 'Lateral izquierdo',
        'back': 'Vista posterior', 'mileage': 'Odómetro', 'interior': 'Interior', 'mileage_entry': 'Odómetro (Entrada)'
    }[part.replace('_entry', '')] || part);

    const hasSalida = ficha.estado === 'con-salida' || ficha.estado === 'completada';
    const hasEntrada = ficha.estado === 'completada';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="h-12 bg-black"></div>
            <div className="bg-black px-4 py-2"><div className="flex items-center justify-center"><img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto" /></div></div>
            <div className="bg-white px-4 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto"><ArrowLeft className="h-5 w-5" /></Button>
                    <h1 className="text-black text-xl flex-1 text-center mr-11">Detalle de ficha</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[360px] mx-auto px-4 py-6 pb-32">
                <div id="fichaCard" className="bg-white rounded-lg p-6 shadow-md mb-6">
                    {/* Ficha Info */}
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h2 className="text-lg text-black">{ficha.folio}</h2>
                                <p className="text-black">{ficha.conductorNombre}</p>
                                <p className="text-gray-500 text-sm">{ficha.conductorCargo}</p>
                                {ficha.vehiculo && getVehicleName && (
                                    <p className="text-gray-500 text-sm">{getVehicleName(ficha.vehiculo)}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                    ficha.estado === 'creada' ? 'bg-blue-100 text-blue-700' :
                                        ficha.estado === 'con-salida' ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                }`}>
                                    <div className={`h-2 w-2 rounded-full ${
                                        ficha.estado === 'creada' ? 'bg-blue-500' :
                                            ficha.estado === 'con-salida' ? 'bg-orange-500' :
                                                'bg-green-500'
                                    }`}></div>
                                    {ficha.estado === 'creada' ? 'Creada' :
                                        ficha.estado === 'con-salida' ? 'Con salida' :
                                            'Completada'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Salida */}
                    {hasSalida && ficha.passDetails && (
                        <div className="border-t pt-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm">Salida registrada</h3>
                                <Button variant="outline" size="sm" onClick={onEditSalida} className="h-7 text-xs"><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Fecha/Hora</p>
                                        <p className="text-black">{new Date(ficha.passDetails.startDate || '').toLocaleDateString()}</p>
                                        <p className="text-gray-500 text-xs">{new Date(ficha.passDetails.startDate || '').toLocaleTimeString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Kilometraje</p>
                                        <p className="text-black">{ficha.passDetails.departureMileage} km</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-orange-600" /><span className="text-orange-700 text-sm">Salida registrada</span></div>
                            </div>
                        </div>
                    )}

                    {/* Entrada */}
                    {hasEntrada && ficha.passDetails && (
                        <div className="border-t pt-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-gray-500 text-sm">Entrada registrada</h3>
                                <Button variant="outline" size="sm" onClick={onEditEntrada} className="h-7 text-xs"><Pencil className="h-3 w-3 mr-1" />Editar</Button>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Fecha/Hora</p>
                                        <p className="text-black">{new Date(ficha.passDetails.endDate || '').toLocaleDateString()}</p>
                                        <p className="text-gray-500 text-xs">{new Date(ficha.passDetails.endDate || '').toLocaleTimeString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Kilometraje</p>
                                        <p className="text-black">{ficha.passDetails.arrivalMileage} km</p>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-green-700 text-sm">Entrada completada</span></div>
                            </div>
                        </div>
                    )}

                    {/* Ruta */}
                    <div className="border-t pt-4">
                        <h3 className="text-gray-500 text-sm mb-3">Ruta</h3>
                        <div className="space-y-2">
                            {ficha.destinos.map((destino, index) => (
                                <div key={destino.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs mt-0.5">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-black text-sm">
                                                {getEstadoLabel(destino.estado)} • {getCiudadLabel(destino.estado, destino.ciudad)}
                                            </p>
                                            {destino.comentario && (
                                                <p className="text-gray-500 text-xs mt-1">{destino.comentario}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
                <div className="max-w-[360px] mx-auto">
                    {ficha.estado === 'completada' ? (
                        <Button className="w-full h-12" onClick={handleOpenEnvioModal}><Mail className="h-4 w-4 mr-2" />Enviar</Button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Button id="abrirSalidaBtn" variant="outline" onClick={onGoToSalida} disabled={hasSalida}>Salida</Button>
                            <Button id="abrirEntradaBtn" onClick={onGoToEntrada} disabled={!hasSalida || hasEntrada}>Entrada</Button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ENVÍO DE FICHA */}
            <Dialog open={showEnvioModal} onOpenChange={setShowEnvioModal}>
                <DialogContent className="max-w-[340px] rounded-lg">
                    <DialogHeader>
                        <DialogTitle>Enviar Ficha {ficha.folio}</DialogTitle>
                        <DialogDescription>
                            Ingresa el correo electrónico para enviar el reporte final de la comisión.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <input
                            type="email"
                            placeholder="ejemplo@dominio.com"
                            value={emailDestino}
                            onChange={(e) => setEmailDestino(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />

                        <Button
                            className="w-full"
                            onClick={handleEnviarFicha}
                            disabled={!emailDestino || !/\S+@\S+\.\S+/.test(emailDestino)} // Deshabilita si email inválido
                        >
                            Confirmar Envío
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <PhotoGalleryViewer
                photos={(ficha.passDetails?.inspections || [])
                    .filter(i => i.type === 'photo')
                    .map(i => ({
                        id: i.id.toString(),
                        url: `http://localhost:8000${i.photo_url}`,
                        label: getImageDisplayName(i.part)
                    }))
                }
                initialIndex={galleryViewer.initialIndex}
                open={galleryViewer.open}
                onOpenChange={(open) => setGalleryViewer({ ...galleryViewer, open })}
            />
        </div>
    );
}
