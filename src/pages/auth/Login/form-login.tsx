import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAppDispatch } from "@/app/hook"
import { setAuth, setError, setLoading, fetchCurrentUserProfile } from "@/features/auth/authSlice"
import { supabase } from "@/lib/supabase"
import { LogIn, Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loginSchema = z.object({
    email: z.string().email("Por favor, introduce un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [showPassword, setShowPassword] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const from = location.state?.from?.pathname || '/';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const onSubmit = async (values: LoginFormValues) => {
        setLocalLoading(true);
        dispatch(setLoading(true));

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            });

            if (error) throw error;

            if (data.user && data.session) {
                // Primero establecemos la sesión básica
                dispatch(setAuth({
                    user: null, // Se llenará en el siguiente paso
                    session: data.session
                }));

                // Cargamos el perfil completo (incluyendo sector_id)
                const resultAction = await dispatch(fetchCurrentUserProfile(data.user.id));
                
                if (fetchCurrentUserProfile.fulfilled.match(resultAction)) {
                    navigate(from, { replace: true });
                } else {
                    throw new Error("No se pudo cargar el perfil del usuario");
                }
            }
        } catch (err: any) {
            dispatch(setError(err.message));
            // Use sonner or a more subtle error UI instead of alert if possible, 
            // but keeping current logic for now.
        } finally {
            setLocalLoading(false);
            dispatch(setLoading(false));
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden border-0 shadow-none md:border md:shadow-md">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup className="gap-6">
                            <div className="flex flex-col items-center gap-2 text-center mb-4">
                                <h1 className="text-3xl font-bold text-[#3b4125] tracking-tight">Welcome</h1>
                                <p className="text-muted-foreground text-balance text-sm group-has-data-[slot=input]:text-base">
                                    Enter to your account of <b className="text-[#6E7647]">store-inventory</b>
                                </p>
                            </div>

                            <Field className="gap-2">
                                <FieldLabel htmlFor="email" className="text-sm font-semibold">Email</FieldLabel>
                                <Input
                                    {...register("email")}
                                    id="email"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="admin@store-inventory.com"
                                    className={cn(
                                        "h-11 text-base md:text-sm transition-all focus-visible:none",
                                        errors.email && "border-destructive focus-visible:ring-destructive"
                                    )}
                                />
                                <FieldError errors={[{ message: errors.email?.message }]} />
                            </Field>

                            <Field className="gap-2">
                                <div className="flex items-center justify-between">
                                    <FieldLabel htmlFor="password" className="text-sm font-semibold">Contraseña</FieldLabel>

                                </div>
                                <div className="relative">
                                    <Input
                                        {...register("password")}
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className={cn(
                                            "h-11 text-base md:text-sm pr-12 transition-all focus-visible:none",
                                            errors.password && "border-destructive focus-visible:ring-destructive"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center "
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <Eye className="w-5 absolute" /> : <EyeOff className="w-5 absolute" />}
                                    </button>
                                </div>
                                <FieldError errors={[{ message: errors.password?.message }]} />
                            </Field>

                            <Button
                                type="submit"
                                disabled={localLoading}
                                className="h-12 w-full bg-[#3b4125] hover:bg-[#202312] text-white font-bold text-base shadow-lg shadow-[#747d42]/20 rounded-xl transition-all active:scale-[0.98]"
                            >
                                {localLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <p>Log in</p>
                                        <LogIn className="ml-2 w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </FieldGroup>
                    </form>
                    <div className="bg-muted relative hidden md:block overflow-hidden">
                        <div className="absolute inset-0  mix-blend-multiply z-10" />
                        <img
                            src="/images/fondo.png"
                            alt="Background"
                            className="absolute inset-0 h-full w-full object-cover rounded-2xl"
                        />
                    </div>
                </CardContent>
            </Card>
            <p className="px-6 text-center text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our <a href="#" className="underline">Terms of Service</a>{" "}
                and <a href="#" className="underline">Privacy Policy</a>.
            </p>
        </div>
    )
}

