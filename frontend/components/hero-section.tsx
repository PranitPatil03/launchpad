"use client";
import React, { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Rocket, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onDeploy: (repoURL: string, userId: string) => void;
  loading?: boolean;
}

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function HeroSection({ onDeploy, loading }: HeroSectionProps) {
  const [session, setSession] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
        const [repoURL, setRepoURL] = useState("");

  useEffect(() => {
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

  const isValidURL = repoURL.trim() !== "" && 
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/.test(repoURL);

  const handleDeployClick = async () => {
    if (!isValidURL || !session?.id) return;
    
    onDeploy(repoURL, session.id);
  };

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: window.location.href,
    });
  };

  return (
    <section className="min-h-screen bg-black flex items-center justify-center px-4 py-20">
      <div className="max-w-5xl mx-auto text-center">
        {/* Logo and Tagline */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <Rocket className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-6xl md:text-7xl font-bold text-white font-bricolage-grotesque">
            Launchpad
          </h1>
        </div>

        {/* Hero Text */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-bricolage-grotesque">
          Ship fast. Preview instantly.
        </h2>
        
        <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto font-bricolage-grotesque">
          One-click deployment platform with real-time logs and preview environments.
        </p>

        {/* Deploy Section */}
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
              <div className="animate-pulse">
                <div className="h-12 bg-zinc-800 rounded-lg mb-4" />
                <div className="h-12 bg-zinc-800 rounded-lg" />
              </div>
            </div>
          ) : session ? (
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-8 border border-zinc-800">
              <div className="space-y-4">
                <Input
                  disabled={loading}
                  value={repoURL}
                  onChange={(e) => setRepoURL(e.target.value)}
                  type="url"
                  placeholder="https://github.com/username/repo"
                  className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20 h-14 text-lg font-bricolage-grotesque"
                />
                <Button
                  onClick={handleDeployClick}
                  disabled={!isValidURL || loading}
                  className={`w-full h-14 text-lg font-medium font-bricolage-grotesque transition-all duration-300 ${
                    loading
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Deploy Now
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-zinc-500 mt-4">
                Welcome back, {session.name || session.email}! Ready to deploy your project?
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-8 border border-zinc-800">
              <div className="space-y-6">
                <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                  <div className="flex items-center gap-3 mb-4">
                    <Github className="h-6 w-6 text-white" />
                    <span className="text-white font-medium font-bricolage-grotesque">GitHub Repository</span>
                  </div>
                  <Input
                    value={repoURL}
                    onChange={(e) => setRepoURL(e.target.value)}
                    type="url"
                    placeholder="https://github.com/username/repo"
                    className="bg-black border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-white/20 h-14 text-lg font-bricolage-grotesque mb-4"
                  />
                  <p className="text-sm text-zinc-400">
                    {isValidURL ? "✅ Valid GitHub repository URL" : "Enter a valid GitHub repository URL"}
                  </p>
                </div>

                <Button
                  onClick={handleSignIn}
                  className="w-full h-14 text-lg font-medium font-bricolage-grotesque bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-xl flex items-center gap-3"
                  disabled={!isValidURL}
                >
                  <Github className="h-5 w-5" />
                  Sign in with GitHub to Deploy
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <p className="text-sm text-zinc-500">
                  Connect your GitHub account to start deploying your projects instantly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-bricolage-grotesque">Instant Deployment</h3>
            <p className="text-zinc-400 text-sm">Deploy your projects with a single click</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <ArrowRight className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-bricolage-grotesque">Real-time Logs</h3>
            <p className="text-zinc-400 text-sm">Watch your deployment process live</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Github className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 font-bricolage-grotesque">GitHub Integration</h3>
            <p className="text-zinc-400 text-sm">Connect any public repository</p>
          </div>
        </div>
      </div>
    </section>
  );
}