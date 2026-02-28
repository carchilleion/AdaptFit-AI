// ─── Progress Analysis Controller ───

import { Request, Response } from 'express';
import { getAIProvider } from '../services/aiService.js';
import { buildProgressAnalysisPrompt, PROMPT_VERSION } from '../services/promptService.js';
import { cacheService, CacheService } from '../services/cacheService.js';
import type { UserContext, ProgressAnalysisResponse } from '../types/index.js';

export async function analyzeProgress(req: Request, res: Response): Promise<void> {
    try {
        const userContext: UserContext = req.body.userContext;
        (req as any)._promptVersion = PROMPT_VERSION;

        // Cache key includes history length since different history = different analysis
        const historyLen = userContext.workoutHistory?.length ?? 0;
        const cacheKey = CacheService.makeKey('progress', PROMPT_VERSION, userContext.streak, historyLen);
        const cached = cacheService.get<ProgressAnalysisResponse>(cacheKey);
        if (cached) {
            (req as any)._cacheHit = true;
            res.json(cached);
            return;
        }

        const provider = getAIProvider();
        const prompt = buildProgressAnalysisPrompt(userContext);
        const raw = await provider.generateContent(prompt);

        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: ProgressAnalysisResponse = {
            ...JSON.parse(jsonStr),
            prompt_version: PROMPT_VERSION,
        };

        cacheService.set(cacheKey, parsed);
        res.json(parsed);
    } catch (error) {
        console.error('Progress analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze progress' });
    }
}
