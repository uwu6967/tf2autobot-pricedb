export interface HiveJob {
    id: string;
    type: 'auto' | 'manual';
    status: 'pending' | 'sent' | 'done' | 'failed';
    fromSteamId: string;
    toSteamId: string;
    keys: number;
    refined: number;
    offerId?: string | null;
    createdAt?: number;
    updatedAt?: number;
    resultMessage?: string;
}

export interface HiveLink {
    id: string;
    a: string;
    b: string;
    status: 'pending' | 'accepted';
    invitedBy: string;
    invitedAt: number;
    acceptedAt: number | null;
}

export interface HiveBotPublic {
    steamId: string;
    name: string;
    keys: number;
    refined: number;
    minKeys: number;
    maxKeys: number;
    minRefined: number;
    maxRefined: number;
    autoRebalance: boolean;
    lastSeen: number;
}

export interface HiveHeartbeatResponse {
    ok: boolean;
    bot: HiveBotPublic;
    jobs: HiveJob[];
    createdJobs: string[];
    links: HiveLink[];
    pendingInvites: HiveLink[];
}

export const HIVE_JOB_MESSAGE_PREFIX = 'HIVE_JOB:';
export const PURE_SKUS = new Set(['5021;6', '5002;6', '5001;6', '5000;6']);
