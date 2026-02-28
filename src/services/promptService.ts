// ─── Versioned Prompt Templates ───

import type { UserContext, AvailableExercise } from '../types/index.js';

export const PROMPT_VERSION = 'v1';

function buildContextBlock(ctx: UserContext): string {
  const exerciseBlock = ctx.availableExercises?.length
    ? `\n- Available Exercises from Database:\n${ctx.availableExercises.map((e: AvailableExercise) => `  * ${e.name} (${e.type}, ${e.muscle}, ${e.difficulty})`).join('\n')}`
    : '';

  return `
## User Profile & Context
- BMI: ${ctx.bmi ?? 'Unknown'} (${ctx.bmiCategory ?? 'Not calculated'})
- Fitness Goal: ${ctx.goalType ?? ctx.goal ?? 'Not set'}
- Current Goal: ${ctx.goal ?? 'None'}
- Streak: ${ctx.streak} days
- Completed Workouts: ${ctx.completedWorkouts}
- Available Time Per Day: ${ctx.availableTime ?? 'Unknown'} minutes
- Preferred Exercises: ${ctx.preferredExercises?.join(', ') || 'None specified'}
- Days Since Last Workout: ${ctx.missedDays ?? 'Unknown'}
- Last Workout Date: ${ctx.lastWorkoutDate ?? 'Unknown'}${exerciseBlock}
`.trim();
}

export function buildWorkoutPlanPrompt(ctx: UserContext): string {
  return `
You are an expert fitness coach AI. Generate a personalized 7-day workout plan.

${buildContextBlock(ctx)}

## Instructions
1. Create a balanced 7-day plan with appropriate rest days based on the user's fitness level and goal.
2. Adjust intensity based on their streak and consistency.
3. If they have missed 3+ days, start with lighter recovery workouts.
4. Include estimated calories burned per day.
5. Provide a short motivational coaching message.
6. **IMPORTANT: Use exercise names EXACTLY as they appear in the "Available Exercises from Database" list above.** This ensures exercises link back to full instructions and details. If the list is empty, use common exercises.
7. Prioritize the user's preferred exercises when building the plan.

## Required JSON Output Format
Respond ONLY with valid JSON, no markdown or extra text:
{
  "weekly_plan": [
    {
      "day": "Monday",
      "isRestDay": false,
      "exercises": [
        {
          "name": "Push-ups",
          "type": "strength",
          "sets": 3,
          "reps": 15,
          "duration": null,
          "restBetweenSets": 60,
          "notes": "Keep core engaged"
        }
      ],
      "totalDuration": 45,
      "estimatedCalories": 300
    }
  ],
  "intensity_level": "beginner|intermediate|advanced",
  "rest_days": ["Wednesday", "Sunday"],
  "coaching_message": "Your motivational message here",
  "estimated_calories": 2100
}
`.trim();
}

export function buildProgressAnalysisPrompt(ctx: UserContext): string {
  const historyBlock = ctx.workoutHistory?.length
    ? `\n## Recent Workout History\n${ctx.workoutHistory
      .slice(-14)
      .map(w => `- ${w.date}: ${w.exerciseName} (${w.completed ? 'Completed' : 'Missed'}, ${w.duration ?? '?'}min, ${w.caloriesBurned ?? '?'}cal)`)
      .join('\n')}`
    : '\n## Recent Workout History\nNo workout history available.';

  return `
You are an expert fitness coach AI. Analyze the user's weekly progress.

${buildContextBlock(ctx)}
${historyBlock}

## Instructions
1. Calculate consistency score (0-100) based on completed vs planned workouts.
2. Identify positive and negative trends.
3. Provide actionable recommendations.
4. Write a short coaching message.

## Required JSON Output Format
Respond ONLY with valid JSON, no markdown or extra text:
{
  "summary": "Brief overview of the week",
  "consistency_score": 75,
  "trends": ["Improving upper body strength", "Cardio needs more attention"],
  "recommendations": ["Add 2 cardio sessions", "Increase push-up volume"],
  "coaching_message": "Keep pushing!"
}
`.trim();
}

export function buildRecommendationsPrompt(ctx: UserContext): string {
  return `
You are an expert fitness coach AI. Provide personalized recommendations.

${buildContextBlock(ctx)}

## Instructions
1. Determine if the user should take a rest day based on their streak and recent activity.
2. If they've missed 3+ days, suggest a lighter recovery workout.
3. Adjust intensity recommendation based on consistency.
4. Write a short motivational message.

## Required JSON Output Format
Respond ONLY with valid JSON, no markdown or extra text:
{
  "rest_day_suggestion": false,
  "rest_day_reason": "Only if rest day is suggested",
  "recovery_workout": [
    {
      "name": "Light Stretching",
      "type": "stretching",
      "sets": 1,
      "reps": 1,
      "duration": 10,
      "restBetweenSets": 0,
      "notes": "Gentle full-body stretch"
    }
  ],
  "motivation_message": "Your motivational message",
  "intensity_adjustment": "increase|maintain|decrease",
  "coaching_message": "Personalized coaching tip"
}
`.trim();
}

export function buildChatPrompt(message: string, ctx: UserContext): string {
  return `
You are an expert fitness coach AI. Provide short, actionable, and encouraging fitness advice.

${buildContextBlock(ctx)}

User message: ${message}

Respond conversationally with helpful fitness advice. Keep responses concise (2-4 paragraphs max).
`.trim();
}

export function buildTeachMePrompt(exerciseName: string, ctx: UserContext): string {
  return `
You are an expert fitness coach AI. Teach the user how to perform the following exercise: ${exerciseName}

${buildContextBlock(ctx)}

## Instructions
1. Provide a step-by-step proper form explanation.
2. List common mistakes.
3. List the primary and secondary muscles worked.
4. Provide beginner tips.
5. Provide safety cues.
6. Keep descriptions concise but informative.

## Required JSON Output Format
Respond ONLY with valid JSON, no markdown or extra text:
{
  "form_explanation": [
    "Step 1: Focus on your stance...",
    "Step 2: Engage your core...",
    "Step 3: Descend slowly..."
  ],
  "common_mistakes": ["Mistake 1", "Mistake 2"],
  "muscles_worked": ["Primary: Quads", "Secondary: Glutes"],
  "beginner_tips": ["Tip 1", "Tip 2"],
  "safety_cues": ["Cue 1", "Cue 2"]
}
`.trim();
}

