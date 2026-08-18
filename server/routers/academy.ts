import { z } from "zod";
import { completeDailyTask, getStudentWorkspace, recordAssessmentAnswer, saveDailyEssay, startAssessment, submitAssessment } from "../planDb";
import { protectedProcedure, router } from "../_core/trpc";

export const academyRouter = router({
  workspace: protectedProcedure.query(async ({ ctx }) => {
    const workspace = await getStudentWorkspace(ctx.user.id);
    if (!workspace) throw new Error("Learning workspace unavailable");
    return workspace;
  }),
  startAssessment: protectedProcedure.input(z.object({ type: z.enum(["diagnostic", "promotion", "ielts"]) })).mutation(async ({ ctx, input }) => {
    return startAssessment(ctx.user.id, input.type);
  }),
  answerAssessment: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), questionId: z.string().min(1), answer: z.string().trim().max(1000) })).mutation(async ({ ctx, input }) => {
    return recordAssessmentAnswer({ userId: ctx.user.id, ...input });
  }),
  submitAssessment: protectedProcedure.input(z.object({ attemptId: z.number().int().positive(), answers: z.record(z.string(), z.string()), careerTrack: z.string().trim().max(100).optional() })).mutation(async ({ ctx, input }) => {
    return submitAssessment({ userId: ctx.user.id, ...input });
  }),
  completeTask: protectedProcedure.input(z.object({ taskId: z.number().int().positive(), answer: z.string().trim().max(1000) })).mutation(async ({ ctx, input }) => {
    return completeDailyTask({ userId: ctx.user.id, ...input });
  }),
  saveEssay: protectedProcedure.input(z.object({ body: z.string().max(8000) })).mutation(async ({ ctx, input }) => {
    return saveDailyEssay({ userId: ctx.user.id, ...input });
  }),
});
