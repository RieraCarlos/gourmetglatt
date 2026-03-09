import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hook';
import { fetchProducts } from '../features/products/productsSlice';
import { fetchMovements } from '../features/movements/movementsSlice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, FileText } from 'lucide-react';

const ReportGenerator: React.FC = () => {
    const dispatch = useAppDispatch();
    const { items: products, loading: productsLoading } = useAppSelector((state) => state.products);
    const { items: movements, loading: movementsLoading } = useAppSelector((state) => state.movements);

    useEffect(() => {
        if (products.length === 0) dispatch(fetchProducts());
        if (movements.length === 0) dispatch(fetchMovements());
    }, [dispatch, products.length, movements.length]);

    const isLoading = productsLoading || movementsLoading;

    const downloadInventoryPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Gourmet Glatt Inventory Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = products.map(p => [
            p.barcode,
            p.name,
        ]);

        autoTable(doc, {
            head: [['Código', 'Producto']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: '#000000', textColor: '#FFFFFF' },
        });

        doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const downloadMovementsPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Gourmet Glatt Movements Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = movements.map((m: any) => [
            new Date(m.created_at).toLocaleDateString(),
            m.type,
            m.products?.name || 'Unknown',
            m.quantity.toString(),
            m.user_id.split('-')[0]
        ]);

        autoTable(doc, {
            head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: '#000000', textColor: '#FFFFFF' },
        });

        doc.save(`movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex flex-wrap gap-4 space-y-6 p-6 w-full">
            <button
                onClick={downloadInventoryPDF}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
                <FileDown className="w-5 h-5" />
                {isLoading ? 'Cargando...' : 'Exportar Inventario (PDF)'}
            </button>
            <button
                onClick={downloadMovementsPDF}
                disabled={isLoading}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/70 transition-all disabled:opacity-50"
            >
                <FileText className="w-5 h-5" />
                {isLoading ? 'Cargando...' : 'Exportar Movimientos (PDF)'}
            </button>
        </div>
    );
};

export default ReportGenerator;
