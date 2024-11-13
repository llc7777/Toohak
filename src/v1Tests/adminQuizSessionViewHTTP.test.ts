import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import {
  ErrorResponse,
  AuthResponse,
  QuizID,
  AnswerOptionsReq
} from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

let token: string = '';
let nonOwnerToken: string = '';
let quizId: number = 0;
let sessionId1: number = 0;
let sessionId2: number = 0;

// function to register a user
const requestAdminAuthRegister = (
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { statusCode: number; body: AuthResponse } => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: email,
      password: password,
      nameFirst: nameFirst,
      nameLast: nameLast,
    },
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Function to create a quiz
const quizCreate = (
  token: string,
  name: string,
  description: string
): QuizID => {
  const res = request('POST', SERVER_URL + '/v2/admin/quiz', {
    headers: { token },
    json: { name, description },
    timeout: TIMEOUT_MS
  });
  return JSON.parse(res.body.toString());
};

// function to start a quiz session
const startQuizSession = (quizId: number, autoStartNum: number) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
    timeout: TIMEOUT_MS,
  });
};

// function to get quiz sessions
const getQuizSessions = (token: string, quizId: number) => {
  return request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/sessions`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

// Function to update the session state
const updateQuizSession = (action: string, sessionId: number, token: string, quizId: number) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    json: { action },
    timeout: TIMEOUT_MS,
  });
};

// Function to create a question
const requestAdminQuestionCreate = (quizId: number, token: string,
  body: {
  questionBody: {
    question: string,
    timeLimit: number,
    points: number,
    answerOptions: AnswerOptionsReq[],
    thumbnailUrl: string
  }
}) => {
  return request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    json: {
      questionBody: {
        question: body.questionBody.question,
        timeLimit: body.questionBody.timeLimit,
        points: body.questionBody.points,
        answerOptions: body.questionBody.answerOptions,
        thumbnailUrl: body.questionBody.thumbnailUrl
      }
    },
    headers: { token }
  });
};

beforeEach(() => {
  // Clear the data
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Register a user
  const resultOwner = requestAdminAuthRegister('hayden.smith@unsw.edu.au',
    'password1', 'Hayden', 'Smith');

  // token = JSON.parse(result.body.toString()).token;
  token = resultOwner.body.token;

  const resultNonOwner = requestAdminAuthRegister('john.doe@unsw.edu.au',
    'password2', 'John', 'Doe');
  nonOwnerToken = resultNonOwner.body.token;

  // Create a quiz
  const createQuiz = quizCreate(token, 'quiz 1', 'description for quiz 1');
  quizId = createQuiz.quizId;

  // Create a question
  requestAdminQuestionCreate(quizId, token, {
    questionBody: {
      question: 'What is two plus two?',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answer: 'Four',
          correct: true
        },
        {
          answer: 'Five',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    }
  });

  // Create active sessions
  const activeSessions = startQuizSession(quizId, 2);
  sessionId1 = JSON.parse(activeSessions.body.toString()).sessionId;

  // Create active sessions
  const inactiveSessions = startQuizSession(quizId, 2);
  sessionId2 = JSON.parse(inactiveSessions.body.toString()).sessionId;
});

describe('/v1/admin/quiz/{quizId}/sessions', () => {
  describe('Successful cases', () => {
    test('Retrieve active and inactive sessions for a quiz', () => {
      getQuizSessions(token, quizId);
      updateQuizSession('END', sessionId2, token, quizId);

      const res = getQuizSessions(token, quizId);
      const body = JSON.parse(res.body.toString());

      expect(body.activeSessions).toContain(sessionId1);
      expect(body.inactiveSessions).toContain(sessionId2);
    });
  });

  describe('Error cases', () => {
    test('Invalid token should return 401 error', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = createToken(invalidToken);

      const res = getQuizSessions(encodedInvalid, quizId);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('returns error for empty token', () => {
      const emptyToken = '';
      const res = getQuizSessions(emptyToken, quizId);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Quiz does not exist', () => {
      const invalidQuizId = quizId + 1;
      const res = getQuizSessions(token, invalidQuizId);

      expect(res.statusCode).toStrictEqual(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('user is not the owner of this quiz', () => {
      const res = getQuizSessions(nonOwnerToken, quizId);

      expect(res.statusCode).toStrictEqual(403);
      const body = JSON.parse(res.body.toString());
      expect(body).toEqual(ERROR);
    });
  });
});
