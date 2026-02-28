// ─── Request Logger for Research Metrics ───

import { Request, Response, NextFunction } from 'express';
import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { MetricsEntry } from '../types/index.js';
import { config } from '../config/env.js';
import { CacheService } from '../services/cacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = join(__dirname, '..', '..', 'logs');

// In-memory metrics buffer for research
const metricsBuffer: MetricsEntry[] = [];

export function getMetrics(): MetricsEntry[] {
    return [...metricsBuffer];
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    // Attach timing info to request for controllers to use
    (req as any)._startTime = startTime;
    (req as any)._firstTokenTime = null;

    // Mark first token time (called by controllers when first SSE chunk is sent)
    (req as any).markFirstToken = () => {
        if (!(req as any)._firstTokenTime) {
            (req as any)._firstTokenTime = Date.now();
        }
    };

    const originalEnd = res.end.bind(res);
    (res as any).end = function (...args: any[]) {
        const totalTime = Date.now() - startTime;
        const firstTokenTime = (req as any)._firstTokenTime;
        const cacheHit = (req as any)._cacheHit ?? false;

        const entry: MetricsEntry = {
            endpoint: req.path,
            timestamp: new Date().toISOString(),
            firstTokenLatencyMs: firstTokenTime ? firstTokenTime - startTime : undefined,
            totalResponseTimeMs: totalTime,
            promptVersion: (req as any)._promptVersion ?? 'unknown',
            cacheHit,
            statusCode: res.statusCode,
            userContextHash: CacheService.makeKey(
                req.body?.userContext?.bmi,
                req.body?.userContext?.goalType,
                req.body?.userContext?.streak
            ),
        };

        metricsBuffer.push(entry);

        // Keep buffer capped at 1000 entries
        if (metricsBuffer.length > 1000) {
            metricsBuffer.splice(0, metricsBuffer.length - 1000);
        }

        // Optionally write to file for research
        if (config.logToFile) {
            try {
                if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true });
                appendFileSync(
                    join(logsDir, 'metrics.jsonl'),
                    JSON.stringify(entry) + '\n'
                );
            } catch (e) {
                // Non-fatal: don't crash the server for logging failures
            }
        }

        console.log(
            `[${entry.timestamp}] ${req.method} ${req.path} → ${res.statusCode} (${totalTime}ms${cacheHit ? ', CACHED' : ''})`
        );

        return originalEnd(...args);
    };

    next();
}
