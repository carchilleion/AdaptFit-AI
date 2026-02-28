// ─── AI Routes ───

import { Router } from 'express';
import { generateWorkoutPlan, streamWorkoutPlan } from '../controllers/workoutPlanController.js';
import { analyzeProgress } from '../controllers/progressAnalysisController.js';
import { getRecommendations } from '../controllers/recommendationsController.js';
import { getTeachMe } from '../controllers/teachMeController.js';
import { validateUserContext } from '../middleware/validateRequest.js';

const router = Router();

// All AI routes require validated user context
router.post('/workout-plan', validateUserContext, generateWorkoutPlan);
router.post('/workout-plan/stream', validateUserContext, streamWorkoutPlan);
router.post('/progress-analysis', validateUserContext, analyzeProgress);
router.post('/personalized-recommendations', validateUserContext, getRecommendations);
router.post('/teach-me', validateUserContext, getTeachMe);

export default router;
