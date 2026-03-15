import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { Button } from './ui/button';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  React.useEffect(() => {
    if (needRefresh) {
      toast.custom((t) => (
        <div className="flex flex-col gap-3 p-4 bg-[#202312] border border-[#3b4125] rounded-2xl shadow-2xl text-white min-w-[320px]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#3b4125]">
                <RefreshCw className="w-5 h-5 text-[#6E7647] animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Nueva versión disponible</h3>
                <p className="text-[10px] font-bold text-[#6E7647] uppercase tracking-widest opacity-80">Gourmet Glatt v2.0 - Analytical Update</p>
              </div>
            </div>
            <button onClick={() => toast.dismiss(t)} className="text-[#6E7647] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-[#3b4125] hover:bg-[#525834] text-white text-[10px] font-black uppercase tracking-widest h-9"
            >
              Actualizar Ahora
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => close()}
              className="flex-1 border-[#3b4125] text-[#6E7647] hover:bg-[#3b4125]/20 text-[10px] font-black uppercase tracking-widest h-9"
            >
              Más tarde
            </Button>
          </div>
        </div>
      ), { duration: Infinity, position: 'bottom-right' });
    }

    if (offlineReady) {
      toast.custom((t) => (
        <div className="flex items-center gap-3 p-4 bg-[#202312] border border-[#3b4125] rounded-2xl shadow-2xl text-white">
          <div className="p-2 rounded-lg bg-[#3b4125]">
            <WifiOff className="w-5 h-5 text-[#6E7647]" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">Modo Offline Listo</h3>
            <p className="text-[10px] font-bold text-[#6E7647] uppercase tracking-widest opacity-80">La app está lista para trabajar sin red</p>
          </div>
          <button onClick={() => toast.dismiss(t)} className="text-[#6E7647] hover:text-white transition-colors ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      ), { position: 'bottom-right' });
    }
  }, [needRefresh, offlineReady, updateServiceWorker]);

  return null;
};

export default ReloadPrompt;
