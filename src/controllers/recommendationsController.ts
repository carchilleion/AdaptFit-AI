// ─── Personalized Recommendations Controller ───

import { Request, Response } from 'express';
import { getAIProvider } from '../services/aiService.js';
import { buildRecommendationsPrompt, PROMPT_VERSION } from '../services/promptService.js';
import { cacheService, CacheService } from '../services/cacheService.js';
import type { UserContext, RecommendationsResponse } from '../types/index.js';

export async function getRecommendations(req: Request, res: Response): Promise<void> {
    try {
        const userContext: UserContext = req.body.userContext;
        (req as any)._promptVersion = PROMPT_VERSION;

        const cacheKey = CacheService.makeKey('recommendations', PROMPT_VERSION, userContext.streak, userContext.missedDays);
        const cached = cacheService.get<RecommendationsResponse>(cacheKey);
        if (cached) {
            (req as any)._cacheHit = true;
            res.json(cached);
            return;
        }

        const provider = getAIProvider();
        const prompt = buildRecommendationsPrompt(userContext);
        const raw = await provider.generateContent(prompt);

        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: RecommendationsResponse = {
            ...JSON.parse(jsonStr),
            prompt_version: PROMPT_VERSION,
        };

        cacheService.set(cacheKey, parsed);
        res.json(parsed);
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
}
