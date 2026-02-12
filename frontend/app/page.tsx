"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, ArrowRight, Sparkles } from 'lucide-react';
import axios from "axios";
import { Navbar } from "@/components/navbar";
import { LaunchpadBackground } from "@/components/launchpad-background";
import { saveProject, getSavedProjects, type SavedProject } from "@/lib/project-storage";
import Link from 'next/link';
import { useEffect } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [repoURL, setURL] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<SavedProject[]>([]);

  useEffect(() => {
    // Load recent projects only on client mount
    setRecentProjects(getSavedProjects());
  }, []);

  const isValidURL = (url: string) => {
    if (!url || url.trim() === "") return false;
    const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/;
    return regex.test(url);
  };

  const handleClickDeploy = async () => {
    if (!isValidURL(repoURL)) return;

    try {
      setLoading(true);

      const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3000';

      // 1. Create Project
      const { data: projectData } = await axios.post(`${uploadServiceUrl}/project`, {
        gitURL: repoURL,
        name: "", // Optional: could ask user for name or slug
      });

      if (projectData?.data?.project?.id) {
        const projectId = projectData.data.project.id;

        // 2. Trigger Initial Deployment
        // We do this here so the user lands on the project page with a deployment already queued
        await axios.post(`${uploadServiceUrl}/deploy`, {
          projectId: projectId,
        });

        // Save to local history immediately
        saveProject(projectId, repoURL);

        // 3. Redirect to Project Dashboard
        router.push(`/project/${projectId}`);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      // Maybe show toast?
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-neutral-700 overflow-hidden font-sans">
      <LaunchpadBackground />
      <Navbar />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-12">

        {/* Hero Section */}
        <div className="w-full max-w-4xl mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-8">

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 pb-2">
            Ship fast. <br className="hidden md:block" />
            Preview instantly.
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            One-click deployment platform with real-time logs, automated scaling, and instant preview environments for everyone.
          </p>

          {/* Input Area */}
          <div className="w-full max-w-xl mx-auto mt-12 flex flex-col sm:flex-row gap-3">
            <Input
              className="flex-1 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 h-14 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-0 focus-visible:border-transparent pl-5 shadow-lg shadow-black/20"
              placeholder="github.com/username/project"
              value={repoURL}
              onChange={(e) => setURL(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValidURL(repoURL)) {
                  handleClickDeploy();
                }
              }}
            />
            <Button
              onClick={handleClickDeploy}
              disabled={!isValidURL(repoURL) || loading}
              size="lg"
              className="bg-white text-black hover:bg-neutral-200 font-medium px-8 h-14 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.3)] shrink-0 text-base disabled:opacity-100 disabled:pointer-events-auto disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                "Deploy"
              )}
            </Button>
          </div>

          {recentProjects.length > 0 && (
            <div className="w-full mt-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 text-left">
              <h2 className="text-2xl font-semibold mb-6 text-neutral-200 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Your Recent Deployments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentProjects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="group block p-5 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 transition-all duration-300 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 text-neutral-100 font-medium truncate pr-4">
                        <Github className="w-4 h-4 text-neutral-400" />
                        <span className="truncate max-w-[200px]">{project.url.replace('https://github.com/', '')}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-500 mt-4">
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full border border-green-500/20">Active</span>
                    </div>
                  </Link>
                ))}
              </div>
              {recentProjects.length > 4 && (
                <p className="text-center text-neutral-500 text-sm mt-6">
                  Showing most recent 4 of {recentProjects.length} projects
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
