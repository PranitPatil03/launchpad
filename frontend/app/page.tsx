"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection, CTASection, StatsSection } from "@/components/landing-sections";
import { Footer } from "@/components/footer";
import axios from "axios";

export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployPreviewURL, setDeployPreviewURL] = useState<string | undefined>();
  const [deploymentFinished, setDeploymentFinished] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const logContainerRef = useRef<HTMLElement>(null);

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

        const isComplete = newLogs.some((log: string) => log === "Service uploaded");
        if (isComplete) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
          setDeploymentFinished(true);
        }
      }
    } catch (error) {
      console.error("Error polling logs:", error);
    }
  }, []);

  const handleDeploy = useCallback(async (repoURL: string, userId: string) => {
    try {
      setLoading(true);
      setLogs([]);
      setDeploymentFinished(false);
      setDeployPreviewURL(undefined);
      setShowLogs(true);

      const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL || '';
      const previewBaseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || '';

      const { data: projectData } = await axios.post(`${uploadServiceUrl}/project`, {
        gitURL: repoURL,
        name: "",
        userId,
      });

      if (projectData?.data?.project) {
        const { id, subDomain } = projectData.data.project;

        const base = previewBaseUrl.replace(/\/$/, '');
        const previewUrl = base.includes('*')
          ? base.replace('*', subDomain)
          : `${base}/preview/${subDomain}`;

        setDeployPreviewURL(previewUrl);

        const { data: deployData } = await axios.post(`${uploadServiceUrl}/deploy`, {
          projectId: id,
        });

        if (deployData?.data?.deploymentId) {
          const deploymentId = deployData.data.deploymentId;

          pollingRef.current = setInterval(() => {
            pollDeploymentLogs(deploymentId);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error deploying:", error);
      setLoading(false);
    }
  }, [pollDeploymentLogs]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="min-h-screen bg-black text-white font-bricolage-grotesque">
      <Navbar />
      
      <HeroSection onDeploy={handleDeploy} loading={loading} />
      
      <FeaturesSection />
      
      <StatsSection />
      
      <CTASection />
      
      <Footer />
    </div>
  );
}

