// ─── Workout Plan Controller ───

import { Request, Response } from 'express';
import { getAIProvider } from '../services/aiService.js';
import { buildWorkoutPlanPrompt, PROMPT_VERSION } from '../services/promptService.js';
import { cacheService, CacheService } from '../services/cacheService.js';
import type { UserContext, WorkoutPlanResponse } from '../types/index.js';

export async function generateWorkoutPlan(req: Request, res: Response): Promise<void> {
    try {
        const userContext: UserContext = req.body.userContext;
        (req as any)._promptVersion = PROMPT_VERSION;

        // Check cache
        const cacheKey = CacheService.makeKey('workout-plan', PROMPT_VERSION, userContext.goalType, userContext.streak, userContext.bmi);
        const cached = cacheService.get<WorkoutPlanResponse>(cacheKey);
        if (cached) {
            (req as any)._cacheHit = true;
            res.json(cached);
            return;
        }

        const provider = getAIProvider();
        const prompt = buildWorkoutPlanPrompt(userContext);
        const raw = await provider.generateContent(prompt);

        // Parse JSON from response (strip markdown code fences if any)
        const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed: WorkoutPlanResponse = {
            ...JSON.parse(jsonStr),
            prompt_version: PROMPT_VERSION,
        };

        // Cache the result
        cacheService.set(cacheKey, parsed);

        res.json(parsed);
    } catch (error) {
        console.error('Workout plan error:', error);
        res.status(500).json({ error: 'Failed to generate workout plan' });
    }
}

export async function streamWorkoutPlan(req: Request, res: Response): Promise<void> {
    try {
        const userContext: UserContext = req.body.userContext;
        (req as any)._promptVersion = PROMPT_VERSION;

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const provider = getAIProvider();
        const prompt = buildWorkoutPlanPrompt(userContext);

        let isFirst = true;
        for await (const chunk of provider.streamContent(prompt)) {
            if (isFirst) {
                (req as any).markFirstToken?.();
                isFirst = false;
            }
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('Stream workout plan error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
    }
}
