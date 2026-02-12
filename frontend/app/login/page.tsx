"use client"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LaunchpadBackground } from "@/components/LaunchpadBackground"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const router = useRouter()

    const handleLogin = async () => {
        await authClient.signIn.email({
            email,
            password,
            callbackUrl: "/"
        })
        router.refresh()
    }

    const handleGithub = async () => {
        await authClient.signIn.social({
            provider: "github",
            callbackUrl: "/"
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4 relative overflow-hidden">
            <LaunchpadBackground />
            <div className="w-full max-w-sm space-y-6 relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Welcome back</h1>
                    <p className="text-neutral-400">Sign in to your account to continue</p>
                </div>

                <Button onClick={handleGithub} variant="outline" className="w-full bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white">
                    Continue with GitHub
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-800"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-black px-2 text-neutral-500">OR CONTINUE WITH</span></div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:ring-white focus:border-white"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <Input
                            type="password"
                            className="bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus:ring-white focus:border-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleLogin} className="w-full bg-white text-black hover:bg-neutral-200">
                        Sign in
                    </Button>
                </div>

                <p className="text-center text-sm text-neutral-400">
                    Don't have an account? <Link href="/signup" className="text-white hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    )
}
