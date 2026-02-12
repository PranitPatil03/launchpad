"use client";
import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Rocket, User, LogOut, Github } from "lucide-react";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function Navbar() {
  const [session, setSession] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const getSession = async () => {
      try {
        const sessionData = await authClient.getSession();
        setSession(sessionData.data?.user || null);
      } catch (error) {
        console.error("Error getting session:", error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    setSession(null);
  };

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: window.location.href,
    });
  };

  return (
    <nav className="w-full border-b border-zinc-800 bg-black/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Rocket className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white font-bricolage-grotesque">
                Launchpad
              </span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={session.image || ""} alt={session.name || ""} />
                      <AvatarFallback className="bg-zinc-800 text-white">
                        {session.name?.charAt(0).toUpperCase() || session.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-700" align="end">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.name}</p>
                      <p className="text-xs leading-none text-zinc-400">{session.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-700" />
                  <DropdownMenuItem className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={handleSignIn}
                className="bg-white text-black hover:bg-zinc-200 font-medium flex items-center gap-2"
              >
                <Github className="h-4 w-4" />
                Sign in with GitHub
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}