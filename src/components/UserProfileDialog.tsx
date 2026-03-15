import React from 'react';
import { useAppDispatch } from '@/app/hook';
import { updateUserProfile } from '@/features/auth/authSlice';
import type { UserProfile } from '@/features/auth/authSlice';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconRefresh, IconUser } from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';

interface UserProfileDialogProps {
    user: UserProfile;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
    user,
    open,
    onOpenChange,
}) => {
    const dispatch = useAppDispatch();
    const [name, setName] = React.useState(user.name || '');
    const [avatarUrl, setAvatarUrl] = React.useState(user.avatar_url || '');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // DiceBear configuration
    const generateRandomAvatar = () => {
        const seed = Math.random().toString(36).substring(7);
        const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        setAvatarUrl(newAvatarUrl);
    };

    // Ensure state is synced when dialog opens
    React.useEffect(() => {
        if (open) {
            setName(user.name || '');
            setAvatarUrl(user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`);
        }
    }, [open, user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await dispatch(updateUserProfile({
                id: user.id,
                name,
                avatar_url: avatarUrl,
            })).unwrap();
            toast.success('Perfil actualizado correctamente');
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error || 'Error al actualizar el perfil');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-[#202312] border-[#3b4125]/20 text-white rounded-3xl overflow-hidden shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#3b4125]/30">
                            <IconUser className="size-5 text-[#6E7647]" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Editar Perfil</DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-[#6E7647] uppercase tracking-widest">
                                Personaliza tus datos y avatar oficial
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="relative group">
                            <Avatar className="size-24 rounded-full border-4 border-[#3b4125] shadow-xl">
                                <AvatarImage src={avatarUrl} alt={name} />
                                <AvatarFallback className="bg-[#3b4125] text-white text-2xl font-black">
                                    {name.substring(0, 2).toUpperCase() || 'GG'}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                onClick={generateRandomAvatar}
                                className="absolute bottom-0 right-0 size-8 rounded-full bg-[#3b4125] hover:bg-[#525834] border-2 border-[#202312] text-white shadow-lg transition-all active:scale-95"
                                title="Generar nuevo avatar"
                            >
                                <IconRefresh className="size-4" />
                            </Button>
                        </div>
                        <p className="text-[9px] font-bold text-[#6E7647] uppercase tracking-widest text-center max-w-[200px]">
                            Usa el botón de refresco para generar un avatar único de DiceBear
                        </p>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2 px-1">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-[#6E7647] ml-1">Nombre Completo</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tu nombre"
                                className="rounded-xl border-[#3b4125]/20 bg-[#3b4125]/10 text-white placeholder:text-white/20 h-11 focus-visible:ring-[#3b4125]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2 px-1 opacity-60">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#6E7647] ml-1">Email (Fijo)</Label>
                                <div className="h-11 flex items-center px-4 rounded-xl border border-white/5 bg-white/5 text-[11px] font-medium truncate">
                                    {user.email}
                                </div>
                            </div>
                            <div className="space-y-2 px-1 opacity-60">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#6E7647] ml-1">Rol (Fijo)</Label>
                                <div className="h-11 flex items-center px-4 rounded-xl border border-white/5 bg-white/5 text-[11px] font-bold uppercase tracking-widest">
                                    {user.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="bg-transparent text-[#6E7647] hover:bg-white/5 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-12"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#3b4125] hover:bg-[#525834] text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-12 flex-1 shadow-[0_4px_14px_0_rgba(59,65,37,0.39)] transition-all"
                        >
                            {isSubmitting ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : null}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
