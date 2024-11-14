export interface User {
  email: string;
  password: string;
  oldPasswords: string[];
  nameFirst: string;
  nameLast: string;
  name: string;
  authUserId: number;
  timeCreated: number;
  numSuccessfulLogins: number;
  numFailedPasswordsSinceLastLogin: number;
  tokens: Token[];
}

export interface UserInfo {
  user:
  {
    userId: number
    name: string,
    email: string,
    numSuccessfulLogins: number,
    numFailedPasswordsSinceLastLogin: number
  }
}

export interface Token {
  sessionId: number;
  authUserId: number;
}

export interface Quiz {
  authUserId: number;
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  questions: QuestionInfo[];
  timeLimit: number;
  thumbnailUrl: string;
}

export interface QuizID {
  quizId: number;
}

export interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numOfQuestions: number,
  questions: QuestionInfo[],
}

export interface QuizInfoSimple {
  quizId: number,
  name: string,
}

export interface QuizInfoSimpleArray {
  quizzes: QuizInfoSimple[];
}

export interface QuizInfoDetailed {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numOfQuestions: number,
  questions: QuestionInfo[],
  timeLimit: number,
  thumbnailUrl: string,
}

export interface AnswerOptionsReq {
  answer: string;
  correct: boolean;
}

export interface AnswerOptions {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface QuestionInfo {
  questionId: number,
  question: string,
  timeLimit: number,
  thumbnailUrl: string,
  points: number,
  answerOptions: AnswerOptions[],
  playersCorrect ?: string[],
  averageAnswerTime ?: number,
  percentCorrect ?: number,
  timeOpened ?: number,
  playersAnswered ?: playerAnswerInfo[];
}

export interface playerAnswerInfo {
  playerId: string,
  timeAnswered: number,
}

export interface QuestionCreateReq {
  question: string;
  timeLimit: number;
  points: number;
  answerOptions: AnswerOptions[];
  thumbnailUrl?: string;
}

export interface sessionPlayer {
  name: string,
  playerId: number,
  score: number,
}

export interface Session {
  sessionId: number,
  autoStartNum: number,
  state: string,
  atQuestion: number,
  players: sessionPlayer[],
  metadata: Quiz,
  messages: Message[],
}

export interface SessionId {
  sessionId: number,
}

export interface PlayerId {
  playerId: number,
}

export interface Message {
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number,
}

export interface Trash {
  authUserId: number;
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
}

export interface Data {
  users: User[];
  quizzes: Quiz[];
  sessions: Session[];
  trash: Quiz[];
}

export interface ErrorResponse {
  error: string;
}

export interface QuestionIdObject {
  questionId: number;
}

export interface AdminUserDetailsUpdateRequest {
  token: string;
  email: string;
  nameFirst: string;
  nameLast: string;
}

export interface AdminUserDetailsUpdateV2Request {
  email: string;
  nameFirst: string;
  nameLast: string;
}

export interface AuthResponse {
  token: string;
}

export interface AuthLoginRes {
  email: string;
  password: string;
}

export interface QuizSessionsResponse {
  activeSessions: number[];
  inactiveSessions: number[];
}

export interface QuizSessionStatusResponse {
  state: string;
  atQuestion: number;
  players: string[];
  metadata: Metadata;
}

interface Metadata {
  quizId: number;
  name: string;
  timeCreated: number;
  timeLastEdited: number;
  description: string;
  numQuestions: number;
  questions: QuestionInfo[];
  timeLimit: number;
  thumbnailUrl: string;
}

// interface Question {
//   questionId: number;
//   question: string;
//   timeLimit: number;
//   thumbnailUrl: string;
//   points: number;
//   answerOptions: AnswerOption[];
// }

export interface AnswerOption {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface SessionResultResponse {
  usersRankedByScore: UserRanked[];
  questionResults: QuestionResult[];
}

export interface UserRanked {
  playerName: string;
  score: number;
}

export interface QuestionResult {
  questionId: number;
  playersCorrect: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}
