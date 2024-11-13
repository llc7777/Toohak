import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { createToken, sleep } from '../helper';
import { ErrorResponse, Token } from '../interfaces';

const SERVER_URL: string = `${url}:${port}`;
const TIMEOUT_MS: number = 5 * 1000;

// Error object
const ERROR: ErrorResponse = { error: expect.any(String) };

// parameters for test functions
let token: string = '';
let quizId: number = 0;
let sessionId: number = 0;

// function to start a quiz session
const startQuizSession = (quizId: number, autoStartNum: number) => {
  return request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/start`, {
    headers: { token },
    json: { autoStartNum },
    timeout: TIMEOUT_MS,
  });
};

// function to update a quiz session
const updateQuizSession = (action: string, sessionId: number, token: string, quizId: number) => {
  return request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    json: { action },
    timeout: TIMEOUT_MS,
  });
};

// function to get the status of a quiz session
const getQuizSessionStatus = () => {
  return request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}`, {
    headers: { token },
    timeout: TIMEOUT_MS,
  });
};

// clear the database before each test and set parameters for session start
beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // register a user
  const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'Aerospace@gmail.com',
      password: 'Aeropass1',
      nameFirst: 'Leo',
      nameLast: 'Kim'
    },
    timeout: TIMEOUT_MS
  });

  token = JSON.parse(res.body.toString()).token;

  // create a quiz
  const res2 = request('POST', SERVER_URL + '/v2/admin/quiz', {
    headers: { token },
    json: { name: 'quiz1', description: 'description' },
    timeout: TIMEOUT_MS
  });

  quizId = JSON.parse(res2.body.toString()).quizId;

  // create a quiz question
  request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
    headers: { token },
    json: {
      questionBody: {
        question: 'What is the largest mammal in the world?',
        timeLimit: 1,
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
    timeout: TIMEOUT_MS
  });

  const res4 = startQuizSession(quizId, 2);

  sessionId = JSON.parse(res4.body.toString()).sessionId;
});

// Set timeout for jest
jest.setTimeout(60000);

describe('Test for PUT /v1/admin/quiz/{quizid}/session/{sessionid}', () => {
  // successful cases
  test('Update a LOBBY with NEXT_QUESTION', async () => {
    const res = updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);
    expect(res.statusCode).toStrictEqual(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});

    const res2 = getQuizSessionStatus();
    // get the duration of the question
    const duration = JSON.parse(res2.body.toString()).metadata.questions[0].timeLimit;

    // check if the state is changed to QUESTION_COUNTDOWN
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('QUESTION_COUNTDOWN');

    // wait for the 3 seconds to question open
    await sleep(3000);

    // check if the state is changed to QUESTION_OPEN
    const res3 = getQuizSessionStatus();
    expect(JSON.parse(res3.body.toString()).state).toStrictEqual('QUESTION_OPEN');

    // wait for the duration of the question to question close
    await sleep(duration * 1000);

    // check if the state is changed to QUESTION_CLOSED
    const res4 = getQuizSessionStatus();
    expect(JSON.parse(res4.body.toString()).state).toStrictEqual('QUESTION_CLOSE');
  });

  test('Update a LOBBY with END', async () => {
    updateQuizSession('END', sessionId, token, quizId);

    // check if the state is changed to ENDED
    const res = getQuizSessionStatus();
    expect(JSON.parse(res.body.toString()).state).toStrictEqual('END');
  });

  test('Update a QUESTION_COUNTDOWN with SKIP_COUNTDOWN', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('QUESTION_OPEN');

    await sleep(duration * 1000);

    const res2 = getQuizSessionStatus();
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('QUESTION_CLOSE');
  });

  test('Update a QUESTION_COUNTDOWN with END', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('END', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('END');
  });

  test('Update a QUESTION_OPEN with END', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    // in QUESTION_OPEN state

    updateQuizSession('END', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('END');
  });

  test('Update a QUESTION_OPEN with GO_TO_ANSWER', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    // in QUESTION_OPEN state

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('ANSWER_SHOW');
  });

  test('Update a ANSWER_SHOW with NEXT_QUESTION', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    // in ANSWER_SHOW state

    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('QUESTION_COUNTDOWN');

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res2 = getQuizSessionStatus();
    const duration = JSON.parse(res2.body.toString()).metadata.questions[0].timeLimit;

    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('QUESTION_OPEN');

    await sleep(duration * 1000);

    const res3 = getQuizSessionStatus();
    expect(JSON.parse(res3.body.toString()).state).toStrictEqual('QUESTION_CLOSE');
  });

  test('Update a ANSWER_SHOW with GO_TO_FINAL_RESULTS', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    // in ANSWER_SHOW state

    updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('FINAL_RESULTS');
  });

  test('Update a ANSWER_SHOW with END', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    // in ANSWER_SHOW state

    updateQuizSession('END', sessionId, token, quizId);

    const res = getQuizSessionStatus();

    expect(JSON.parse(res.body.toString()).state).toStrictEqual('END');
  });

  test('Update a QUESTION_CLOSE with NEXT_QUESTION', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    await sleep(duration * 1000);

    // Check if the state is changed to QUESTION_CLOSE
    const res2 = getQuizSessionStatus();
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('QUESTION_CLOSE');

    // in QUESTION_CLOSE state
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    const res3 = getQuizSessionStatus();
    expect(JSON.parse(res3.body.toString()).state).toStrictEqual('QUESTION_COUNTDOWN');

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res4 = getQuizSessionStatus();
    expect(JSON.parse(res4.body.toString()).state).toStrictEqual('QUESTION_OPEN');

    await sleep(duration * 1000);

    const res5 = getQuizSessionStatus();
    expect(JSON.parse(res5.body.toString()).state).toStrictEqual('QUESTION_CLOSE');
  });

  test('Update a QUESTION_CLOSE with END', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    await sleep(duration * 1000);

    // in QUESTION_CLOSE state
    updateQuizSession('END', sessionId, token, quizId);

    const res2 = getQuizSessionStatus();
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('END');
  });

  test('Update a QUESTION_CLOSE with GO_TO_FINAL_RESULTS', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    await sleep(duration * 1000);

    // in QUESTION_CLOSE state
    updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

    const res2 = getQuizSessionStatus();
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('FINAL_RESULTS');
  });

  test('Update a QUESTION_CLOSE with GO_TO_ANSWER', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    await sleep(duration * 1000);

    // in QUESTION_CLOSE state
    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    const res2 = getQuizSessionStatus();
    expect(JSON.parse(res2.body.toString()).state).toStrictEqual('ANSWER_SHOW');
  });

  test('Update a FINAL_RESULTS with END', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

    // in FINAL_RESULTS state
    updateQuizSession('END', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    expect(JSON.parse(res.body.toString()).state).toStrictEqual('END');
  });

  // error cases

  // 400 errors
  test('Test for invalid session id', () => {
    const invalidSessionId: number = 100;

    const res = updateQuizSession('NEXT_QUESTION', invalidSessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid action', () => {
    const res = updateQuizSession('INVALID_ACTION', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for LOBBY invalid action', () => {
    const res = updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for QUESTION_COUNTDOWN invalid action', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    const res = updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for QUESTION_OPEN invalid action', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for QUESTION_CLOSE invalid action', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    const res = getQuizSessionStatus();
    const duration = JSON.parse(res.body.toString()).metadata.questions[0].timeLimit;

    await sleep(duration * 1000);

    // in QUESTION_CLOSE state

    const res2 = updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    expect(res2.statusCode).toStrictEqual(400);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for ANSWER_SHOW invalid action', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    // in ANSWER_SHOW state

    const res = updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for FINAL_RESULTS invalid action', async () => {
    updateQuizSession('NEXT_QUESTION', sessionId, token, quizId);

    updateQuizSession('SKIP_COUNTDOWN', sessionId, token, quizId);

    updateQuizSession('GO_TO_ANSWER', sessionId, token, quizId);

    updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

    // in FINAL_RESULTS state

    const res = updateQuizSession('GO_TO_FINAL_RESULTS', sessionId, token, quizId);

    expect(res.statusCode).toStrictEqual(400);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 401 errors
  test('Test for empty token', () => {
    const emptyToken: string = '';

    const res = updateQuizSession('NEXT_QUESTION', sessionId, emptyToken, quizId);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  test('Test for invalid token', () => {
    const invalidToken: Token = { sessionId: 1, authUserId: 1531 };
    const encodedInvalid: string = createToken(invalidToken);

    const res = updateQuizSession('NEXT_QUESTION', sessionId, encodedInvalid, quizId);

    expect(res.statusCode).toStrictEqual(401);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });

  // 403 errors
  test('User does not own the quiz', () => {
    // register a user
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'Aerospace2@gmail.com',
        password: 'Aeropass2',
        nameFirst: 'Jin',
        nameLast: 'Kim',
      },
      timeout: TIMEOUT_MS
    });

    const token2: string = JSON.parse(res.body.toString()).token;

    const res2 = updateQuizSession('NEXT_QUESTION', sessionId, token2, quizId);

    expect(res2.statusCode).toStrictEqual(403);
    expect(JSON.parse(res2.body.toString())).toStrictEqual(ERROR);
  });

  test('Quiz does not exist', () => {
    const wrongQuizId: number = 1531;

    const res = updateQuizSession('NEXT_QUESTION', sessionId, token, wrongQuizId);

    expect(res.statusCode).toStrictEqual(403);
    expect(JSON.parse(res.body.toString())).toStrictEqual(ERROR);
  });
});
