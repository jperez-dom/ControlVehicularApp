import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { FuelGauge } from './FuelGauge';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { toast } from "sonner";
import { inspectionsAPI } from '../api';
import grupoOptimoLogo from 'figma:asset/220b05f22fbef50eaf6e2085eb40125dfd99d55b.png';

// --- INTERFACES ---
interface InspectionData {
    id: number;
    type: 'photo' | 'signature';
    part: string;
    comment: string | null;
    photo_url: string | null;
}

interface PassDetails {
    id: number;
    departureMileage: number | null;
    departureFuel: string; // Cambiado de fuel
    comment_salida: string | null;
    inspections: InspectionData[];
}

interface FichaGuardada {
    folio: string;
    passDetails: PassDetails | null;
}

interface FormularioSalidaProps {
    ficha: FichaGuardada;
    onBack: () => void;
    onComplete: (salidaData: any) => void;
}

export function FormularioSalida({ ficha, onBack, onComplete }: FormularioSalidaProps) {
    const [kmSalida, setKmSalida] = useState('');
    const [combustible, setCombustible] = useState(8);
    const [departure_comment, setDepartureComment] = useState('');
    const [firmaConductor, setFirmaConductor] = useState<string | null>(null);
    const [firmaAprobador, setFirmaAprobador] = useState<string | null>(null);
    const [existingPhotos, setExistingPhotos] = useState<InspectionData[]>([]);
    const [newPhotos, setNewPhotos] = useState<{[key: string]: string}>({});
    const [photoCaptureModal, setPhotoCaptureModal] = useState({ open: false, photoKey: '', photoLabel: '' });
    const [originalSignatures, setOriginalSignatures] = useState<InspectionData[]>([]);

    const isEditing = !!ficha.passDetails;

    useEffect(() => {
        if (isEditing && ficha.passDetails) {
            const { departureMileage, departureFuel, comment_salida, inspections } = ficha.passDetails;
            setKmSalida(departureMileage?.toString() || '');
            setCombustible(parseInt(departureFuel, 10) || 8); // Cambiado de fuel
            setDepartureComment(comment_salida || '');

            const photos = inspections.filter(i => i.type === 'photo' && !i.part.includes('_entry'));
            setExistingPhotos(photos);

            const signatures = inspections.filter(i => i.type === 'signature' && !i.part.includes('_entry'));
            setOriginalSignatures(signatures);

            const conductorSignature = signatures.find(s => s.part.startsWith('conductor_'));
            setFirmaConductor(conductorSignature?.photo_url || null);

            const approverSignature = signatures.find(s => s.part.startsWith('approver_'));
            setFirmaAprobador(approverSignature?.photo_url || null);
        }
    }, [ficha, isEditing]);

    const handlePhotoCapture = (photoKey: string, photoLabel: string) => {
        setPhotoCaptureModal({ open: true, photoKey, photoLabel });
    };

    const handlePhotoConfirm = (photoData: string) => {
        const { photoKey } = photoCaptureModal;
        if (!photoKey) return;

        setNewPhotos(prev => ({ ...prev, [photoKey]: photoData }));
        setPhotoCaptureModal({ open: false, photoKey: '', photoLabel: '' });
    };

    const handleDeleteExistingPhoto = async (e: React.MouseEvent, photoId: number) => {
        e.stopPropagation();
        try {
            await inspectionsAPI.delete(photoId);
            setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
            toast.success('Foto eliminada');
        } catch (error) {
            toast.error('Error al eliminar la foto');
        }
    };

    const handleDeleteNewPhoto = (e: React.MouseEvent, photoKey: string) => {
        e.stopPropagation();
        setNewPhotos(prev => {
            const updated = { ...prev };
            delete updated[photoKey];
            return updated;
        });
    };

    const handleSubmit = () => {
        const firmasNuevas: { [key: string]: string } = {};
        const firmasParaBorrar: number[] = [];

        const originalConductorSig = originalSignatures.find(s => s.part.startsWith('conductor_'));
        if (firmaConductor && firmaConductor.startsWith('data:image')) {
            firmasNuevas['conductor_salida'] = firmaConductor;
        }
        if (originalConductorSig && firmaConductor !== originalConductorSig.photo_url) {
            firmasParaBorrar.push(originalConductorSig.id);
        }

        const originalApproverSig = originalSignatures.find(s => s.part.startsWith('approver_'));
        if (firmaAprobador && firmaAprobador.startsWith('data:image')) {
            firmasNuevas['approver_salida'] = firmaAprobador;
        }
        if (originalApproverSig && firmaAprobador !== originalApproverSig.photo_url) {
            firmasParaBorrar.push(originalApproverSig.id);
        }

        onComplete({
            kmSalida,
            combustible,
            departure_comment,
            fotos: newPhotos,
            firmas: firmasNuevas,
            firmasParaBorrar: firmasParaBorrar,
        });
    };

    const renderPhotoInput = (key: string, label: string) => {
        const existingPhoto = existingPhotos.find(p => p.part === key);
        const newPhoto = newPhotos[key];
        const photoUrl = newPhoto || existingPhoto?.photo_url;

        return (
            <div className="relative text-center">
                <div
                    onClick={() => !photoUrl && handlePhotoCapture(key, label)}
                    className={`aspect-square w-full rounded-md border border-dashed flex items-center justify-center transition-colors overflow-hidden ${
                        photoUrl 
                        ? 'border-gray-300' 
                        : 'border-gray-300 hover:border-gray-400 text-gray-500 cursor-pointer'
                    }`}>
                    {photoUrl ? (
                        <img src={photoUrl} alt={label} className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="h-4 w-4" />
                    )}
                </div>
                {photoUrl && (
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={(e) => newPhoto ? handleDeleteNewPhoto(e, key) : handleDeleteExistingPhoto(e, existingPhoto!.id)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full h-6 w-6 hover:bg-black/75 transition-colors"
                        aria-label={`Eliminar foto de ${label}`}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-12 bg-black"></div>
            <div className="bg-black px-4 py-2"><div className="flex items-center justify-center"><img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto object-contain" /></div></div>
            <div className="bg-white px-4 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto"><ArrowLeft className="h-5 w-5" /></Button>
                    <h1 className="text-black text-xl flex-1 text-center mr-11">{isEditing ? 'Editar Salida' : 'Registrar Salida'}</h1>
                </div>
            </div>

            <div className="overflow-y-auto pb-32">
                <div className="max-w-[360px] mx-auto px-4 py-6 space-y-6">
                    <div className="bg-white rounded-lg p-4 space-y-6">
                        <div>
                            <Label>Kilometraje de Salida</Label>
                            <Input value={kmSalida} onChange={(e) => setKmSalida(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className="mt-1 h-10" type="number" />
                        </div>

                        <div>
                            <Label>Nivel de combustible</Label>
                            <div className="mt-2"><FuelGauge value={combustible} onChange={setCombustible} /></div>
                        </div>

                        <div>
                            <Label>Evidencia Fotográfica</Label>
                            <div className="mt-2 grid grid-cols-4 gap-2">
                                <div className="text-center">
                                    {renderPhotoInput('mileage', 'Odómetro')}
                                    <p className="text-xs text-gray-600 mt-1">Odómetro</p>
                                </div>
                                <div className="text-center">
                                    {renderPhotoInput('front', 'Frontal')}
                                    <p className="text-xs text-gray-600 mt-1">Frontal</p>
                                </div>
                                <div className="text-center">
                                    {renderPhotoInput('right_side', 'Lat. Derecho')}
                                    <p className="text-xs text-gray-600 mt-1">Lat. Der.</p>
                                </div>
                                <div className="text-center">
                                    {renderPhotoInput('left_side', 'Lat. Izquierdo')}
                                    <p className="text-xs text-gray-600 mt-1">Lat. Izq.</p>
                                </div>
                                <div className="text-center">
                                    {renderPhotoInput('back', 'Posterior')}
                                    <p className="text-xs text-gray-600 mt-1">Posterior</p>
                                </div>
                                <div className="text-center">
                                    {renderPhotoInput('interior', 'Interior')}
                                    <p className="text-xs text-gray-600 mt-1">Interior</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="departure_comment">Comentarios de Salida (opcional)</Label>
                            <Textarea id="departure_comment" placeholder="Observaciones..." value={departure_comment} onChange={(e) => setDepartureComment(e.target.value)} rows={3} className="mt-2 resize-none" />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <div>
                                <Label>Firma del conductor</Label>
                                <div className="mt-2"><SignaturePad onSignatureChange={setFirmaConductor} existingSignature={firmaConductor} /></div>
                            </div>
                            <div>
                                <Label>Firma de quien aprueba</Label>
                                <div className="mt-2"><SignaturePad onSignatureChange={setFirmaAprobador} existingSignature={firmaAprobador} /></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
                <div className="max-w-[360px] mx-auto">
                    <Button className="w-full h-12" onClick={handleSubmit}>Guardar Salida</Button>
                </div>
            </div>

            <PhotoCaptureModal
                open={photoCaptureModal.open}
                onOpenChange={(open) => !open && setPhotoCaptureModal({ open: false, photoKey: '', photoLabel: '' })}
                onPhotoCapture={handlePhotoConfirm}
                photoType={photoCaptureModal.photoLabel}
            />
        </div>
    );
}
