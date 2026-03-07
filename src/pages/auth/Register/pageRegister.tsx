import { RegisterForm } from "./form-register"

export default function RegisterPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center px-6 md:px-10">
            <div className="w-full max-w-sm md:max-w-4xl">
                <RegisterForm />
            </div>
        </div>
    )
}
