import { useState, useRef } from 'react';
import { useAppDispatch } from '@/app/hook';
import { fetchProductByBarcode } from '@/features/products/productsSlice';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductForm from '@/components/ProductForm';
import StockMovementForm from '@/components/StockMovementForm';
import type { Product } from '@/app/types/database';

export default function ScanInventory() {
    const dispatch = useAppDispatch();

    const [isScanning, setIsScanning] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    // El producto que vamos a editar o mover stock, si ya existe
    const [existingProduct, setExistingProduct] = useState<Product | null>(null);
    // El código de barras a registrar, si no existe
    const [barcodeToRegister, setBarcodeToRegister] = useState<string | null>(null);

    const isProcessingRef = useRef(false);

    const handleScan = async (barcode: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;

        // Iniciar la verificación inmediatamente y ocultar la cámara
        setIsScanning(false);
        setIsVerifying(true);

        try {
            const resultAction = await dispatch(fetchProductByBarcode(barcode)).unwrap();
            // Producto encontrado, pasamos el objeto al StockMovementForm

            setExistingProduct(resultAction);
        } catch (err: any) {
            // Producto no encontrado, guardamos el código y abrimos ProductForm nuevo
            console.error('Scan error (Not Found)', err);
            setBarcodeToRegister(barcode);
        } finally {
            setIsVerifying(false);
            isProcessingRef.current = false;
        }
    };

    const handleProductFormClose = () => {
        // Al cerrar los formularios, reiniciamos todo al estado inicial
        setExistingProduct(null);
        setBarcodeToRegister(null);
        setIsScanning(true);
    };

    return (
        <div className="flex flex-col items-center justify-start p-6">
            <h1 className="text-2xl font-bold mb-4">Escanear Inventario</h1>

            {isScanning && (
                <div className="w-full max-w-md">
                    <BarcodeScanner
                        onScan={handleScan}
                        onClose={() => setIsScanning(false)}
                    />
                </div>
            )}

            {isVerifying && (
                <div className="w-full max-w-md p-10 flex flex-col items-center justify-center bg-card rounded-3xl shadow-lg border border-border animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                    <h2 className="text-lg font-bold">Verificando Código...</h2>
                    <p className="text-sm text-muted-foreground text-center mt-2">Consultando la base de datos</p>
                </div>
            )}

            {/* Formulario para Registrar Nuevo Producto */}
            {barcodeToRegister && !isVerifying && (
                <ProductForm
                    initialBarcode={barcodeToRegister}
                    onClose={handleProductFormClose}
                />
            )}

            {/* Formulario para Registrar Movimiento de Stock en Producto Existente */}
            {existingProduct && !isVerifying && (
                <StockMovementForm
                    product={existingProduct}
                    onClose={handleProductFormClose}
                />
            )}

            {/* Botón de reinicio si se cerró el escáner y no hay ninguna otra vista activa */}
            {!isScanning && !isVerifying && !existingProduct && !barcodeToRegister && (
                <button
                    onClick={() => setIsScanning(true)}
                    className="w-full max-w-md py-4 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
                >
                    Abrir Escáner Nuevamente
                </button>
            )}
        </div>
    );
}