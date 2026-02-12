"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from 'lucide-react';
import { Fira_Code } from 'next/font/google';
import axios from "axios";

const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setURL] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();
  const [deployId, setDeploymentId] = useState<string | undefined>();
  const [deployPreviewURL, setDeployPreviewURL] = useState<string | undefined>();
  const [deploymentFinished, setDeploymentFinished] = useState(false); // New state to track completion

  const pollingRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL || repoURL.trim() === "") return [false, null];
    const regex = new RegExp(
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/
    );
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  interface LogEntry {
    event_id: string;
    deployment_id: string;
    log: string;
    timestamp: string;
  }

  interface DeploymentLogs {
    logs: LogEntry[];
  }

  const pollDeploymentLogs = useCallback(async (id: string) => {
    try {
      const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || '';
      const { data } = await axios.get(`${uploadServiceUrl}/logs/${id}`);

      if (data && data.logs) {
        const newLogs: string[] = (data as DeploymentLogs).logs.map((log: LogEntry): string => log.log);
        setLogs(newLogs);

        // Check if deployment is complete
        const isComplete = newLogs.some((log: string) => log === "Service uploaded");
        if (isComplete) {
          // Stop polling
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
          setDeploymentFinished(true); // Show the URL now
        }
      }
    } catch (error) {
      console.error("Error polling logs:", error);
    }
  }, []);

  const handleClickDeploy = useCallback(async () => {
    try {
      setLoading(true);
      setLogs([]);
      setDeploymentFinished(false);
      setDeployPreviewURL(undefined);

      // Create project
      const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || '';
      const previewBaseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || '';

      const { data: projectData } = await axios.post(`${uploadServiceUrl}/project`, {
        gitURL: repoURL,
        name: "",
      });

      if (projectData?.data?.project) {
        const { id, subDomain } = projectData.data.project;
        setProjectId(id);

        // Construct URL but don't show it yet
        const base = previewBaseUrl.replace(/\/$/, '');
        const previewUrl = base.includes('*')
          ? base.replace('*', subDomain)
          : `${base}/preview/${subDomain}`;

        setDeployPreviewURL(previewUrl);

        // Start deployment
        const { data: deployData } = await axios.post(`${uploadServiceUrl}/deploy`, {
          projectId: id,
        });

        if (deployData?.data?.deploymentId) {
          setDeploymentId(deployData.data.deploymentId);

          // Start polling logs
          pollingRef.current = setInterval(() => {
            pollDeploymentLogs(deployData.data.deploymentId);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error deploying:", error);
      setLoading(false);
    }
  }, [repoURL, pollDeploymentLogs]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Auto scroll logs
  useEffect(() => {
    if (logs.length > 0) {
      logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <main className="flex justify-center items-center min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="w-full max-w-3xl">

        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-xl">
            <Github className="text-4xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              Vercel Clone
            </h1>
            <p className="text-slate-400 text-sm">Deploy your Github repositories instantly</p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <div className="flex flex-col gap-4">
            <Input
              disabled={loading}
              value={repoURL}
              onChange={(e) => setURL(e.target.value)}
              type="url"
              placeholder="https://github.com/username/repo"
              className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 h-12 text-lg"
            />
            <Button
              onClick={handleClickDeploy}
              disabled={!isValidURL[0] || loading}
              className={`w-full h-12 text-lg font-medium transition-all duration-300 ${loading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-slate-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]'
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Deploying...
                </span>
              ) : (
                "Deploy Now"
              )}
            </Button>
          </div>
        </div>

        {/* Success / Preview Section */}
        {deploymentFinished && deployPreviewURL && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-emerald-400 font-semibold mb-1">Deployment Complete! 🚀</h3>
                <p className="text-emerald-200/60 text-sm">Your project is live and ready to view.</p>
              </div>
              <a
                target="_blank"
                href={deployPreviewURL}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg transition-colors shadow-lg shadow-emerald-500/20 whitespace-nowrap"
              >
                Visit Site
              </a>
            </div>
            <div className="mt-2 text-center text-xs text-slate-600 break-all font-mono selection:bg-emerald-500/30">
              {deployPreviewURL}
            </div>
          </div>
        )}

        {/* Logs Console */}
        {logs.length > 0 && (
          <div className="mt-8 rounded-xl overflow-hidden border border-slate-800 bg-[#0c0c0c] shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500/50" />
              <span className="ml-2 text-xs text-slate-500 font-mono">build-logs.txt</span>
            </div>
            <div
              className={`${firaCode.className} text-xs md:text-sm p-4 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent`}
            >
              <pre className="flex flex-col gap-1.5 font-mono">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-3 text-slate-300">
                    <span className="text-slate-600 shrink-0">›</span>
                    <span
                      ref={logs.length - 1 === i ? logContainerRef : undefined}
                      className={`${log.toLowerCase().includes('error') ? 'text-red-400' :
                          log.toLowerCase().includes('success') || log.includes('Complete') ? 'text-emerald-400' :
                            log.includes('http') ? 'text-blue-400' : 'text-slate-300'
                        }`}
                    >
                      {log}
                    </span>
                  </div>
                ))}
              </pre>
              {loading && (
                <div className="flex gap-2 items-center mt-2 text-slate-500 animate-pulse">
                  <span className="w-1.5 h-4 bg-slate-500" />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

