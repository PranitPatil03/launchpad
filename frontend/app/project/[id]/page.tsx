"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { FolderGit2, Globe, Terminal, RefreshCw, ExternalLink } from "lucide-react";
import { Fira_Code } from 'next/font/google';
import { Navbar } from "@/components/navbar";
import { useSearchParams } from "next/navigation";

const firaCode = Fira_Code({ subsets: ["latin"] });

interface LogEntry {
    event_id: string;
    deployment_id: string;
    log: string;
    timestamp: string;
}

interface DeploymentLogs {
    logs: LogEntry[];
}

interface Project {
    id: string;
    name: string;
    gitURL: string;
    subDomain: string;
    customDomain?: string | null;
    updatedAt?: string;
    Deployement?: Array<{
        id: string;
        status: string;
        createdAt: string;
    }>;
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const autoDeployParam = searchParams.get("autoDeploy");
    const [project, setProject] = useState<Project | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [loading] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [deploymentId, setDeploymentId] = useState<string | undefined>();
    const [deploymentFinished, setDeploymentFinished] = useState(false);

    const pollingRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const logContainerRef = useRef<HTMLElement>(null);
    const autoDeployTriggeredRef = useRef(false);

    const fetchProject = useCallback(async () => {
        try {
            const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3000';
            const { data } = await axios.get(`${uploadServiceUrl}/project/${id}`);
            if (data && data.data && data.data.project) {
                setProject(data.data.project);

                // If there's a recent deployment, we might want to attach to it?
                // But for now, let's just show project info.
                // If the user just created logic from landing page, they might expect auto-deploy.
                // But the landing page logic was: create project -> create deployment -> show logs.
                // If we move logic here, we need to know if we should start deploying immediately.
                // Maybe we just let the user click "Deploy" or if there's an active deployment show it.

                // Check latest deployment status
                const latestDeployment = data.data.project.Deployement?.[0];
                if (latestDeployment) {
                    // we could show its status
                    if (latestDeployment.status === 'QUEUED' || latestDeployment.status === 'IN_PROGRESS') {
                        setDeploymentId(latestDeployment.id);
                        setDeploying(true);
                    } else if (latestDeployment.status === 'READY') {
                        setDeploymentFinished(true);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching project:", error);
        }
    }, [id]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    // If we arrive from landing page with ?autoDeploy=1, automatically start a deployment
    useEffect(() => {
        if (
            autoDeployParam === "1" &&
            project &&
            !deploymentId &&
            !deploying &&
            !deploymentFinished &&
            !autoDeployTriggeredRef.current
        ) {
            autoDeployTriggeredRef.current = true;
            // Fire and forget; any errors are already handled inside handleDeploy
            void handleDeploy();
        }
    }, [autoDeployParam, project, deploymentId, deploying, deploymentFinished]);

    const pollDeploymentLogs = useCallback(async (depId: string) => {
        // If deployment is already marked finished, stop polling
        if (deploymentFinished) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            return;
        }

        try {
            const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3000';
            const { data } = await axios.get(`${uploadServiceUrl}/logs/${depId}`);

            if (data && data.logs) {
                const newLogs: string[] = (data as DeploymentLogs).logs.map((log: LogEntry): string => log.log);
                setLogs(newLogs);

                const isComplete = newLogs.some((log: string) =>
                    log.includes("Service uploaded") ||
                    log.includes("Build Complete") ||
                    log.toLowerCase().includes("preview url")
                );

                // Also refresh project status while we're polling so we can stop
                await fetchProject();

                // If logs or project status indicate completion, stop polling
                if (isComplete || deploymentFinished) {
                    if (pollingRef.current) clearInterval(pollingRef.current);
                    setDeploying(false);
                    setDeploymentFinished(true);
                }
            }
        } catch (error) {
            console.error("Error polling logs:", error);
        }
    }, [fetchProject, deploymentFinished]);

    useEffect(() => {
        if (deploymentId && deploying && !deploymentFinished) {
            pollingRef.current = setInterval(() => {
                pollDeploymentLogs(deploymentId);
            }, 2000);
        }
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [deploymentId, deploying, deploymentFinished, pollDeploymentLogs]);

    const handleDeploy = async () => {
        if (!project) return;
        try {
            setDeploying(true);
            setLogs([]);
            setDeploymentFinished(false);

            const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || 'http://localhost:3000';
            const { data: deployData } = await axios.post(`${uploadServiceUrl}/deploy`, {
                projectId: project.id,
            });

            if (deployData?.data?.deploymentId) {
                setDeploymentId(deployData.data.deploymentId);
            }
        } catch (error) {
            console.error("Error starting deployment:", error);
            setDeploying(false);
        }
    };

    // If no project loaded yet
    if (!project && !loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Navbar />
                <p>Loading project...</p>
            </div>
        )
    }

    const previewBaseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || 'http://localhost:3001'; // Default
    const previewUrl = project ? (previewBaseUrl.includes('*')
        ? previewBaseUrl.replace('*', project.subDomain)
        : `${previewBaseUrl}/preview/${project.subDomain}`) : '';

    return (
        <div className="min-h-screen bg-black text-white selection:bg-neutral-700 font-sans">
            <Navbar />

            <div className="container mx-auto max-w-7xl px-4 pt-24 pb-12">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{project?.name || project?.subDomain || "Project"}</h1>
                                {deploymentFinished && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                                        Live
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-400">
                                <a href={project?.gitURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                                    <FolderGit2 className="w-4 h-4" />
                                    {project?.gitURL}
                                </a>
                                {project?.updatedAt && (
                                    <span>Updated {new Date().toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {deploymentFinished && (
                                <Button asChild variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                        Visit
                                    </a>
                                </Button>
                            )}
                            <Button
                                onClick={handleDeploy}
                                disabled={deploying}
                                className={`${deploying ? 'bg-neutral-800 text-neutral-400' : 'bg-white text-black hover:bg-neutral-200'}`}
                            >
                                {deploying ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Deploying...
                                    </>
                                ) : "New Deployment"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content: Preview & Logs */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Preview URL Card */}
                            <div className="rounded-xl border border-white/20 bg-neutral-900/50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-neutral-900/80 backdrop-blur-sm">
                                    <h3 className="text-sm font-medium flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-neutral-400" />
                                        Deployment Preview
                                    </h3>
                                    {deploymentFinished && (
                                        <span className="text-xs text-emerald-400">Ready</span>
                                    )}
                                </div>
                                <div className="p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[260px] text-neutral-400">
                                    {deploymentFinished ? (
                                        <>
                                            <div className="space-y-3 w-full">
                                                <p className="text-lg text-white">Your app is live!</p>
                                                <a
                                                    href={previewUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 hover:underline break-all text-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    {previewUrl}
                                                </a>
                                            </div>
                                            <div className="mt-4 w-full max-w-3xl rounded-lg border border-white/10 overflow-hidden bg-black/60">
                                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-xs text-neutral-500">
                                                    <span>Live Preview</span>
                                                    <span>Click inside to interact, or use the link above.</span>
                                                </div>
                                                <div className="relative w-full aspect-video bg-black">
                                                    <iframe
                                                        src={previewUrl}
                                                        className="w-full h-full border-0"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : deploying ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <p>Building your application...</p>
                                        </div>
                                    ) : (
                                        <p>No active deployment preview.</p>
                                    )}
                                </div>
                            </div>

                            {/* Logs */}
                            <div className="rounded-xl border border-white/20 bg-[#0c0c0c] overflow-hidden shadow-2xl h-[500px] flex flex-col">
                                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-neutral-900/70 backdrop-blur-sm">
                                    <h3 className="text-sm font-medium flex items-center gap-2 text-neutral-300">
                                        <Terminal className="w-4 h-4" />
                                        Build Logs
                                    </h3>
                                    {deploying && (
                                        <span className="flex items-center gap-1.5 text-xs text-blue-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                            Live
                                        </span>
                                    )}
                                </div>
                                <div className={`p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 ${firaCode.className} text-xs md:text-sm`}>
                                    {logs.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-neutral-600 font-mono">
                                            {deploying ? "Waiting for logs..." : "No logs to display"}
                                        </div>
                                    ) : (
                                        <pre className="flex flex-col gap-1 font-mono">
                                            {logs.map((log, i) => (
                                                <div key={i} className="flex gap-3 text-neutral-300">
                                                    <span className="text-neutral-600 shrink-0 select-none">›</span>
                                                    <span ref={logs.length - 1 === i ? logContainerRef : undefined} className={`${log.toLowerCase().includes('error') ? 'text-red-400' :
                                                        log.toLowerCase().includes('success') || log.includes('Complete') ? 'text-emerald-400' :
                                                            log.includes('http') ? 'text-blue-400' : 'text-neutral-300'
                                                        }`}>
                                                        {log}
                                                    </span>
                                                </div>
                                            ))}
                                            {deploying && (
                                                <div className="w-1.5 h-4 bg-neutral-500 animate-pulse mt-2 ml-5" />
                                            )}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            <div className="rounded-xl border border-white/10 bg-neutral-900/30 p-4">
                                <h3 className="text-sm font-medium text-neutral-400 mb-4">Project Details</h3>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <label className="text-xs text-neutral-500 block mb-1">Project Name</label>
                                        <div className="font-medium text-white">{project?.name || project?.subDomain}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 block mb-1">Git Repository</label>
                                        <a href={project?.gitURL} target="_blank" className="font-medium text-blue-400 hover:underline truncate block">
                                            {project?.gitURL}
                                        </a>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 block mb-1">Subdomain</label>
                                        <div className="font-medium text-white">{project?.subDomain}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-neutral-500 block mb-1">Framework</label>
                                        <div className="font-medium text-white">Next.js (Detected)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
