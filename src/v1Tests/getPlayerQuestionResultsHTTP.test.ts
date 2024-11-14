import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

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

let token: string;
let quizId: number;
let sessionId: number;
let playerId: number;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });

  const tokenRes = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
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

  request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
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

  const sessionStartRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    json: { autoStartNum: 3 },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  sessionId = JSON.parse(sessionStartRes.body.toString()).sessionId;

  const joinRes = request('POST', `${SERVER_URL}/v1/player/join`, {
    json: { sessionId, playerName: 'TestPlayer' },
    headers: { token },
    timeout: TIMEOUT_MS,
  });
  playerId = JSON.parse(joinRes.body.toString()).playerId;
});

describe('Test for GET /v1/player/:playerId/question/:questionPosition/results', () => {
  test('200: successfully retrieve question results', () => {
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

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS,
    });    

    const questionPosition = 1;
    const response = getQuestionResultsRequest(token, playerId, questionPosition);

    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body.toString());
    expect(responseBody).toMatchObject({
      questionId: expect.any(Number),
      playersCorrect: expect.any(Array),
      averageAnswerTime: expect.any(Number),
      percentCorrect: expect.any(Number),
    });
  });

  test('400: invalid playerId provided', () => {
    const response = getQuestionResultsRequest(token, playerId + 999, 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: invalid questionPosition provided (out of range)', () => {
    const response = getQuestionResultsRequest(token, playerId, 999);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: session not in ANSWER_SHOW state', () => {
    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'END' },
      timeout: TIMEOUT_MS,
    });

    const response = getQuestionResultsRequest(token, playerId, 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: no questions in quiz', () => {
    const emptyQuizId = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
      json: { name: 'Empty Quiz', description: 'No Questions' },
      headers: { token },
      timeout: TIMEOUT_MS,
    });
    const response = getQuestionResultsRequest(token, playerId, 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('400: mismatched player ID and session', () => {
    const newSessionId = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
      json: { autoStartNum: 5 },
      headers: { token },
      timeout: TIMEOUT_MS,
    });
    const newPlayerRes = request('POST', `${SERVER_URL}/v1/player/join`, {
      json: { sessionId: newSessionId, playerName: 'AnotherPlayer' },
      headers: { token },
      timeout: TIMEOUT_MS,
    });
    const newPlayerId = JSON.parse(newPlayerRes.body.toString()).playerId;
    const response = getQuestionResultsRequest(token, newPlayerId, 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });  

  test('400: session not currently on the requested question', () => {
    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
      headers: { token },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS,
    });

    const response = getQuestionResultsRequest(token, playerId, 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });
});