import { LoginForm } from "./form-login"
export default function LoginPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center px-10 md:px-12">
            <div className="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    )
}
