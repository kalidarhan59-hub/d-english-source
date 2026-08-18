import { and, asc, desc, eq } from "drizzle-orm";
import { assessmentAttempts, dailyTasks, essayEntries, learningProfiles, questProgress, vocabularyProgress } from "../drizzle/schema";
import { createAssessment, getAdaptiveNextQuestion, mapScoreToLevel, normalizeAnswer, type AssessmentQuestion, type PublicAssessmentQuestion } from "../shared/assessment";
import { calculateNextStreak, canCompleteDailyTask, canOpenPromotionTest, levels, type LevelCode } from "../shared/learning";
import { ensureLearningProfile, getDb, getLearningProfile } from "./db";

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const publicQuestions = (questions: AssessmentQuestion[]): PublicAssessmentQuestion[] => questions.map(({ answer: _answer, explanation: _explanation, ...question }) => question);

const essayTopics = [
  "Some people believe that universities should focus on practical skills, while others value academic knowledge. Discuss both views and give your opinion.",
  "Technology makes communication easier, but it can weaken real-life relationships. To what extent do you agree?",
  "Governments should spend more money on public transport than on new roads. Discuss both views and give your opinion.",
  "Some people think employers should allow staff to work from home. What are the advantages and disadvantages?",
];

const videos = [
  { title: "BBC Learning English", description: "Аудирование, произношение, словарь и короткие уроки.", href: "https://www.youtube.com/@bbclearningenglish", tag: "General English" },
  { title: "IELTS Official", description: "Официальные разборы формата и критериев Writing.", href: "https://www.youtube.com/@IELTSOfficial", tag: "IELTS" },
  { title: "IELTS Liz", description: "Практические разборы заданий IELTS.", href: "https://www.youtube.com/ieltsliz", tag: "IELTS practice" },
];

type GeneratedTask = { taskKey: string; taskType: string; difficulty: string; title: string; prompt: string; expectedAnswer: string };

function buildDailyTasks(level: LevelCode, date: string, learningTrack: string, careerTrack: string): GeneratedTask[] {
  const advanced = ["B1", "B2", "C1", "C2"].includes(level);
  const listeningSentence = advanced ? "The data suggests a significant improvement." : "I study English every morning.";
  const professional = learningTrack === "professional";
  const engineering = careerTrack.toLowerCase().includes("engineer");
  const chemBio = careerTrack.toLowerCase().includes("chem") || careerTrack.toLowerCase().includes("bio");
  const professionalTranslation = engineering ? "The inspection report identified a safety risk." : chemBio ? "The experiment produced reproducible results." : "The client approved the revised proposal.";
  const professionalVocabulary = engineering ? { word: "specification", translation: "спецификация" } : chemBio ? { word: "sample", translation: "образец" } : { word: "deadline", translation: "срок" };
  const professionalReading = engineering ? { prompt: "Read: “The design review found that the component could overheat under peak load.” What was the risk?", answer: "The component could overheat." } : chemBio ? { prompt: "Read: “The control group did not receive the treatment.” What was its role?", answer: "It provided a comparison baseline." } : { prompt: "Read: “The client requested a revised proposal before approving the budget.” What did the client want?", answer: "A revised proposal." };
  return [
    { taskKey: "grammar-order", taskType: "grammar", difficulty: advanced ? "stretch" : "foundation", title: "Порядок слов", prompt: advanced ? "Составь предложение: despite / the delay / the team / met / the deadline" : "Составь предложение: every day / English / I / study", expectedAnswer: advanced ? "Despite the delay, the team met the deadline." : "I study English every day." },
    { taskKey: "translation", taskType: "translation", difficulty: advanced ? "stretch" : "foundation", title: professional ? "Профессиональный перевод" : "Перевод", prompt: professional ? `Переведи: «${professionalTranslation === "The inspection report identified a safety risk." ? "Отчёт об инспекции выявил риск безопасности" : professionalTranslation === "The experiment produced reproducible results." ? "Эксперимент дал воспроизводимые результаты" : "Клиент утвердил пересмотренное предложение"}»` : advanced ? "Переведи: «Исследование показало заметное улучшение результатов»" : "Переведи: «Я работаю над этим проектом каждый день»", expectedAnswer: professional ? professionalTranslation : advanced ? "The study showed a significant improvement in results." : "I work on this project every day." },
    { taskKey: "listening-dictation", taskType: "listening", difficulty: advanced ? "stretch" : "foundation", title: "Диктант по аудио", prompt: "Прослушай фразу и напиши её целиком.", expectedAnswer: listeningSentence },
    { taskKey: "vocabulary", taskType: "vocabulary", difficulty: advanced ? "stretch" : "foundation", title: professional ? "Термин трека" : "Слово дня", prompt: professional ? `Введи перевод слова “${professionalVocabulary.word}”.` : advanced ? "Введи перевод слова “evidence”." : "Введи перевод слова “reliable”.", expectedAnswer: professional ? professionalVocabulary.translation : advanced ? "доказательство" : "надёжный" },
    { taskKey: "reading", taskType: "reading", difficulty: advanced ? "stretch" : "foundation", title: professional ? "Кейс по треку" : "Понимание текста", prompt: professional ? professionalReading.prompt : advanced ? "Read: “The proposal was ambitious but lacked a feasible budget.” What was the issue?" : "Read: “Maya postponed the meeting because the report was not ready.” Why was it postponed?", expectedAnswer: professional ? professionalReading.answer : advanced ? "The budget was not feasible." : "The report was not ready." },
  ];
}

function getProgramPlan(input: { startedAt: Date | null; careerTrack: string; ieltsBand: string; learningTrack: string; completedLessons: number }) {
  const { startedAt, careerTrack, ieltsBand, learningTrack, completedLessons } = input;
  const start = startedAt ?? new Date();
  const months = Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const phase = learningTrack === "professional" ? "professional" : learningTrack === "ielts" || (months >= 5 && completedLessons >= 300) ? "ielts" : "academic";
  const normalizedTrack = careerTrack.toLowerCase();
  const professionalModules = normalizedTrack.includes("engineer") ? "Техническая документация, design review, безопасность, переговоры и инженерные кейсы." : normalizedTrack.includes("chem") || normalizedTrack.includes("bio") ? "Научные статьи, лабораторные протоколы, методы, данные и академические обсуждения." : `Терминология ${careerTrack}, рабочие документы, кейсы и профессиональные обсуждения.`;
  return {
    phase,
    monthsElapsed: months,
    ieltsBand,
    modules: [
      { id: "academic", label: "Academic English", duration: "5 месяцев", status: phase === "academic" ? "active" : "done", description: "Академическое чтение, письмо, аргументация, лекции и точность языка." },
      { id: "ielts", label: "IELTS checkpoint", duration: "после Academic English", status: phase === "ielts" ? "active" : phase === "professional" ? "done" : "locked", description: `Переход к шкале IELTS band score. Текущий ориентир: ${ieltsBand}.` },
      { id: "professional", label: `${careerTrack} in English`, duration: "до 12 месяцев", status: phase === "professional" ? "active" : "locked", description: professionalModules },
    ],
  };
}

async function ensureTodayData(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const profile = await getLearningProfile(userId);
  if (!profile) return undefined;
  const date = dayKey();
  if (profile.diagnosticComplete !== 1) return { profile, date, tasks: [], essay: undefined, quests: [] };
  let tasks = await db.select().from(dailyTasks).where(and(eq(dailyTasks.userId, userId), eq(dailyTasks.taskDate, date))).orderBy(asc(dailyTasks.id));
  if (!tasks.length) {
    const level = profile.currentLevel as LevelCode;
    const built = buildDailyTasks(level, date, profile.learningTrack, profile.careerTrack);
    await db.insert(dailyTasks).values(built.map((task) => ({ userId, taskDate: date, level, ...task })));
    await db.update(learningProfiles).set({ dailyTaskCount: 0, dailyTaskDate: date }).where(eq(learningProfiles.userId, userId));
    tasks = await db.select().from(dailyTasks).where(and(eq(dailyTasks.userId, userId), eq(dailyTasks.taskDate, date))).orderBy(asc(dailyTasks.id));
  }
  let essay = await db.select().from(essayEntries).where(and(eq(essayEntries.userId, userId), eq(essayEntries.taskDate, date))).limit(1);
  if (!essay[0]) {
    const topic = essayTopics[Number(date.slice(-2)) % essayTopics.length];
    await db.insert(essayEntries).values({ userId, taskDate: date, topic });
    essay = await db.select().from(essayEntries).where(and(eq(essayEntries.userId, userId), eq(essayEntries.taskDate, date))).limit(1);
  }
  let quests = await db.select().from(questProgress).where(eq(questProgress.userId, userId)).orderBy(asc(questProgress.id));
  if (!quests.length) {
    await db.insert(questProgress).values([
      { userId, questKey: "perfect-five", title: "Точность дня", goal: 5, current: 0 },
      { userId, questKey: "vocab-week", title: "Словарь недели", goal: 20, current: 0 },
    ]);
    quests = await db.select().from(questProgress).where(eq(questProgress.userId, userId)).orderBy(asc(questProgress.id));
  }
  return { profile, date, tasks, essay: essay[0], quests };
}

export async function getStudentWorkspace(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const data = await ensureTodayData(userId);
  if (!data) return undefined;
  const preliminaryPlan = getProgramPlan({ startedAt: data.profile.academicStartedAt, careerTrack: data.profile.careerTrack, ieltsBand: data.profile.ieltsBand, learningTrack: data.profile.learningTrack, completedLessons: data.profile.completedLessons });
  if (preliminaryPlan.phase === "ielts" && data.profile.learningTrack === "academic") {
    await db.update(learningProfiles).set({ learningTrack: "ielts" }).where(eq(learningProfiles.userId, userId));
    data.profile.learningTrack = "ielts";
  }
  const vocabulary = await db.select().from(vocabularyProgress).where(eq(vocabularyProgress.userId, userId)).orderBy(desc(vocabularyProgress.lastReviewedAt)).limit(60);
  const history = await db.select().from(dailyTasks).where(eq(dailyTasks.userId, userId)).orderBy(desc(dailyTasks.updatedAt)).limit(20);
  return { ...data, vocabulary, history, plan: getProgramPlan({ startedAt: data.profile.academicStartedAt, careerTrack: data.profile.careerTrack, ieltsBand: data.profile.ieltsBand, learningTrack: data.profile.learningTrack, completedLessons: data.profile.completedLessons }), videos };
}

export async function getLearningProfileStatus(userId: number) {
  const profile = await getLearningProfile(userId);
  return { exists: Boolean(profile), diagnosticComplete: profile?.diagnosticComplete === 1 };
}

export async function createLearningProfile(userId: number) {
  const profile = await ensureLearningProfile(userId, true);
  if (!profile) throw new Error("Learning profile unavailable");
  return { created: true, diagnosticComplete: profile.diagnosticComplete === 1 };
}

export async function startAssessment(userId: number, type: "diagnostic" | "promotion" | "ielts") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const profile = await getLearningProfile(userId);
  if (!profile) throw new Error("Create a learning profile before starting an assessment");
  const targetLevel = type === "promotion" ? levels[Math.min(levels.indexOf(profile.currentLevel as LevelCode) + 1, levels.length - 1)] : profile.currentLevel as LevelCode;
  const questions = createAssessment(`${userId}-${Date.now()}-${type}`, targetLevel, type === "diagnostic" ? 8 : 6);
  const payload = { questions, responses: {} as Record<string, string>, servedIds: [questions[0].id] };
  const result = await db.insert(assessmentAttempts).values({ userId, assessmentType: type, targetLevel, questionsPayload: JSON.stringify(payload) });
  return { id: Number(result[0].insertId), type, targetLevel, questions: publicQuestions(questions) };
}

export async function recordAssessmentAnswer(input: { userId: number; attemptId: number; questionId: string; answer: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const attempt = await db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.id, input.attemptId), eq(assessmentAttempts.userId, input.userId))).limit(1);
  if (!attempt[0]) throw new Error("Assessment not found");
  const parsed = JSON.parse(attempt[0].questionsPayload) as { questions?: AssessmentQuestion[]; responses?: Record<string, string>; servedIds?: string[] } | AssessmentQuestion[];
  const questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
  const responses = Array.isArray(parsed) ? {} : parsed.responses ?? {};
  const servedIds = Array.isArray(parsed) ? [questions[0]?.id].filter(Boolean) as string[] : parsed.servedIds ?? [];
  const question = questions.find((item) => item.id === input.questionId);
  if (!question || !servedIds.includes(question.id)) throw new Error("Question not available");
  const correct = normalizeAnswer(input.answer) === normalizeAnswer(question.answer);
  responses[question.id] = input.answer;
  const next = getAdaptiveNextQuestion(questions, servedIds, correct);
  if (next) servedIds.push(next.id);
  await db.update(assessmentAttempts).set({ questionsPayload: JSON.stringify({ questions, responses, servedIds }) }).where(eq(assessmentAttempts.id, input.attemptId));
  return { correct, nextQuestion: next ? publicQuestions([next])[0] : null, servedCount: servedIds.length, total: questions.length };
}

export async function submitAssessment(input: { userId: number; attemptId: number; answers: Record<string, string>; careerTrack?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const attempt = await db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.id, input.attemptId), eq(assessmentAttempts.userId, input.userId))).limit(1);
  if (!attempt[0]) throw new Error("Assessment not found");
  const parsed = JSON.parse(attempt[0].questionsPayload) as { questions?: AssessmentQuestion[]; responses?: Record<string, string>; servedIds?: string[] } | AssessmentQuestion[];
  const questions = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
  const responses = Array.isArray(parsed) ? input.answers : { ...(parsed.responses ?? {}), ...input.answers };
  const servedIds = Array.isArray(parsed) ? questions.map((question) => question.id) : parsed.servedIds ?? [];
  const assessedQuestions = questions.filter((question) => servedIds.includes(question.id));
  const correct = assessedQuestions.filter((question) => normalizeAnswer(responses[question.id] ?? "") === normalizeAnswer(question.answer)).length;
  const score = Math.round((correct / Math.max(1, assessedQuestions.length)) * 100);
  const profile = await getLearningProfile(input.userId);
  if (!profile) throw new Error("Learning profile unavailable");
  const type = attempt[0].assessmentType;
  const nextLevel = type === "diagnostic" ? mapScoreToLevel(score) : attempt[0].targetLevel as LevelCode;
  const passed = type === "diagnostic" ? 1 : score >= 80 ? 1 : 0;
  const ieltsBand = score >= 88 ? "7.5" : score >= 75 ? "6.5" : score >= 60 ? "6.0" : "5.5";
  await db.update(assessmentAttempts).set({ score, passed, completedAt: new Date() }).where(eq(assessmentAttempts.id, input.attemptId));
  if (type === "diagnostic") {
    await db.update(learningProfiles).set({ diagnosticComplete: 1, diagnosticLevel: nextLevel, diagnosticScore: score, currentLevel: nextLevel, mascotStage: nextLevel, careerTrack: input.careerTrack?.slice(0, 100) || profile.careerTrack, academicStartedAt: profile.academicStartedAt ?? new Date(), promotionReady: 0 }).where(eq(learningProfiles.userId, input.userId));
  } else if (type === "promotion" && passed) {
    await db.update(learningProfiles).set({ currentLevel: nextLevel, mascotStage: nextLevel, promotionReady: 0 }).where(eq(learningProfiles.userId, input.userId));
  } else if (type === "ielts") {
    await db.update(learningProfiles).set({ learningTrack: "professional", ieltsBand }).where(eq(learningProfiles.userId, input.userId));
  }
  return { score, passed: Boolean(passed), level: passed ? nextLevel : profile.currentLevel, ieltsBand: type === "ielts" ? ieltsBand : undefined, corrections: assessedQuestions.map((question) => ({ id: question.id, correct: normalizeAnswer(responses[question.id] ?? "") === normalizeAnswer(question.answer), answer: question.answer, explanation: question.explanation })) };
}

export async function completeDailyTask(input: { userId: number; taskId: number; answer: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const data = await ensureTodayData(input.userId);
  if (!data?.profile || data.profile.diagnosticComplete !== 1) throw new Error("Diagnostic required");
  const task = await db.select().from(dailyTasks).where(and(eq(dailyTasks.id, input.taskId), eq(dailyTasks.userId, input.userId), eq(dailyTasks.taskDate, data.date))).limit(1);
  if (!task[0]) throw new Error("Task not found");
  const item = task[0];
  const isCorrect = normalizeAnswer(input.answer) === normalizeAnswer(item.expectedAnswer);
  if (item.completed === 0) {
    if (data.profile.dailyTaskDate === data.date && !canCompleteDailyTask(data.profile.dailyTaskCount)) throw new Error("Daily task limit reached");
    const xpGain = isCorrect ? 8 : 1;
    const newXp = data.profile.xp + xpGain;
    const count = data.profile.dailyTaskDate === data.date ? data.profile.dailyTaskCount + 1 : 1;
    const nextStreak = calculateNextStreak(data.profile.streak, data.profile.lastActiveAt, new Date());
    await db.update(dailyTasks).set({ completed: 1, score: isCorrect ? 100 : 0 }).where(eq(dailyTasks.id, item.id));
    await db.update(learningProfiles).set({ xp: newXp, completedLessons: data.profile.completedLessons + 1, dailyTaskCount: count, dailyTaskDate: data.date, streak: nextStreak, lastActiveAt: new Date() }).where(eq(learningProfiles.userId, input.userId));
    if (item.taskType === "vocabulary") {
      const word = item.prompt.includes("evidence") ? "evidence" : "reliable";
      await db.insert(vocabularyProgress).values({ userId: input.userId, word, translation: item.expectedAnswer, source: "Задача дня" }).onDuplicateKeyUpdate({ set: { mastery: 2, lastReviewedAt: new Date() } });
      const vocabularyQuest = await db.select().from(questProgress).where(and(eq(questProgress.userId, input.userId), eq(questProgress.questKey, "vocab-week"))).limit(1);
      if (vocabularyQuest[0]) {
        const nextCurrent = Math.min(vocabularyQuest[0].goal, vocabularyQuest[0].current + 1);
        await db.update(questProgress).set({ current: nextCurrent, completed: nextCurrent >= vocabularyQuest[0].goal ? 1 : 0, completedAt: nextCurrent >= vocabularyQuest[0].goal ? new Date() : null }).where(eq(questProgress.id, vocabularyQuest[0].id));
      }
    }
    const updatedTasks = await db.select().from(dailyTasks).where(and(eq(dailyTasks.userId, input.userId), eq(dailyTasks.taskDate, data.date)));
    const allPerfect = updatedTasks.length === 5 && updatedTasks.every((daily) => daily.completed === 1 && daily.score === 100);
    const currentIndex = levels.indexOf(data.profile.currentLevel as LevelCode);
    const nextLevel = levels[currentIndex + 1];
    if (canOpenPromotionTest({ allPerfect, nextLevel, xp: newXp, streak: nextStreak })) {
      await db.update(learningProfiles).set({ promotionReady: 1 }).where(eq(learningProfiles.userId, input.userId));
      await db.update(questProgress).set({ current: 5, completed: 1, completedAt: new Date() }).where(and(eq(questProgress.userId, input.userId), eq(questProgress.questKey, "perfect-five")));
    }
  }
  return { correct: isCorrect, expectedAnswer: item.expectedAnswer, explanation: isCorrect ? "Точно. Продолжай в том же ритме." : "Почти. Сравни свой ответ с правильным вариантом и попробуй применить правило в следующей задаче." };
}

export async function saveDailyEssay(input: { userId: number; body: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const data = await ensureTodayData(input.userId);
  if (!data?.essay) throw new Error("Daily essay unavailable");
  const status = input.body.trim() ? "submitted" : "draft";
  await db.update(essayEntries).set({ body: input.body.slice(0, 8000), status }).where(eq(essayEntries.id, data.essay.id));
  return { success: true, status };
}
