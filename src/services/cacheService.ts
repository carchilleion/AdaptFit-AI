// ─── In-memory AI Response Cache ───

interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

class CacheService {
    private cache = new Map<string, CacheEntry>();
    private defaultTtlMs: number;

    constructor(defaultTtlMs: number = 600_000) {
        this.defaultTtlMs = defaultTtlMs;
        // Prune expired entries every 5 minutes
        setInterval(() => this.prune(), 300_000);
    }

    /** Generate a simple hash key from components */
    static makeKey(...parts: (string | number | undefined | null)[]): string {
        const raw = parts.map(p => String(p ?? '')).join('|');
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            const char = raw.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32-bit int
        }
        return `cache_${Math.abs(hash).toString(36)}`;
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    set(key: string, data: unknown, ttlMs?: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
        });
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }

    private prune(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

export const cacheService = new CacheService();
export { CacheService };
