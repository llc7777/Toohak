/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import request from 'sync-request-curl';
import { port, url } from '../config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let userToken;
let userToken2;
let quizId;
let questionId;

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
  // Create the user Jake Renzella
  const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'jake.renzella@gmail.com',
      password: 'password123',
      nameFirst: 'Jake',
      nameLast: 'Renzella',
    }
  });
  userToken = JSON.parse(userTokenRes.body.toString()).token;

  // Create the user Hayden Smith
  const userTokenRes2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
    json: {
      email: 'hayden.smith@gmail.com',
      password: 'password123',
      nameFirst: 'Hayden',
      nameLast: 'Smith',
    }
  });
  userToken2 = JSON.parse(userTokenRes2.body.toString()).token;

  // Create a quiz. This quiz is called 'Basic quiz'
  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: {
      token: userToken,
      name: 'Basic quiz',
      description: 'Just a normal quiz',
    }
  });
  quizId = JSON.parse(quizRes.body.toString()).quizId;

  // Create a quiz question for the quiz
  const createQuestionRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: {
      token: userToken,
      questionBody: {
        question: 'What is two plus two?',
        timeLimit: 7,
        points: 5,
        answerOptions: [
          {
            answer: 'four',
            correct: true
          },
          {
            answer: 'five',
            correct: false
          }
        ]
      }
    }
  });
  questionId = JSON.parse(createQuestionRes.body.toString()).questionId;

  // Create a second question for the quiz
  request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
    json: {
      token: userToken,
      questionBody: {
        question: 'What is one plus one?',
        timeLimit: 7,
        points: 5,
        answerOptions: [
          {
            answer: 'two',
            correct: true
          },
          {
            answer: '1',
            correct: false
          }
        ]
      }
    }
  });
});

describe('PUT /v1/admin/quiz/:quizid/quesion/:questionid/move ERROR cases', () => {
  test('returns error when trying to move a question to its current position', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: 0,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(400);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question to position -1', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: -1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(400);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question to position outside bounds of array', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: 2,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(400);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question with an invalid questionId', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId + 1}/move`, {
        json: {
          token: userToken,
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(400);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question with an invalid token', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken + 'a',
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(401);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question with an empty token', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: '',
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(401);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question that the user does not own', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken2,
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(403);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question in a quiz that does not exist', () => {
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId + 1}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(403);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error when trying to move a question in a quiz that does not exist', () => {

    const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS,
    });

    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${1}/move`, {
        json: {
          token: userToken,
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(400);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

});

describe('PUT /v1/admin/quiz/:quizid/quesion/{questionid}/move SUCCESS cases', () => {
  test('moves a question in a quiz with two questions', () => {
    const quizInfoBeforeRes = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    }
    );
    const quizInfoBefore = JSON.parse(quizInfoBeforeRes.body.toString());

    // Check the question id before the moving the questions
    expect(quizInfoBefore.questions[0].questionId).toStrictEqual(1);
    expect(quizInfoBefore.questions[1].questionId).toStrictEqual(2);

    // Move the first question to the end of the questions array
    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: 1,
        }
      }
    );

    expect(resultRes.statusCode).toStrictEqual(200);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ });

    const quizInfoAfterRes = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    }
    );
    const quizInfoAfter = JSON.parse(quizInfoAfterRes.body.toString());

    // Check that the questions are actually changed now
    expect(quizInfoAfter.questions[0].questionId).toStrictEqual(2);
    expect(quizInfoAfter.questions[1].questionId).toStrictEqual(1);
  });
  test('time updated for a quiz changes when moving a question', () => {
    const infoBeforeMoving = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });

    // Get the time updated before moving
    const timeUpdatedBeforeMove =
      JSON.parse(infoBeforeMoving.body.toString()).timeLastEdited;

    const resultRes = request('PUT',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
        json: {
          token: userToken,
          newPosition: 1,
        }
      }
    );
    const infoAfterMoving = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });
    // Get the time updated after moving
    const timeUpdatedAfterMove = JSON.parse(infoAfterMoving.body.toString()).timeLastEdited;

    expect(timeUpdatedBeforeMove).toBeGreaterThanOrEqual(timeUpdatedAfterMove);

    expect(resultRes.statusCode).toStrictEqual(200);

    const result = JSON.parse(resultRes.body.toString());
    expect(result).toStrictEqual({ });
  });
});
