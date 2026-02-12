"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Clock, FolderOpen, CreditCard, LogOut, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { LaunchpadBackground } from "@/components/LaunchpadBackground";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const { data: session } = authClient.useSession();

  // Mock recent projects for now
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    setRecentProjects([
      { id: "1", name: "nextjs-blog", createdAt: Date.now() - 1000 * 60 * 5 },
      { id: "2", name: "e-commerce-platform", createdAt: Date.now() - 1000 * 60 * 60 * 24 },
    ]);
  }, []);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/login?callbackUrl=/?repo=" + encodeURIComponent(repoUrl));
      return;
    }
    if (repoUrl.trim()) {
      setLoading(true);
      try {
        const response = await fetch("/api/deploy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl })
        });

        const data = await response.json();

        if (response.ok && data.deploymentId) {
          router.push(`/deployments/${data.deploymentId}`);
        } else {
          alert(data.error || "Deployment failed");
        }
      } catch (error) {
        console.error("Deployment failed:", error);
        alert("Failed to start deployment");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden selection:bg-neutral-800 selection:text-white">
      <LaunchpadBackground />

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
          Launchpad
        </Link>

        <div className="flex items-center gap-4">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-white/10 hover:ring-white/20 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-neutral-800 text-white border border-neutral-700">
                      {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#111] border-[#222] text-white" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user.name && (
                      <p className="font-medium text-sm text-white">{session.user.name}</p>
                    )}
                    {session.user.email && (
                      <p className="text-xs text-neutral-400">{session.user.email}</p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-[#222]" />
                <DropdownMenuItem
                  className="text-neutral-300 focus:bg-[#222] focus:text-white cursor-pointer"
                  onClick={() => router.push("/settings")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#222]" />
                <DropdownMenuItem
                  className="text-red-400 focus:bg-[#222] focus:text-red-300 cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-neutral-300 hover:text-white hover:bg-white/10">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-neutral-200 font-medium">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-3xl mx-auto text-center w-full">
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70 pb-2 leading-tight">
            Ship fast.
            <br />
            Preview instantly.
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light tracking-wide">
            One-click deployment platform with real-time logs, <br className="hidden md:block" />
            automated scaling, and instant preview environments.
          </p>

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full relative z-20">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-blue-600/20 to-violet-600/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

              <div className="relative flex items-center bg-[#050505] rounded-xl border border-white/10 p-2 pl-5 shadow-2xl transition-all duration-300 hover:border-white/20 ring-1 ring-white/5">
                <div className="mr-3 text-neutral-500">
                  <Github className="h-6 w-6" />
                </div>
                <Input
                  className="flex-1 border-none bg-transparent h-14 text-xl text-white placeholder:text-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 font-medium tracking-tight"
                  placeholder="github.com/username/project"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  autoFocus
                />
                <Button
                  type="submit"
                  className="h-12 px-8 bg-white text-black hover:bg-neutral-200 rounded-lg font-bold text-base tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-white/10 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!repoUrl.trim() || loading}
                >
                  {loading ? "Deploying..." : "Deploy"}
                </Button>
              </div>
            </div>
          </form>

          {/* Recent Projects */}
          {session && recentProjects.length > 0 && (
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm mb-4">
                <Clock className="h-4 w-4" />
                <span>Recent Deployments</span>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#111] border border-[#222] text-sm text-neutral-300 hover:bg-[#1a1a1a] hover:border-[#333] hover:text-white transition-all shadow-sm"
                  >
                    <div className="p-1 rounded bg-[#222] group-hover:bg-[#333] transition-colors">
                      <FolderOpen className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="max-w-[150px] truncate font-medium">{project.name}</span>
                    <span className="text-neutral-600 text-xs border-l border-[#333] pl-3">{formatDate(project.createdAt)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
