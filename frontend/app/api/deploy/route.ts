import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { repoUrl } = await req.json();

        if (!repoUrl) {
            return NextResponse.json({ error: "Repo URL is required" }, { status: 400 });
        }

        const uploadServiceUrl = process.env.NEXT_PUBLIC_UPLOAD_SERVICE_URL;
        if (!uploadServiceUrl) {
            console.error("NEXT_PUBLIC_UPLOAD_SERVICE_URL is not defined");
            return NextResponse.json({ error: "Configuration error" }, { status: 500 });
        }

        // Extract project name from URL (simple implementation)
        // e.g. https://github.com/user/repo -> repo
        const name = repoUrl.split("/").pop()?.replace(".git", "") || "untitled-project";

        // 1. Create Project
        const createProjectResponse = await axios.post(`${uploadServiceUrl}/project`, {
            name,
            gitURL: repoUrl
        });

        const project = createProjectResponse.data?.data?.project;
        if (!project || !project.id) {
            return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
        }

        // 2. Trigger Deployment
        const deployResponse = await axios.post(`${uploadServiceUrl}/deploy`, {
            projectId: project.id
        });

        const deployment = deployResponse.data?.data;

        return NextResponse.json({
            projectId: project.id,
            deploymentId: deployment?.deploymentId,
            projectSubdomain: project.subDomain
        });

    } catch (error: any) {
        console.error("Deployment error:", error.response?.data || error.message);
        return NextResponse.json(
            { error: error.response?.data?.error || "Failed to start deployment" },
            { status: error.response?.status || 500 }
        );
    }
}
