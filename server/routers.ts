import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeLessonForUser, getLearningSummary } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  learning: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const data = await getLearningSummary(ctx.user.id);
      return data ?? { profile: null, progress: [] };
    }),
    completeLesson: protectedProcedure.input(z.object({ lessonId: z.string().min(1).max(80), score: z.number().min(0).max(100) })).mutation(async ({ ctx, input }) => {
      return completeLessonForUser({ userId: ctx.user.id, ...input });
    }),
  }),
  dChat: router({
    ask: protectedProcedure.input(z.object({ message: z.string().trim().min(1).max(500) })).mutation(async ({ input }) => {
      const { data: models } = await listLLMModels();
      const model = models.find((item) => item.id === "gpt-5-mini")?.id ?? models[0]?.id;
      const response = await invokeLLM({
        model,
        messages: [
          { role: "system", content: "Ты D — доброжелательный помощник-пантера сервиса D-English. Отвечай по-русски кратко, позитивно и только в учебном контексте английского: объясняй лексику, грамматику, задания и предлагай короткие примеры. Не выполняй тест за пользователя, а направляй его. Никогда не стыди за ошибки. Максимум 120 слов." },
          { role: "user", content: input.message },
        ],
      });
      const content = response.choices[0]?.message.content;
      const reply = (typeof content === "string" ? content.trim() : "") || "Почти. Давай разберём этот момент вместе.";
      return { reply };
    }),
  }),
});

export type AppRouter = typeof appRouter;
