// ─── Request Validation Middleware ───

import { Request, Response, NextFunction } from 'express';
import type { UserContext } from '../types/index.js';

/** Validate that userContext exists and has required fields */
export function validateUserContext(req: Request, res: Response, next: NextFunction): void {
    const { userContext } = req.body;

    if (!userContext || typeof userContext !== 'object') {
        res.status(400).json({
            error: 'Missing or invalid userContext in request body',
            required: { userContext: { streak: 'number', completedWorkouts: 'number' } },
        });
        return;
    }

    // Ensure minimum required fields with defaults
    const ctx: UserContext = {
        streak: userContext.streak ?? 0,
        completedWorkouts: userContext.completedWorkouts ?? 0,
        bmi: userContext.bmi,
        bmiCategory: userContext.bmiCategory,
        goal: userContext.goal,
        goalType: userContext.goalType,
        availableTime: userContext.availableTime,
        preferredExercises: userContext.preferredExercises ?? [],
        workoutHistory: userContext.workoutHistory ?? [],
        missedDays: userContext.missedDays,
        lastWorkoutDate: userContext.lastWorkoutDate,
    };

    req.body.userContext = ctx;
    next();
}

/** Validate chat message exists */
export function validateChatMessage(req: Request, res: Response, next: NextFunction): void {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
            error: 'Missing or empty message in request body',
        });
        return;
    }

    next();
}
