import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X } from 'lucide-react';

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const readerRef = useRef<BrowserMultiFormatReader | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    let scanning = false;

    const onScanRef = useRef(onScan);
    const videoId = React.useMemo(() => `reader-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setErrorMsg("La cámara no está disponible. Asegúrate de dar los permisos y usar una conexión segura (HTTPS).");
            return;
        }

        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;
        let controls: any;
        let isUnmounted = false;

        const constraints: MediaStreamConstraints = {
            video: {
                facingMode: 'environment', // Priorizar cámara trasera en móviles
                width: { ideal: 1280 },
                height: { ideal: 720 },
                advanced: [{ focusMode: 'continuous' } as any] // Intentar autoenfoque si el navegador lo soporta
            }
        };

        reader
            .decodeFromConstraints(constraints, videoId, (result: any, _error: any) => {
                if (result && !scanning) {
                    scanning = true;

                    const decodedText = result.getText();


                    // Reproducir un sonido corto o vibración si está disponible
                    if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) {
                        try {
                            navigator.vibrate(200);
                        } catch (e) {
                            // Ignore
                        }
                    }

                    onScanRef.current(decodedText);

                    // block for 2 seconds to avoid duplicate reads
                    setTimeout(() => {
                        scanning = false;
                    }, 2000);
                }
                // ignore errors
            })
            .then((c) => {
                controls = c;
                if (isUnmounted) {
                    controls.stop();
                }
            })
            .catch((err: any) => {
                if (!isUnmounted) {
                    console.error('Error starting ZXing scanner', err);
                    setErrorMsg("No se pudo iniciar la cámara. Verifica los permisos.");
                }
            });

        return () => {
            isUnmounted = true;
            if (controls) {
                controls.stop();
            }
            if (typeof (reader as any).reset === 'function') {
                (reader as any).reset();
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-card rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold">Escanear Código</h3>
                        <p className="text-sm text-muted-foreground">Encuadra el código de barras en el recuadro.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-secondary transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 relative">
                    {errorMsg ? (
                        <div className="w-full p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-center flex flex-col items-center justify-center min-h-[300px]">
                            <p className="text-sm font-medium">{errorMsg}</p>
                        </div>
                    ) : (
                        <div className="relative w-full overflow-hidden rounded-2xl border-2 border-primary/20 bg-black min-h-[300px]">
                            <video
                                id={videoId}
                                playsInline
                                muted
                                autoPlay
                                className="absolute inset-0 w-full h-full object-cover"
                            />

                            {/* Visual Overlay Framework */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col">
                                {/* Top blanking */}
                                <div className="flex-1 bg-black/40"></div>

                                {/* Center scanning area */}
                                <div className="h-32 flex">
                                    <div className="flex-1 bg-black/40"></div>
                                    <div className="w-64 relative border-2 border-primary/50 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                                        {/* Corner markers */}
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg"></div>

                                        {/* Animated scanning line */}
                                        <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_2px_#22c55e] animate-scan-line"></div>
                                    </div>
                                    <div className="flex-1 bg-black/40"></div>
                                </div>

                                {/* Bottom blanking */}
                                <div className="flex-1 bg-black/40"></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-secondary/30 text-center">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Asegúrate de tener buena iluminación</p>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
