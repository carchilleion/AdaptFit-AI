// ─── Teach Me Controller ───

import { Request, Response } from 'express';
import { getAIProvider } from '../services/aiService.js';
import { buildTeachMePrompt, PROMPT_VERSION } from '../services/promptService.js';
import { cacheService, CacheService } from '../services/cacheService.js';
import type { UserContext, TeachMeResponse } from '../types/index.js';

export async function getTeachMe(req: Request, res: Response): Promise<void> {
    try {
        const userContext: UserContext = req.body.userContext;
        const exerciseName: string = req.body.exerciseName;

        if (!exerciseName) {
            res.status(400).json({ error: 'Exercise name is required' });
            return;
        }

        (req as any)._promptVersion = PROMPT_VERSION;

        // Check cache (key combines exerciseName and user streak/BMI context)
        const cacheKey = CacheService.makeKey('teach-me', PROMPT_VERSION, exerciseName, userContext.streak, userContext.bmi);
        const cached = cacheService.get<TeachMeResponse>(cacheKey);
        if (cached) {
            (req as any)._cacheHit = true;
            res.json(cached);
            return;
        }

        const provider = getAIProvider();
        const prompt = buildTeachMePrompt(exerciseName, userContext);
        const raw = await provider.generateContent(prompt);

        // Parse JSON from response
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: TeachMeResponse = {
            ...JSON.parse(jsonStr),
            prompt_version: PROMPT_VERSION,
        };

        // Cache the result
        cacheService.set(cacheKey, parsed);

        res.json(parsed);
    } catch (error) {
        console.error('Teach Me error:', error);
        res.status(500).json({ error: 'Failed to generate teach me guidance' });
    }
}
