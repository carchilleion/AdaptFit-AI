// ─── User Context Controller ───
// Stores and retrieves user context (in-memory for now, can be extended to DB)

import { Request, Response } from 'express';
import type { UserContext } from '../types/index.js';

// In-memory user context store (keyed by user ID or session)
const contextStore = new Map<string, UserContext>();

export function saveUserContext(req: Request, res: Response): void {
    try {
        const { userId, userContext } = req.body;

        if (!userId || typeof userId !== 'string') {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }

        if (!userContext || typeof userContext !== 'object') {
            res.status(400).json({ error: 'Missing userContext' });
            return;
        }

        contextStore.set(userId, userContext);
        res.json({ success: true, message: 'Context saved' });
    } catch (error) {
        console.error('Save context error:', error);
        res.status(500).json({ error: 'Failed to save context' });
    }
}

export function getUserContext(req: Request, res: Response): void {
    try {
        const userId = req.query.userId as string;

        if (!userId) {
            res.status(400).json({ error: 'Missing userId query parameter' });
            return;
        }

        const context = contextStore.get(userId);
        if (!context) {
            res.json({ userContext: null, message: 'No context found' });
            return;
        }

        res.json({ userContext: context });
    } catch (error) {
        console.error('Get context error:', error);
        res.status(500).json({ error: 'Failed to get context' });
    }
}
