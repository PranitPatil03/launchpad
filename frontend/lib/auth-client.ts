export interface Session {
    user: {
        name: string;
        email: string;
        image?: string;
    }
}

export const authClient = {
    useSession: () => {
        return {
            data: null as Session | null,
            isPending: false,
            error: null
        }
    },
    signOut: async () => {
        return Promise.resolve();
    }
}
