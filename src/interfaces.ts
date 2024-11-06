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
  token: Token[];
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
}

export interface AnswerOptions {
  answerId: number;
  answer: string;
  colour: string;
  correctAnswer: boolean;
}

export interface QuestionInfo {
  questionId: number;
  question: string;
  timeLimit: number;
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
  trash: Trash[];
}

export interface ErrorResponse {
  error: string;
}

export interface QuestionIdObject {
  questionId: number;
}
