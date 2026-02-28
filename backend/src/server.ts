// ─── Fitness AI Backend Server ───

import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { requestLogger, getMetrics } from './middleware/requestLogger.js';
import { validateUserContext, validateChatMessage } from './middleware/validateRequest.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { getAIProvider } from './services/aiService.js';
import { buildChatPrompt, PROMPT_VERSION } from './services/promptService.js';
import { cacheService } from './services/cacheService.js';
import type { UserContext } from './types/index.js';

const app = express();

// ─── Global Middleware ───
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use('/api/', apiRateLimiter);

// ─── Routes ───
app.use('/api/ai', aiRoutes);
app.use('/api/user', userRoutes);

// ─── Legacy endpoint (backward compatibility with existing Flutter app) ───
app.post('/api/ai/fitness', validateChatMessage, async (req, res) => {
    try {
        const { message, userData } = req.body;
        (req as any)._promptVersion = PROMPT_VERSION;

        // Convert legacy userData to UserContext format
        const userContext: UserContext = {
            streak: userData?.streak ?? 0,
            completedWorkouts: userData?.completedWorkouts ?? 0,
            goal: userData?.goal,
            availableTime: userData?.availableTime ? parseInt(userData.availableTime) : undefined,
            preferredExercises: userData?.favoriteExercises ?? [],
        };

        const provider = getAIProvider();
        const prompt = buildChatPrompt(message, userContext);
        const reply = await provider.generateContent(prompt);

        res.json({ reply });
    } catch (error) {
        console.error('Legacy fitness endpoint error:', error);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

// ─── SSE Streaming chat endpoint ───
app.post('/api/ai/chat/stream', validateChatMessage, async (req, res) => {
    try {
        const { message, userContext: rawCtx } = req.body;
        (req as any)._promptVersion = PROMPT_VERSION;

        const userContext: UserContext = {
            streak: rawCtx?.streak ?? 0,
            completedWorkouts: rawCtx?.completedWorkouts ?? 0,
            bmi: rawCtx?.bmi,
            bmiCategory: rawCtx?.bmiCategory,
            goal: rawCtx?.goal,
            goalType: rawCtx?.goalType,
            availableTime: rawCtx?.availableTime,
            preferredExercises: rawCtx?.preferredExercises ?? [],
            workoutHistory: rawCtx?.workoutHistory ?? [],
            missedDays: rawCtx?.missedDays,
            lastWorkoutDate: rawCtx?.lastWorkoutDate,
        };

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const provider = getAIProvider();
        const prompt = buildChatPrompt(message, userContext);

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
        console.error('Stream chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
    }
});

// ─── Health & Metrics ───
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Fitness AI Backend v2.0 is running',
        cacheSize: cacheService.size,
        uptime: process.uptime(),
    });
});

app.get('/api/metrics', (_req, res) => {
    const metrics = getMetrics();
    res.json({
        total: metrics.length,
        metrics: metrics.slice(-50), // Last 50 entries
    });
});

// ─── Start Server ───
app.listen(config.port, () => {
    console.log(`🚀 Fitness AI Backend v2.0 running on port ${config.port}`);
    console.log(`   Model: ${config.geminiModel}`);
    console.log(`   Rate limit: ${config.rateLimitMax} req/${config.rateLimitWindowMs / 1000}s`);
    console.log(`   Cache TTL: ${config.cacheTtlMs / 1000}s`);
});
