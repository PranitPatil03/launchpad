"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { LaunchpadBackground } from "@/components/LaunchpadBackground";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, CheckCircle2, Loader2, XCircle, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogEvent {
    event_id: string;
    deployment_id: string;
    log: string;
    timestamp: string;
}

export default function DeploymentPage() {
    const params = useParams();
    const id = params?.id as string;
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<"building" | "ready" | "error">("building");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    useEffect(() => {
        if (!id) return;

        const fetchLogs = async () => {
            try {
                // Fetch logs from upload service via our proxy or directly if allowed
                // Ideally proxy, but for logs polling direct might be faster/easier if CORS allows.
                // However, we set up CORS in upload-service.
                const response = await fetch(`${process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL}/logs/${id}`);
                const data = await response.json();

                if (data.logs) {
                    setLogs(data.logs);

                    // Simple heuristic for status
                    const allLogs = data.logs.map((l: LogEvent) => l.log).join("\n");
                    if (allLogs.includes("Build Complete")) {
                        setStatus("ready");
                        // Ideally we get the URL from the logs or deployment record
                        // For now, let's assume it's id.projectSubdomain... wait, we don't have subdomain here.
                        // We might need an API to get deployment details.
                        // But for now, let's just show "Ready".
                    } else if (allLogs.includes("Error")) {
                        setStatus("error");
                    }
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, [id]);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-neutral-800 selection:text-white flex flex-col">
            <LaunchpadBackground />

            <header className="fixed top-0 w-full border-b border-white/10 bg-black/50 backdrop-blur-md z-50 px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${status === 'building' ? 'bg-yellow-500 animate-pulse' : status === 'ready' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-mono text-sm text-neutral-400">Deployment {id?.substring(0, 8)}</span>
                </div>
                {status === 'ready' && (
                    <Button variant="outline" className="border-white/10 hover:bg-white/10 text-white gap-2 h-9">
                        <Globe className="h-4 w-4" />
                        Visit Preview
                    </Button>
                )}
            </header>

            <main className="flex-1 pt-24 px-6 pb-6 max-w-5xl mx-auto w-full flex flex-col gap-6">

                {/* Status Card */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group">
                    {/* Glow */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status === 'building' ? 'bg-yellow-500' : status === 'ready' ? 'bg-green-500' : 'bg-red-500'}`} />

                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg border border-white/5 ${status === 'building' ? 'bg-yellow-500/10 text-yellow-500' : status === 'ready' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            {status === 'building' && <Loader2 className="h-6 w-6 animate-spin" />}
                            {status === 'ready' && <CheckCircle2 className="h-6 w-6" />}
                            {status === 'error' && <XCircle className="h-6 w-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-medium tracking-tight">
                                {status === 'building' ? 'Building your project...' : status === 'ready' ? 'Deployment Successful' : 'Deployment Failed'}
                            </h2>
                            <p className="text-neutral-500 text-sm mt-1">
                                {status === 'building' ? 'Allocating resources & running build script' : status === 'ready' ? 'Your project is live and ready to view' : 'Check logs for error details'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Logs Terminal */}
                <div className="flex-1 bg-[#050505] border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-2xl min-h-[500px]">
                    <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 gap-2">
                        <Terminal className="h-4 w-4 text-neutral-500" />
                        <span className="text-xs font-mono text-neutral-400">Build Logs</span>
                    </div>
                    <ScrollArea className="flex-1 p-4 font-mono text-sm leading-relaxed">
                        {loading && logs.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-neutral-500 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Initializing build environment...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {logs.map((log) => (
                                    <div key={log.event_id} className="flex gap-3 text-neutral-300 hover:bg-white/5 p-0.5 rounded px-2">
                                        <span className="text-neutral-600 select-none w-[140px] shrink-0 text-xs py-0.5">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className={`break-all ${log.log.toLowerCase().includes('error') ? 'text-red-400' : 'text-neutral-300'}`}>
                                            {log.log}
                                        </span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </ScrollArea>
                </div>

            </main>
        </div>
    );
}
