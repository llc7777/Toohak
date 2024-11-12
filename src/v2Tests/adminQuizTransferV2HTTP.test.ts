
import request from 'sync-request-curl';
import { port, url } from '../config.json';
import { AnswerOptionsReq } from '../interfaces';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

let userToken: string;
let userToken2: string;
let quizId: number;
let emailToTransferTo: string;

function adminAuthRegisterWrapper(
    email: string,
    password: string,
    nameFirst: string,
    nameLast: string
  ): string {
    const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email,
        password,
        nameFirst,
        nameLast,
      }
    });
    return JSON.parse(userTokenRes.body.toString()).token;
}

function adminQuizCreateWrapper(
    token: string,
    name: string,
    description: string
  ) {
    const quizRes = request('POST', SERVER_URL + '/v2/admin/quiz', {
      json: {
        name,
        description,
      },
      headers: { token },
    });
    return JSON.parse(quizRes.body.toString()).quizId;
  }
  
function adminQuizQuestionCreateWrapper(
    token: string,
    quizId: number,
    questionBody: {
      question: string,
      timeLimit: number,
      points: number,
      answerOptions: AnswerOptionsReq[]
      thumbnailUrl: string,
    }
  ) {
    request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/question`, {
      json: { questionBody },
      headers: { token },
    });
  }
  
  function sessionCreateWrapper(
    token: string,
    quizId: number,
    autoStartNum: number
  ) {
    request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/session/start`, {
      json: {
        autoStartNum,
      },
      headers: { token },
    });
  }
    

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });

  // Create a user. This user is Jake Renzella
  userToken = adminAuthRegisterWrapper(
    'jake.renzella@gmail.com', 'password123', 'Jake', 'Renzella',
  )

  // Create a quiz. This quiz is called 'Basic quiz'
  quizId = adminQuizCreateWrapper(userToken,
    'Basic quiz', 'Just a normal quiz'
  )

  userToken2 = adminAuthRegisterWrapper(
    'hayden.smith@gmail.com', 'password123', 'Hayden', 'Smith',
  )
  emailToTransferTo = 'hayden.smith@gmail.com';
});

describe('POST /v2/admin/quiz/:quizid/transfer ERROR cases', () => {
  test('returns an error when trying to transfer a quiz ' +
    'to an email that does not correspond to any user', () => {
    const nonExistentEmail = 'idontexist@gmail.com';

    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: nonExistentEmail,
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('returns an error when trying to transfer a quiz when the logged in user' +
    ' does not own the quiz', () => {
    // Create a user Andrew Taylor. Note, that Andrew owns NO quizzes
    const userToken3 = adminAuthRegisterWrapper(
      'andrew.taylor@gmail.com', 'password123', 'Andrew', 'Talyor'
    )
    expect(userToken3).toStrictEqual(expect.any(String));

    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken2,
        userEmail: 'andrew.taylor@gmail.com',
      },
      headers: { token: userToken2 },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(403);
  }
  );

  test('returns an error when trying to transfer a quiz that does not exist', () => {
    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId + 1}/transfer`, {
      json: {
        userEmail: 'hayden.smith@gmail.com',
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(403);
  }
  );

  test('returns an error when trying to transer a quiz to the currently logged in user', () => {
    const result = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/transfer`, {
      json: {
        token: userToken,
        userEmail: 'jake.renzella@gmail.com',
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('reutrns an error when trying to transfer quiz to another user who already' +
    ' owns a quiz with the given quiz name', () => {
    // Create a quiz that is owned by Hayden Smith
    const quizId2 = adminQuizCreateWrapper(
      userToken2, 'Basic quiz', 'An even more normal quiz',
    )
    expect(quizId2).toStrictEqual(expect.any(Number));

    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo,
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(400);
  });

  test('returns error when trying to transfer a quiz with invalid token', () => {
    const invalidUserToken = userToken + 'a';
    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo
      },
      headers: { invalidUserToken },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to transfer a quiz with empty user token', () => {
    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo
      },
      headers: { token: ''},
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to delete a quiz that has a session not in end state', () => {

    adminQuizQuestionCreateWrapper(userToken, quizId, {
      question: 'What is two plus two',
      timeLimit: 5,
      points: 5,
      answerOptions: [
        {
          answer: 'Four',
          correct: true,
        },
        {
          answer: 'Five',
          correct: false,
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    });
    sessionCreateWrapper(userToken, quizId, 3);

    const resultRes = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });
    const resultBody = JSON.parse(resultRes.body.toString());
    expect(resultRes.statusCode).toStrictEqual(400);
    expect(resultBody).toStrictEqual({ error: expect.any(String) });
  });
});

describe('POST /v1/admin/quiz/:quizid/transfer SUCCESS cases', () => {
  test('successfully transfers a single quiz to a user', () => {
    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    const quizListRes = request('GET', SERVER_URL + '/v2/admin/quiz/list', {
      headers: { token: userToken2 },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        }
      ]
    });
  });

  test('successfully transfers multiples quizzes to a user', () => {
    const result = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId}/transfer`, {
      json: {
        userEmail: emailToTransferTo
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });

    expect(result.statusCode).toStrictEqual(200);
    expect(JSON.parse(result.body.toString())).toStrictEqual({ });

    // List the quizzes that Hayden Smith owns after transferring to him
    let quizListRes = request('GET', SERVER_URL + '/v2/admin/quiz/list', {
      headers: { token: userToken2 },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        }
      ]
    });

    // Create a second quiz
    const quizId2 = adminQuizCreateWrapper(
      userToken,
      'A difficult quiz',
      'A very challenging quiz',
    )

    // Transfer the second quiz to Hayden Smith
    const result2 = request('POST', SERVER_URL + `/v2/admin/quiz/${quizId2}/transfer`, {
      json: {
        userEmail: emailToTransferTo,
      },
      headers: { token: userToken },
      timeout: TIMEOUT_MS
    });

    expect(result2.statusCode).toStrictEqual(200);
    expect(JSON.parse(result2.body.toString())).toStrictEqual({ });

    expect(JSON.parse(result.body.toString())).toStrictEqual({ });
    expect(result.statusCode).toStrictEqual(200);

    // List all the quizzes that Hayden Smith now owns
    quizListRes = request('GET', SERVER_URL + '/v2/admin/quiz/list', {
      headers: { token: userToken2 },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(quizListRes.body.toString())).toStrictEqual({
      quizzes: [
        {
          quizId: expect.any(Number),
          name: 'Basic quiz'
        },
        {
          quizId: expect.any(Number),
          name: 'A difficult quiz',
        }
      ]
    });
  });
});
