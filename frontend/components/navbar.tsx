"use client"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function Navbar() {
    const { data: session } = authClient.useSession()
    const router = useRouter()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-transparent">
            <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>Launchpad</span>
            </Link>

            <div className="flex items-center gap-4">
                {session ? (
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-medium">{session.user.name}</span>
                            <span className="text-xs text-muted-foreground">{session.user.email}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                                await authClient.signOut()
                                router.refresh()
                            }}
                        >
                            Log Out
                        </Button>
                        {/* Avatar Placeholder */}
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium">
                            {session.user.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                ) : null}
            </div>
        </nav>
    )
}
