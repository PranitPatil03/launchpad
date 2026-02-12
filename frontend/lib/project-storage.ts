export const PROJECTS_STORAGE_KEY = 'vercel-clone-projects';

export interface SavedProject {
    id: string;
    name?: string;
    url: string;
    createdAt: number;
}

export const saveProject = (id: string, url: string, name?: string) => {
    if (typeof window === 'undefined') return;

    const projects = getSavedProjects();
    const exists = projects.find(p => p.id === id);

    if (!exists) {
        const newProject: SavedProject = {
            id,
            url,
            name,
            createdAt: Date.now()
        };
        projects.unshift(newProject); // Add to beginning
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }
};

export const getSavedProjects = (): SavedProject[] => {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to parse saved projects', e);
        return [];
    }
};
