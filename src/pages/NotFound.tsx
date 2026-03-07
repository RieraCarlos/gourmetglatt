import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                    <h1 className="text-[120px] font-black text-primary/10 leading-none">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-2xl font-bold">Página no encontrada</p>
                    </div>
                </div>

                <p className="text-muted-foreground">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-secondary transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Volver atrás
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
                    >
                        <Home className="w-5 h-5" />
                        Ir al Inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
