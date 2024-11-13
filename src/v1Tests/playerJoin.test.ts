import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse, Quiz } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

const playerJoinRequest = (body: { sessionId: number, playerName: string }) => {
  return request('POST', `${SERVER_URL}/v1/player/join`, {
    json: {
      sessionId: body.sessionId,
      playerName: body.playerName
    },
  });
};

let quiz: Quiz;
let token: string;
let sessionId: number;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  const tokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });
  token = JSON.parse(tokenRes.body.toString()).token;

  const quizRes = request('POST', `${SERVER_URL}/v2/admin/quiz`, {
    json: { name: 'quiz1', description: 'random description' },
    headers: { token },
    timeout: TIMEOUT_MS
  });
  quiz = JSON.parse(quizRes.body.toString());

  request('POST', `${SERVER_URL}/v2/admin/quiz/${quiz.quizId}/question`, {
    json: {
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'Whale',
            correct: true
          },
          {
            answer: 'Frog',
            correct: false
          }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      }
    },
    headers: { token }
  });

  const sessionStartRes = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quiz.quizId}/session/start`, {
      json: { autoStartNum: 3 },
      headers: { token },
      timeout: TIMEOUT_MS
    });
  sessionId = JSON.parse(sessionStartRes.body.toString()).sessionId;
});

describe('Test for POST /v1/player/join', () => {
  // successful cases
  test('200: working case', () => {
    const response = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ playerId: expect.any(Number) });
  });

  // multiple players join
  test('200: working case with multiple players joining', () => {
    const response = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({ playerId: expect.any(Number) });

    const response1 = playerJoinRequest({ sessionId: sessionId, playerName: 'Chris P Bacon' });
    expect(response1.statusCode).toBe(200);
    expect(JSON.parse(response1.body.toString())).toStrictEqual({ playerId: expect.any(Number) });

    const response2 = playerJoinRequest({ sessionId: sessionId, playerName: 'yellow' });
    expect(response2.statusCode).toBe(200);
    expect(JSON.parse(response2.body.toString())).toStrictEqual({ playerId: expect.any(Number) });
  });

  // error cases
  test.each([
    '>:)',
    'c:ld',
    'Mew M@w',
  ])('name contains invalid characters. valid characters are alohanumeric and spaces',
    (playerName) => {
      const response = playerJoinRequest({ sessionId: sessionId, playerName: playerName });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
    });

  test('name of user entered is not unique (compared to others who have already join)', () => {
    const response1 = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    expect(response1.statusCode).toBe(200);
    expect(JSON.parse(response1.body.toString())).toStrictEqual({ playerId: expect.any(Number) });

    const response2 = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    expect(response2.statusCode).toBe(400);
    expect(JSON.parse(response2.body.toString())).toStrictEqual(ERROR);
  });

  test('session id does not refer to a valid session', () => {
    const response = playerJoinRequest({ sessionId: sessionId + 1, playerName: 'Hayden Smith' });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('session is not in lobby state', () => {
    const updateStateRequest = (quizid: number,
      sessionid: number,
      token: string,
      body: { action: string }
    ) => {
      return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizid}/session/${sessionid}`, {
        json: { action: 'NEXT_QUESTION' },
        headers: { token },
        timeout: TIMEOUT_MS
      });
    };
    const updateRes = updateStateRequest(quiz.quizId,
      sessionId,
      token,
      { action: 'NEXT_QUESTION' }
    );
    expect(updateRes.statusCode).toBe(200);
    expect(JSON.parse(updateRes.body.toString())).toStrictEqual({});

    const response = playerJoinRequest({ sessionId: sessionId, playerName: 'Hayden Smith' });
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });
});
