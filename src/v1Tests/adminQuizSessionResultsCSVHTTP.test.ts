import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken } from '../helper';
import { ErrorResponse, AuthResponse, QuizID, AnswerOptionsReq } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

let token: string = '';
let nonOwnerToken: string = '';
let quizId: number = 0;
let sessionId: number = 0;

// Function to register a user
const requestAdminAuthRegister = (
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
): { statusCode: number; body: AuthResponse } => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email,
      password,
      nameFirst,
      nameLast,
    },
    timeout: TIMEOUT_MS,
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
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString());
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

// Function to start a quiz session
const startQuizSession = (token: string, quizId: number, autoStartNum: number) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
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

// Function to get session status
const getSessionStatus = (quizId: number, sessionId: number, token: string) => {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString()).state;
};

// Function to get session results
const getSessionResultsCSV = (
  quizId: number, sessionId: number, token: string) => {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/` +
    `${sessionId}/results/csv`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });

  // return {
  //   statusCode: res.statusCode,
  //   body: JSON.parse(res.body.toString()),
  // };
  return res;
};

// Function to submit player's answer
const submitAnswerRequest = (
  token: string, playerId: number, questionPosition: number, answerIds: number[]
) => {
  return request('PUT', `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}/answer`, {
    json: { answerIds },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

// Function to join a player
const createPlayer = (sessionId: number, playerName: string) => {
  const res = request('POST', SERVER_URL + '/v1/player/join', {
    json: { sessionId, playerName },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString()).playerId;
};

const getQuestionResultsRequest = (
  token: string,
  playerId: number,
  questionPosition: number
) => {
  return request(
    'GET',
    `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}/results`,
    {
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
};

beforeEach(() => {
  // Clear the data
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Register an owner
  const resultOwner = requestAdminAuthRegister(
    'owner@gmail.com',
    'password1',
    'Owner',
    'User'
  );
  token = resultOwner.body.token;

  // Register a non-owner
  const resultNonOwner = requestAdminAuthRegister(
    'nonowner@gmail.com',
    'password2',
    'NonOwner',
    'User'
  );
  nonOwnerToken = resultNonOwner.body.token;

  // Create a quiz
  const createQuiz = quizCreate(token, 'Quiz 1', 'Quiz 1 description');
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

  // Start a quiz session
  const startSessionRes = startQuizSession(token, quizId, 2);
  sessionId = JSON.parse(startSessionRes.body.toString()).sessionId;
});

describe('/v1/admin/quiz/:quizId/session/:sessionId/results', () => {
  describe('Successful cases', () => {
    test('Retrieve session results successfully', () => {
      // Add players to the session
      const playerIdOne = createPlayer(sessionId, 'Jake');
      const playerIdTwo = createPlayer(sessionId, 'Hayden');

      getSessionStatus(quizId, sessionId, token);
      updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);
      updateQuizSession('QUESTION_OPEN', sessionId, token, quizId);

      const answerResponse1 = submitAnswerRequest(token, playerIdOne, 1, [1]);
      const answerResponse2 = submitAnswerRequest(token, playerIdTwo, 1, [2]);

      expect(answerResponse1.statusCode).toStrictEqual(200);
      expect(answerResponse2.statusCode).toStrictEqual(200);

      updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

      const questionRes1 = getQuestionResultsRequest(token, playerIdOne, 1);
      const questionRes2 = getQuestionResultsRequest(token, playerIdTwo, 1);

      expect(questionRes1.statusCode).toStrictEqual(200);
      expect(questionRes2.statusCode).toStrictEqual(200);

      updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

      // Get session results
      const res = getSessionResultsCSV(quizId, sessionId, token);

      expect(res.statusCode).toStrictEqual(200);

      expect(JSON.parse(res.body.toString())).toStrictEqual({url: expect.any(String)});
    });
  });

  describe('Error cases', () => {
    test('Invalid token should return 401 error', () => {
      const invalidToken = { sessionId: 1, authUserId: 1531 };
      const encodedInvalid = createToken(invalidToken);

      const res = getSessionResultsCSV(quizId, sessionId, encodedInvalid);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Empty token returns 401', () => {
      const emptyToken = '';
      const res = getSessionResultsCSV(quizId, sessionId, emptyToken);

      expect(res.statusCode).toStrictEqual(401);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('User does not own the quiz', () => {
      const res = getSessionResultsCSV(quizId, sessionId, nonOwnerToken);

      expect(res.statusCode).toStrictEqual(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Quiz does not exist returns 403', () => {
      const invalidQuizId = quizId + 1;
      const res = getSessionResultsCSV(invalidQuizId, sessionId, token);

      expect(res.statusCode).toStrictEqual(403);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Session does not exist returns 400', () => {
      const invalidSessionId = sessionId + 1;
      const res = getSessionResultsCSV(quizId, invalidSessionId, token);

      expect(res.statusCode).toStrictEqual(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });

    test('Session not in FINAL_RESULTS state', () => {
      // Create a new session that hasn't reached FINAL_RESULTS state
      const newSession = startQuizSession(token, quizId, 1);
      const newSessionId = JSON.parse(newSession.body.toString()).sessionId;

      const res = getSessionResultsCSV(quizId, newSessionId, token);

      expect(res.statusCode).toStrictEqual(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });
  });
});
