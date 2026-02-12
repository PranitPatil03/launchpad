
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
            <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold font-outfit text-slate-900 tracking-tight">Launchpad</span>
            </Link>

            <div className="flex items-center gap-4">
                <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">
                    Log in
                </Link>
                <Link href="/register">
                    <Button className="bg-slate-900 text-white hover:bg-slate-800 font-medium rounded-full px-6">
                        Sign up
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
