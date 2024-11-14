import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

const submitAnswerRequest =
(token: string, playerId: number, questionPosition: number, answerIds: number[]) => {
  return request('PUT', `${SERVER_URL}/v1/player/${playerId}/question/${questionPosition}/answer`, {
    json: { answerIds },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

let token: string;
let quizId: number;
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
    json: { name: 'Test Quiz', description: 'Sample Description' },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  const questionRes = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    json: {
      questionBody: {
        question: 'What is 2+2?',
        timeLimit: 10,
        points: 5,
        answerOptions: [
          { answer: '3', correct: false },
          { answer: '4', correct: true },
        ],
        thumbnailUrl: 'http://example.com/image.jpg',
      },
    },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  JSON.parse(questionRes.body.toString());

  const questionRes2 = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    json: {
      questionBody: {
        question: 'What is 2-2?',
        timeLimit: 10,
        points: 5,
        answerOptions: [
          { answer: '1', correct: false },
          { answer: '0', correct: true },
        ],
        thumbnailUrl: 'http://example.com/image.jpg',
      },
    },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  JSON.parse(questionRes2.body.toString());

  const sessionStartRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    json: { autoStartNum: 3 },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  sessionId = JSON.parse(sessionStartRes.body.toString()).sessionId;

  const joinRes = request('POST', SERVER_URL + '/v1/player/join', {
    json: { sessionId, playerName: 'TestPlayer' },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  playerId = JSON.parse(joinRes.body.toString()).playerId;

  request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    json: { action: 'NEXT_QUESTION' },
    timeout: TIMEOUT_MS,
  });

  request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    json: { action: 'SKIP_COUNTDOWN' },
    timeout: TIMEOUT_MS,
  });
});

describe('Test for PUT /v1/player/:playerId/question/:questionPosition/answer', () => {
  test('200: successfully submit a correct answer', () => {
    const response = submitAnswerRequest(token, playerId, 1, [2]);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({});
  });

  test('200: successfully re-submit a correct answer', () => {
    const response = submitAnswerRequest(token, playerId, 1, [2]);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({});
    const response2 = submitAnswerRequest(token, playerId, 1, [1]);
    expect(response2.statusCode).toBe(200);
    expect(JSON.parse(response2.body.toString())).toStrictEqual({});
  });

  test('400: invalid playerId provided', () => {
    const response = submitAnswerRequest(token, playerId + 999, 1, [2]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: invalid questionPosition provided (out of range)', () => {
    const response = submitAnswerRequest(token, playerId, 999, [2]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: current question is not on given question', () => {
    const response = submitAnswerRequest(token, playerId, 2, [2]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: duplicate answer IDs provided', () => {
    const response = submitAnswerRequest(token, playerId, 1, [2, 2]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: invalid answer IDs provided', () => {
    const response = submitAnswerRequest(token, playerId, 1, [-1, 13]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: no answer IDs provided', () => {
    const response = submitAnswerRequest(token, playerId, 1, []);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: session not in QUESTION_OPEN state', () => {
    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'END' },
      timeout: TIMEOUT_MS,
    });

    const response = submitAnswerRequest(token, playerId, 1, [2]);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });
});
