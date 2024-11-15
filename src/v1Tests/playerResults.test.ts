import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { ErrorResponse, AuthResponse, QuizID, AnswerOptionsReq } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

const ERROR: ErrorResponse = { error: expect.any(String) };

let token: string = '';
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
const playerResultsRequest = (playerid: number) => {
  return request('GET', `${SERVER_URL}/v1/player/${playerid}/results`, {});
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

describe('/v1/playerid/:playerid/results', () => {
  describe('Successful cases', () => {
    test('Retrieve session results successfully', () => {
      // Add players to the session
      const playerIdOne = createPlayer(sessionId, 'Bahar');
      const playerIdTwo = createPlayer(sessionId, 'Liam');

      getSessionStatus(quizId, sessionId, token);
      updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);
      updateQuizSession('QUESTION_OPEN', sessionId, token, quizId);

      const answerResponse1 = submitAnswerRequest(token, playerIdOne, 1, [1]);
      const answerResponse2 = submitAnswerRequest(token, playerIdTwo, 1, [2]);

      expect(answerResponse1.statusCode).toBe(200);
      expect(answerResponse2.statusCode).toBe(200);

      updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

      const questionRes1 = getQuestionResultsRequest(token, playerIdOne, 1);
      const questionRes2 = getQuestionResultsRequest(token, playerIdTwo, 1);
      expect(questionRes1.statusCode).toBe(200);
      expect(questionRes2.statusCode).toBe(200);

      updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

      // Get session results
      const res = playerResultsRequest(playerIdOne);
      expect(res.statusCode).toBe(200);

      expect(JSON.parse(res.body.toString()).usersRankedByScore).toEqual([
        { playerName: expect.any(String), score: expect.any(Number) },
        { playerName: expect.any(String), score: expect.any(Number) },
      ]);
      expect(JSON.parse(res.body.toString()).questionResults).toEqual([
        {
          questionId: expect.any(Number),
          playersCorrect: expect.any(Array),
          averageAnswerTime: expect.any(Number),
          percentCorrect: expect.any(Number),
        },
      ]);
      const playersCorrect = JSON.parse(res.body.toString()).questionResults[0].playersCorrect;
      expect(playersCorrect).toEqual(playersCorrect.sort());
    });
  });

  describe('Error cases', () => {
    test('playerid does not exist', () => {
      const response = playerResultsRequest(5);
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body.toString())).toStrictEqual(ERROR);
    });

    test('Session not in FINAL_RESULTS state', () => {
      // Create a new session that hasn't reached FINAL_RESULTS state
      const playerId = createPlayer(sessionId, 'Bahar');

      const res = playerResultsRequest(playerId);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
    });
  });
});
