import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { VisuallyHidden } from './ui/visually-hidden';
import { ArrowLeft, Eye, CheckCircle, X, Mail } from 'lucide-react';
import { PhotoGalleryViewer } from './PhotoGalleryViewer';
import { toast } from "sonner";
import { comissionsAPI } from '../api'; // Import the API
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

// --- INTERFACES ALIGNED WITH App.tsx ---
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
    mileage: number;
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
    salidaData?: { pass_id?: number } & any;
    entradaData?: any;
    passDetails: PassDetails | null;
}

interface DetalleFichaProps {
    ficha: FichaGuardada;
    onBack: () => void;
    onGoToEntrada: () => void;
    onGoToSalida: () => void;
    getEstadoLabel: (value: string) => string;
    getCiudadLabel: (estadoValue: string, ciudadValue: string) => string;
    getVehicleName?: (value: string) => string;
}

export function DetalleFicha({
                                 ficha,
                                 onBack,
                                 onGoToEntrada,
                                 onGoToSalida,
                                 getEstadoLabel,
                                 getCiudadLabel,
                                 getVehicleName
                             }: DetalleFichaProps) {
    const [showEntradaModal, setShowEntradaModal] = useState(false);
    const [showSalidaModal, setShowSalidaModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showEnvioModal, setShowEnvioModal] = useState(false);
    const [emailDestino, setEmailDestino] = useState('');
    const [galleryViewer, setGalleryViewer] = useState({
        open: false,
        initialIndex: 0,
        isEntrada: true
    });

    const handleVerEntrada = () => {
        setShowEntradaModal(true);
    };

    const handleVerSalida = () => {
        setShowSalidaModal(true);
    };

    const handleImageClick = (photoId: string, isEntrada: boolean = true) => {
        const inspections = ficha.passDetails?.inspections || [];
        const photos = inspections
            .filter(insp => insp.type === 'photo')
            .map(insp => ({
                id: insp.id.toString(),
                url: `http://localhost:8000${insp.photo_url}`,
                label: insp.comment || insp.part,
            }));

        const initialIndex = photos.findIndex(p => p.id === photoId);

        setGalleryViewer({
            open: true,
            initialIndex: initialIndex !== -1 ? initialIndex : 0,
            isEntrada: isEntrada
        });
    };

    const handleOpenEnvioModal = () => {
        setShowEnvioModal(true);
    };

    const handleEnviarFicha = async () => {
        if (!emailDestino.trim()) {
            toast.error('Por favor ingresa un email de destino');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailDestino)) {
            toast.error('Por favor ingresa un email válido');
            return;
        }

        try {
            const response = await comissionsAPI.send(ficha.folio, emailDestino);
            if (response.data.success) {
                toast.success('Ficha enviada correctamente', {
                    description: `La ficha ${ficha.folio} se ha enviado a ${emailDestino}`,
                });
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

    const getImageDisplayName = (part: string) => {
        const imageNames: { [key: string]: string } = {
            'front': 'Vista frontal',
            'right_side': 'Lateral derecho',
            'left_side': 'Lateral izquierdo',
            'back': 'Vista posterior',
            'mileage': 'Odómetro',
            'interior': 'Interior'
        };
        return imageNames[part] || part;
    };

    const entradaInspections = ficha.passDetails?.inspections.filter(i => i.part.includes('_entry')) || [];
    const salidaInspections = ficha.passDetails?.inspections.filter(i => !i.part.includes('_entry')) || [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="h-12 bg-black"></div>
            <div className="bg-black px-4 py-2">
                <div className="flex items-center justify-center">
                    <img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto" />
                </div>
            </div>
            <div className="bg-white px-4 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-black text-xl flex-1 text-center mr-11">Detalle de ficha</h1>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[360px] mx-auto px-4 py-6 pb-32">
                <div id="fichaCard" className="bg-white rounded-lg p-6 shadow-md mb-6">
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

                    {/* Información de Salida y Entrada unificada */}
                    {ficha.passDetails ? (
                        <>
                            {/* Salida */}
                            <div className="border-t pt-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-gray-500 text-sm">Salida registrada</h3>
                                    <Button variant="outline" size="sm" onClick={handleVerSalida} className="h-7 text-xs">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Ver salida
                                    </Button>
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
                                            <p className="text-black">{ficha.passDetails.mileage} km</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-orange-600" />
                                        <span className="text-orange-700 text-sm">Salida registrada</span>
                                    </div>
                                </div>
                            </div>

                            {/* Entrada */}
                            {ficha.estado === 'completada' && ficha.passDetails.endDate && (
                                <div className="border-t pt-4 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-gray-500 text-sm">Entrada registrada</h3>
                                        <Button variant="outline" size="sm" onClick={handleVerEntrada} className="h-7 text-xs">
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver entrada
                                        </Button>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-600">Fecha/Hora</p>
                                                <p className="text-black">{new Date(ficha.passDetails.endDate).toLocaleDateString()}</p>
                                                <p className="text-gray-500 text-xs">{new Date(ficha.passDetails.endDate).toLocaleTimeString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600">Kilometraje</p>
                                                <p className="text-black">{ficha.passDetails.mileage} km</p> {/* Note: API might need to return entry mileage separately */}
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span className="text-green-700 text-sm">Entrada completada</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}

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
                        <Button className="w-full h-12" onClick={handleOpenEnvioModal}>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar
                        </Button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                id="abrirSalidaBtn"
                                variant="outline"
                                onClick={onGoToSalida}
                                disabled={ficha.estado === 'con-salida' || ficha.estado === 'completada'}
                            >
                                Salida
                            </Button>
                            <Button
                                id="abrirEntradaBtn"
                                onClick={onGoToEntrada}
                                disabled={ficha.estado === 'creada' || ficha.estado === 'completada'}
                            >
                                Entrada
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Salida Modal */}
            {showSalidaModal && ficha.passDetails && (
                <Dialog open={showSalidaModal} onOpenChange={setShowSalidaModal}>
                    <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalles de Salida</DialogTitle>
                            <DialogDescription>Información del registro de salida.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-gray-500">Fecha</p><p>{new Date(ficha.passDetails.startDate || '').toLocaleDateString()}</p></div>
                                <div><p className="text-gray-500">Hora</p><p>{new Date(ficha.passDetails.startDate || '').toLocaleTimeString()}</p></div>
                                <div><p className="text-gray-500">Kilometraje</p><p>{ficha.passDetails.mileage} km</p></div>
                                <div><p className="text-gray-500">Combustible</p><p>{ficha.passDetails.fuel}/8</p></div>
                            </div>

                            {ficha.passDetails.comment_salida && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm mb-2">Observaciones de Salida</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{ficha.passDetails.comment_salida}</p>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <h4 className="text-sm mb-3">Evidencia Fotográfica (Salida)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {salidaInspections.filter(i => i.type === 'photo').map((insp) => (
                                        <div key={insp.id} className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center text-center border cursor-pointer" onClick={() => handleImageClick(insp.id.toString(), false)}>
                                            <Eye className="h-6 w-6 text-gray-500 mb-2" />
                                            <p className="text-xs text-gray-700">{getImageDisplayName(insp.part)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm mb-3">Firmas (Salida)</h4>
                                <div className="space-y-3">
                                    {salidaInspections.find(i => i.signature_conductor_url) && (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm">Firma del conductor</span></div>
                                    )}
                                    {salidaInspections.find(i => i.signature_approver_url) && (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm">Firma de quien aprueba</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Entrada Modal */}
            {showEntradaModal && ficha.passDetails && (
                <Dialog open={showEntradaModal} onOpenChange={setShowEntradaModal}>
                    <DialogContent className="max-w-[340px] rounded-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Detalles de Entrada</DialogTitle>
                            <DialogDescription>Información del registro de entrada.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-gray-500">Fecha</p><p>{new Date(ficha.passDetails.endDate || '').toLocaleDateString()}</p></div>
                                <div><p className="text-gray-500">Hora</p><p>{new Date(ficha.passDetails.endDate || '').toLocaleTimeString()}</p></div>
                                <div><p className="text-gray-500">Kilometraje</p><p>{ficha.passDetails.mileage} km</p></div>
                                <div><p className="text-gray-500">Combustible</p><p>{ficha.passDetails.fuel}/8</p></div>
                            </div>

                            {ficha.passDetails.comment_entrada && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm mb-2">Observaciones de Entrada</h4>
                                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{ficha.passDetails.comment_entrada}</p>
                                </div>
                            )}

                            <div className="border-t pt-4">
                                <h4 className="text-sm mb-3">Evidencia Fotográfica (Entrada)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {entradaInspections.filter(i => i.type === 'photo').map((insp) => (
                                        <div key={insp.id} className="bg-gray-100 rounded-lg p-3 aspect-square flex flex-col items-center justify-center text-center border cursor-pointer" onClick={() => handleImageClick(insp.id.toString(), true)}>
                                            <Eye className="h-6 w-6 text-gray-500 mb-2" />
                                            <p className="text-xs text-gray-700">{getImageDisplayName(insp.part)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm mb-3">Firmas (Entrada)</h4>
                                <div className="space-y-3">
                                    {entradaInspections.find(i => i.signature_conductor_url) && (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm">Firma del conductor</span></div>
                                    )}
                                    {entradaInspections.find(i => i.signature_approver_url) && (
                                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-sm">Firma de quien aprueba</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Visor de galería de fotos */}
            <PhotoGalleryViewer
                photos={(() => {
                    const inspections = ficha.passDetails?.inspections || [];
                    return inspections
                        .filter(insp => insp.type === 'photo')
                        .map(insp => ({
                            id: insp.id.toString(),
                            url: `http://localhost:8000${insp.photo_url}`,
                            label: insp.comment || getImageDisplayName(insp.part),
                        }));
                })()}
                initialIndex={galleryViewer.initialIndex}
                open={galleryViewer.open}
                onOpenChange={(open) => setGalleryViewer({ ...galleryViewer, open })}
            />
        </div>
    );
}
