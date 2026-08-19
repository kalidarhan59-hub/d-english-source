import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { completeLessonForUser, getLearningSummary } from "./db";
import { academyRouter } from "./routers/academy";
import { clearLocalSession, setLocalSession } from "./localAuth";
import { createLocalUser, getUserByUsername } from "./db";
import { LocalAccountError, loginLocalAccount, registerLocalAccount } from "./localAccount";
import type { TrpcContext } from "./_core/context";

export type LocalAuthDependencies = {
  findByUsername: typeof getUserByUsername;
  create: typeof createLocalUser;
  setSession: (ctx: TrpcContext, userId: number) => Promise<void>;
  clearSession: (ctx: TrpcContext) => void;
};

export function createAuthRouter(deps: LocalAuthDependencies) {
  return router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({ username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/), email: z.string().trim().email().max(320), password: z.string().min(8).max(128), confirmPassword: z.string().min(8).max(128) }).refine((data) => data.password === data.confirmPassword, { message: "Пароли не совпадают", path: ["confirmPassword"] })).mutation(async ({ ctx, input }) => {
      let user;
      try {
        user = await registerLocalAccount(input, { findByUsername: deps.findByUsername, create: deps.create });
      } catch (error) {
        if (error instanceof LocalAccountError && error.reason === "username_taken") throw new TRPCError({ code: "CONFLICT", message: "Этот логин уже занят" });
        throw error;
      }
      await deps.setSession(ctx, user.id);
      return { id: user.id, username: user.username, name: user.name };
    }),
    login: publicProcedure.input(z.object({ username: z.string().trim().min(3).max(32), password: z.string().min(8).max(128) })).mutation(async ({ ctx, input }) => {
      let user;
      try {
        user = await loginLocalAccount(input, { findByUsername: deps.findByUsername });
      } catch (error) {
        if (error instanceof LocalAccountError && error.reason === "invalid_credentials") throw new TRPCError({ code: "UNAUTHORIZED", message: "Неверный логин или пароль" });
        throw error;
      }
      await deps.setSession(ctx, user.id);
      return { id: user.id, username: user.username, name: user.name };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      deps.clearSession(ctx);
      return { success: true } as const;
    }),
  });
}

const authRouter = createAuthRouter({
  findByUsername: getUserByUsername,
  create: createLocalUser,
  setSession: (ctx, userId) => setLocalSession(ctx.req, ctx.res, userId),
  clearSession: (ctx) => clearLocalSession(ctx.req, ctx.res),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: authRouter,
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
  academy: academyRouter,
});

export type AppRouter = typeof appRouter;
