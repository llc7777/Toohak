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

export interface QuizInfo {
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numOfQuestions: number,
  questions: QuestionInfo[],
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

export interface AnswerOptions {
  answerId: number;
  answer: string;
  colour: string;
  correct: boolean;
}

export interface QuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
  thumbnailUrl: string;
  points: number;
  answerOptions: AnswerOptions[];
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