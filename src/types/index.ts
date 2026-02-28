// ─── Shared TypeScript Types ───

export interface AvailableExercise {
    name: string;
    type: string;
    muscle: string;
    difficulty: string;
}

export interface UserContext {
    bmi?: number;
    bmiCategory?: string;
    goal?: string;
    goalType?: 'fat_loss' | 'muscle_gain' | 'maintenance';
    streak: number;
    completedWorkouts: number;
    availableTime?: number; // minutes per day
    preferredExercises?: string[];
    workoutHistory?: WorkoutHistoryEntry[];
    missedDays?: number;
    lastWorkoutDate?: string;
    availableExercises?: AvailableExercise[];
}

export interface WorkoutHistoryEntry {
    date: string;
    exerciseName: string;
    duration?: number;
    caloriesBurned?: number;
    completed: boolean;
}

export interface DayPlan {
    day: string;
    isRestDay: boolean;
    exercises: PlannedExercise[];
    totalDuration: number;
    estimatedCalories: number;
}

export interface PlannedExercise {
    name: string;
    type: string;
    sets: number;
    reps: number;
    duration?: number;
    restBetweenSets: number;
    notes?: string;
}

export interface WorkoutPlanResponse {
    weekly_plan: DayPlan[];
    intensity_level: 'beginner' | 'intermediate' | 'advanced';
    rest_days: string[];
    coaching_message: string;
    estimated_calories: number;
    prompt_version: string;
}

export interface ProgressAnalysisResponse {
    summary: string;
    consistency_score: number;
    trends: string[];
    recommendations: string[];
    coaching_message: string;
    prompt_version: string;
}

export interface RecommendationsResponse {
    rest_day_suggestion: boolean;
    rest_day_reason?: string;
    recovery_workout?: PlannedExercise[];
    motivation_message: string;
    intensity_adjustment: 'increase' | 'maintain' | 'decrease';
    coaching_message: string;
    prompt_version: string;
}

export interface TeachMeResponse {
    form_explanation: string[];
    common_mistakes: string[];
    muscles_worked: string[];
    beginner_tips: string[];
    safety_cues: string[];
    prompt_version: string;
}

export interface AIRequestBody {
    message?: string;
    userContext: UserContext;
}

export interface MetricsEntry {
    endpoint: string;
    timestamp: string;
    firstTokenLatencyMs?: number;
    totalResponseTimeMs: number;
    promptVersion: string;
    cacheHit: boolean;
    statusCode: number;
    userContextHash: string;
}
