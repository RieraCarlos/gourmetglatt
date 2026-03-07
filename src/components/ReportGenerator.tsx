import React from 'react';
import { useAppSelector } from '../app/hook';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FileDown, FileText } from 'lucide-react';

const ReportGenerator: React.FC = () => {
    const { items: products } = useAppSelector((state) => state.products);
    const { items: movements } = useAppSelector((state) => state.movements);

    const downloadInventoryPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Gourmet Glatt Inventory Report', 14, 22);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 30);

        const tableData = products.map(p => [
            p.barcode,
            p.name,
            p.category || 'N/A',
            `$${p.price?.toFixed(2) || '0.00'}`,
            p.stock.toString()
        ]);

        (doc as any).autoTable({
            head: [['Código', 'Producto', 'Categoría', 'Precio', 'Stock']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillStyle: '#000000', textColor: '#FFFFFF' },
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

        (doc as any).autoTable({
            head: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Usuario']],
            body: tableData,
            startY: 40,
            theme: 'grid',
            headStyles: { fillStyle: '#000000', textColor: '#FFFFFF' },
        });

        doc.save(`movimientos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="flex flex-wrap gap-4">
            <button
                onClick={downloadInventoryPDF}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            >
                <FileDown className="w-5 h-5" />
                Exportar Inventario (PDF)
            </button>
            <button
                onClick={downloadMovementsPDF}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary text-foreground font-bold hover:bg-secondary/70 transition-all"
            >
                <FileText className="w-5 h-5" />
                Exportar Movimientos (PDF)
            </button>
        </div>
    );
};

export default ReportGenerator;
