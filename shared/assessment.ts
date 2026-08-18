import type { LevelCode } from "./learning";

export type AssessmentQuestion = {
  id: string;
  skill: "grammar" | "vocabulary" | "reading" | "listening" | "translation";
  difficulty: "foundation" | "stretch";
  type: "choice" | "text";
  prompt: string;
  support?: string;
  options?: string[];
  answer: string;
  explanation: string;
};

export type PublicAssessmentQuestion = Omit<AssessmentQuestion, "answer" | "explanation">;

const assessmentBank: AssessmentQuestion[] = [
  { id: "g1", skill: "grammar", difficulty: "foundation", type: "choice", prompt: "Choose the correct sentence.", options: ["She go to work every day.", "She goes to work every day.", "She going to work every day."], answer: "She goes to work every day.", explanation: "Для he/she/it в Present Simple к глаголу добавляется -s." },
  { id: "g2", skill: "grammar", difficulty: "stretch", type: "choice", prompt: "If I ___ more time, I would learn another language.", options: ["have", "had", "will have"], answer: "had", explanation: "Во втором условном предложении используется Past Simple: If I had…" },
  { id: "g3", skill: "grammar", difficulty: "stretch", type: "text", prompt: "Complete the sentence with one word: “By next year, I ___ have finished the course.”", answer: "will", explanation: "Future Perfect строится как will have + V3." },
  { id: "v1", skill: "vocabulary", difficulty: "foundation", type: "choice", prompt: "Choose the closest meaning of “reliable”.", options: ["can be trusted", "very expensive", "difficult to see"], answer: "can be trusted", explanation: "Reliable — надёжный, тот, кому можно доверять." },
  { id: "v2", skill: "vocabulary", difficulty: "stretch", type: "choice", prompt: "Which word best completes: “The research results were ___ by independent experts.”", options: ["verified", "ignored", "invented"], answer: "verified", explanation: "Verified означает подтверждённый проверкой." },
  { id: "r1", skill: "reading", difficulty: "foundation", type: "choice", prompt: "Read: “Maya postponed the meeting because the report was not ready.” Why was the meeting postponed?", options: ["The report was unfinished.", "Maya was on holiday.", "The room was closed."], answer: "The report was unfinished.", explanation: "В тексте прямо сказано, что отчёт не был готов." },
  { id: "r2", skill: "reading", difficulty: "stretch", type: "choice", prompt: "Read: “Although the proposal was ambitious, it lacked a feasible budget.” What was the main concern?", options: ["The budget could not realistically work.", "The proposal was too short.", "The team had no ideas."], answer: "The budget could not realistically work.", explanation: "Feasible — осуществимый; concern связан с нереалистичным бюджетом." },
  { id: "l1", skill: "listening", difficulty: "foundation", type: "text", prompt: "Listen and type exactly what you hear.", support: "The assistant will say a short sentence in English.", answer: "I study English every morning.", explanation: "Сверь порядок слов, форму study и обстоятельство every morning." },
  { id: "l2", skill: "listening", difficulty: "stretch", type: "text", prompt: "Listen and type exactly what you hear.", support: "The assistant will say an academic-style sentence in English.", answer: "The data suggests a significant improvement.", explanation: "Обрати внимание на suggests и словосочетание significant improvement." },
  { id: "t1", skill: "translation", difficulty: "foundation", type: "text", prompt: "Translate into English: «Я работаю над этим проектом каждый день».", answer: "I work on this project every day.", explanation: "В Present Simple используем work on + object." },
  { id: "t2", skill: "translation", difficulty: "stretch", type: "text", prompt: "Translate into English: «Несмотря на трудности, команда достигла цели».", answer: "Despite the difficulties, the team achieved the goal.", explanation: "Despite используется с существительным: despite the difficulties." },
  { id: "g4", skill: "grammar", difficulty: "foundation", type: "choice", prompt: "Which question is correct?", options: ["Where you live?", "Where do you live?", "Where does you live?"], answer: "Where do you live?", explanation: "Вопрос в Present Simple: do + subject + base verb." },
  { id: "v3", skill: "vocabulary", difficulty: "stretch", type: "choice", prompt: "“To allocate resources” most nearly means:", options: ["to distribute resources for a purpose", "to remove resources", "to copy resources"], answer: "to distribute resources for a purpose", explanation: "Allocate — распределять ресурсы по назначению." },
];

const hashSeed = (seed: string) => Array.from(seed).reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);

export function createAssessment(seed: string, targetLevel: LevelCode = "A0", count = 8) {
  const offset = hashSeed(`${seed}-${targetLevel}`) % assessmentBank.length;
  const rotated = [...assessmentBank.slice(offset), ...assessmentBank.slice(0, offset)];
  const selected: AssessmentQuestion[] = [];
  for (const question of rotated) {
    if (!selected.some((item) => item.skill === question.skill && item.difficulty === question.difficulty)) selected.push(question);
    if (selected.length === count) break;
  }
  for (const question of rotated) {
    if (!selected.some((item) => item.id === question.id)) selected.push(question);
    if (selected.length === count) break;
  }
  return selected;
}

export function mapScoreToLevel(score: number): LevelCode {
  if (score >= 88) return "B2";
  if (score >= 72) return "B1";
  if (score >= 55) return "A2";
  if (score >= 35) return "A1";
  return "A0";
}

export function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[.,!?;:'"’]/g, "").replace(/\s+/g, " ").trim();
}

export function getAdaptiveNextQuestion(questions: AssessmentQuestion[], servedIds: string[], previousCorrect: boolean) {
  const preferredDifficulty = previousCorrect ? "stretch" : "foundation";
  return questions.find((question) => !servedIds.includes(question.id) && question.difficulty === preferredDifficulty)
    ?? questions.find((question) => !servedIds.includes(question.id));
}
