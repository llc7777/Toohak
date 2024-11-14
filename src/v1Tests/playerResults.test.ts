import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse, Quiz } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

const playerResultsRequest = (playerid: number) => {
  return request('GET', `${SERVER_URL}/v1/player/${playerid}/results`, {});
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

  const playerJoinRes = request('POST', `${SERVER_URL}/v1/player/join`, {
    json: {
      sessionId: sessionId,
      playerName: 'Hayden Smith'
    },
  });
  playerId = JSON.parse(playerJoinRes.body.toString());

  request('PUT', `${SERVER_URL}/v1/admin/quiz/${quiz.quizId}/session/${sessionId}`, {
    json: { action: 'GO_TO_FINAL_RESULTS' },
    headers: { token },
    timeout: TIMEOUT_MS
  });
});

describe('Test for POST /v1/player/{playerid}', () => {
  // successful cases
  test('player successfully status given', () => {
    const response = playerResultsRequest(playerId);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({
      usersRankedByScore: [
        {
          playerName: expect.any(String),
          score: expect.any(Number),
        }
      ],
      questionResults: [
        {
          questionId: expect.any(Number),
          playersCorrect: [
            expect.any(Number),
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: expect.any(Number), 
        }
      ]
    });
  });

  // error cases
  test('playerid does not exist', () => {
    const response = playerResultsRequest(playerId + 1);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });

  test('session is not in final_results state', () => {
    const updateStateRequest = (quizid: number,
      sessionid: number,
      token: string,
      body: { action: string }
    ) => {
      return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizid}/session/${sessionid}`, {
        json: { action: 'END' },
        headers: { token },
        timeout: TIMEOUT_MS
      });
    };
    const updateRes = updateStateRequest(quiz.quizId,
      sessionId,
      token,
      { action: 'END' }
    );
    expect(updateRes.statusCode).toBe(200);
    expect(JSON.parse(updateRes.body.toString())).toStrictEqual({});

    const response = playerResultsRequest(playerId);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
  });
});
