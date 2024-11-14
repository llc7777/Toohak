import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse, Quiz } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

const getPlayerQuestionRequest = (token: string, playerId: number, questionPosition: number) => {
  return request('GET', `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

let quiz: Quiz;
let token: string;
let sessionId: number;
let playerId: number;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const tokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim',
    },
    timeout: TIMEOUT_MS,
  });
  token = JSON.parse(tokenRes.body.toString()).token;

  const quizRes = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
    json: { name: 'quiz1', description: 'random description' },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  quiz = JSON.parse(quizRes.body.toString());

  const questionRes = request('POST', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question`, {
    json: {
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'Whale',
            correct: true,
          },
          {
            answer: 'Frog',
            correct: false,
          },
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg',
      },
    },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  JSON.parse(questionRes.body.toString()); // We still parse the response but don't store questionId

  const sessionStartRes = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/session/start`,
    {
      json: { autoStartNum: 3 },
      headers: { token },
      timeout: TIMEOUT_MS,
    }
  );
  sessionId = JSON.parse(sessionStartRes.body.toString()).sessionId;

  const joinRes = request('POST', SERVER_URL + '/v1/player/join', {
    json: { sessionId, playerName: 'TestPlayer' },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  playerId = JSON.parse(joinRes.body.toString()).playerId;
});

describe('Test for GET /v1/player/:playerId/question/:questionPosition', () => {
  test('200: successfully fetch player question', () => {
    request(
      'POST',
        `${SERVER_URL}/v1/admin/session/${sessionId}/start-questions`,
        { headers: { token }, timeout: TIMEOUT_MS }
    );

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS,
    });

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS,
    });

    const questionPosition = 1;
    const response = getPlayerQuestionRequest(token, playerId, questionPosition);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({
      questionId: expect.any(Number),
      question: expect.any(String),
      timeLimit: expect.any(Number),
      thumbnailUrl: expect.any(String),
      points: expect.any(Number),
      answerOptions: expect.any(Array),
    });
  });
});

test('400: invalid token provided', () => {
  const questionPosition = 1;
  const response = getPlayerQuestionRequest('invalid-token', playerId, questionPosition);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: invalid playerId provided', () => {
  const questionPosition = 1;
  const response = getPlayerQuestionRequest(token, playerId + 999, questionPosition);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: invalid questionPosition provided (out of range)', () => {
  const invalidQuestionPosition = 999;
  const response = getPlayerQuestionRequest(token, playerId, invalidQuestionPosition);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: session not in a valid state', () => {
  const response = getPlayerQuestionRequest(token, playerId, 1);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: session is on a different question than requested', () => {
  request(
    'POST',
        `${SERVER_URL}/v1/admin/session/${sessionId}/start-questions`,
        { headers: { token }, timeout: TIMEOUT_MS }
  );

  const invalidQuestionPosition = 2;
  const response = getPlayerQuestionRequest(token, playerId, invalidQuestionPosition);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: question does not exist', () => {
  const invalidQuestionPosition = -1;
  const response = getPlayerQuestionRequest(token, playerId, invalidQuestionPosition);
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});

test('400: questionPosition is not a number', () => {
  const invalidQuestionPosition = 'invalid';
  const response = getPlayerQuestionRequest(token, playerId, parseInt(invalidQuestionPosition));
  expect(response.statusCode).toBe(400);
  expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
});
