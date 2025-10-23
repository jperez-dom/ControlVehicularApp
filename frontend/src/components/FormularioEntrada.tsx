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
    arrivalMileage: number | null;
    fuel: string;
    comment_entrada: string | null;
    endDate: string | null;
    inspections: InspectionData[];
}

interface FichaGuardada {
    folio: string;
    passDetails: PassDetails | null;
}

interface FormularioEntradaProps {
    ficha: FichaGuardada;
    onBack: () => void;
    onComplete: (entradaData: any) => void;
}

export function FormularioEntrada({ ficha, onBack, onComplete }: FormularioEntradaProps) {
    const [kmEntrada, setKmEntrada] = useState('');
    const [combustible, setCombustible] = useState(8);
    const [arrival_comment, setArrivalComment] = useState('');
    const [firmaConductor, setFirmaConductor] = useState<string | null>(null);
    const [firmaAprobador, setFirmaAprobador] = useState<string | null>(null);
    const [existingPhotos, setExistingPhotos] = useState<InspectionData[]>([]);
    const [newPhotos, setNewPhotos] = useState<{[key: string]: string}>({});
    const [photoCaptureModal, setPhotoCaptureModal] = useState({ open: false, photoKey: '', photoLabel: '' });

    const isEditing = !!(ficha.passDetails?.endDate && new Date(ficha.passDetails.endDate).getFullYear() > 1970);

    useEffect(() => {
        if (isEditing && ficha.passDetails) {
            const { arrivalMileage, fuel, comment_entrada, inspections } = ficha.passDetails;
            setKmEntrada(arrivalMileage?.toString() || '');
            setCombustible(parseInt(fuel, 10) || 8);
            setArrivalComment(comment_entrada || '');
            setExistingPhotos(inspections.filter(i => i.type === 'photo' && i.part.includes('_entry')));
        }
    }, [ficha, isEditing]);

    const handlePhotoCapture = (photoKey: string, photoLabel: string) => {
        setPhotoCaptureModal({ open: true, photoKey, photoLabel });
    };

    const handlePhotoConfirm = (photoData: string) => {
        setNewPhotos(prev => ({ ...prev, [photoCaptureModal.photoKey]: photoData }));
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
        onComplete({
            kmEntrada,
            combustible,
            arrival_comment,
            firmaConductor,
            firmaAprobador,
            fotos: newPhotos,
        });
    };

    const renderPhotoInput = (key: string, label: string) => {
        const existingPhoto = existingPhotos.find(p => p.part === `${key}_entry`);
        const newPhoto = newPhotos[key];
        const isCaptured = !!existingPhoto || !!newPhoto;

        return (
            <div className="relative text-center">
                <div
                    onClick={() => !isCaptured && handlePhotoCapture(key, label)}
                    className={`aspect-square w-full rounded-md border border-dashed p-2 flex flex-col items-center justify-center transition-colors cursor-pointer ${isCaptured ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 hover:border-gray-400 text-gray-500'}`}>
                    <Camera className="h-5 w-5" />
                    <span className="text-xs mt-1 leading-tight">{label}</span>
                </div>
                {isCaptured && (
                    <button
                        type="button"
                        onClick={(e) => newPhoto ? handleDeleteNewPhoto(e, key) : handleDeleteExistingPhoto(e, existingPhoto!.id)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 h-5 w-5 flex items-center justify-center shadow-md">
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="h-12 bg-black"></div>
            <div className="bg-black px-4 py-2"><div className="flex items-center justify-center"><img src={grupoOptimoLogo} alt="GRUPO OPTIMO" className="h-12 w-auto" /></div></div>
            <div className="bg-white px-4 py-4 border-b">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-auto"><ArrowLeft className="h-5 w-5" /></Button>
                    <h1 className="text-black text-xl flex-1 text-center mr-11">{isEditing ? 'Editar Entrada' : 'Registrar Entrada'}</h1>
                </div>
            </div>

            <div className="overflow-y-auto pb-32">
                <div className="max-w-[360px] mx-auto px-4 py-6 space-y-6">
                    <div className="bg-white rounded-lg p-4 space-y-6">
                        <div>
                            <Label>Kilometraje de Entrada</Label>
                            <Input value={kmEntrada} onChange={(e) => setKmEntrada(e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" className="mt-1 h-10" type="number" />
                        </div>

                        <div>
                            <Label>Nivel de combustible</Label>
                            <div className="mt-2"><FuelGauge value={combustible} onChange={setCombustible} /></div>
                        </div>

                        <div>
                            <Label>Evidencia Fotográfica</Label>
                            <div className="mt-2 grid grid-cols-3 gap-3">
                                {renderPhotoInput('mileage', 'Odómetro')}
                                {renderPhotoInput('front', 'Frontal')}
                                {renderPhotoInput('right_side', 'Lat. Derecho')}
                                {renderPhotoInput('left_side', 'Lat. Izquierdo')}
                                {renderPhotoInput('back', 'Posterior')}
                                {renderPhotoInput('interior', 'Interior')}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="arrival_comment">Comentarios de Entrada (opcional)</Label>
                            <Textarea id="arrival_comment" placeholder="Observaciones..." value={arrival_comment} onChange={(e) => setArrivalComment(e.target.value)} rows={3} className="mt-2 resize-none" />
                        </div>

                        {!isEditing && (
                            <div className="space-y-4 border-t pt-4">
                                <div>
                                    <Label>Firma del conductor</Label>
                                    <div className="mt-2"><SignaturePad onSignatureChange={setFirmaConductor} /></div>
                                </div>
                                <div>
                                    <Label>Firma de quien aprueba</Label>
                                    <div className="mt-2"><SignaturePad onSignatureChange={setFirmaAprobador} /></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 shadow-lg">
                <div className="max-w-[360px] mx-auto">
                    <Button className="w-full h-12" onClick={handleSubmit}>Guardar Entrada</Button>
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
