
import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// WRAPPER FUNCTIONS BELOW
function adminAuthRegisterWrapper(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
) {
const userTokenRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
  json: {
    email,
    password,
    nameFirst,
    nameLast,
  }
});
const userToken = JSON.parse(userTokenRes.body.toString()).token;
return userToken;
}

function adminQuizCreateWrapper(
  token: string,
  name: string,
  description: string,
) {

  const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
    json: {
      token,
      name,
      description,
    }
  });
  const quiz = JSON.parse(quizRes.body.toString());
  return quiz.quizId;
}

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: TIMEOUT_MS });
});

describe('GET /v1/admin/quiz/:quizId', () => {

  test('returns error when trying to delete quiz with invalid token', () => {

    const userToken = adminAuthRegisterWrapper('jake.renzella@gmail.com','password123','Jake',
      'Renzella' 
    );

    const quizId = adminQuizCreateWrapper(userToken, 'Basic quiz', 'Just a normal quiz');
    
    const invalidUserToken = userToken + 'a';

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: invalidUserToken },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });

    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to delete quiz with empty user token', () => {

    const userToken = adminAuthRegisterWrapper('jake.renzella@gmail.com','password123','Jake',
      'Renzella' 
    );

    const quizId = adminQuizCreateWrapper(userToken, 'Basic quiz', 'Just a normal quiz');

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: '' },
      timeout: TIMEOUT_MS
    });
  
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });

    expect(result.statusCode).toStrictEqual(401);
  });

  test('returns error when trying to get info of a quiz that does not exist', () => {
 
    const userToken = adminAuthRegisterWrapper('jake.renzella@gmail.com','password123','Jake',
      'Renzella' 
    );
    const quizId = adminQuizCreateWrapper(userToken, 'Basic quiz', 'Just a normal quiz');

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId + 1}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });

    expect(result.statusCode).toStrictEqual(403);
  });

  test('returns error when trying to get info of a quiz that does not belong to user', () => {

    const userToken1 = adminAuthRegisterWrapper('jake.renzella@gmail.com', 'password123','Jake',
      'Renzella' 
    );
    const quizId1 = adminQuizCreateWrapper(userToken1, 'Basic quiz', 'Just a normal quiz');

    const userToken2 = adminAuthRegisterWrapper('hayden.smith@gmail.com', 'password123', 'Hayden',
      'Smith' 
    );
    const quizId2 = adminQuizCreateWrapper(userToken2, 'Good quiz', 'Just a good quiz');
    
    expect(quizId2).toStrictEqual(expect.any(Number));

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId1}`, {
      qs: { token: userToken2 },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(result.body.toString())).toStrictEqual({
      error: expect.any(String),
    });
    expect(result.statusCode).toStrictEqual(403);
  });

  test('successfully returns quiz info when a single quiz exists', () => {

    const userToken = adminAuthRegisterWrapper('jake.renzella@gmail.com', 'password123','Jake',
      'Renzella' 
    );

    const quizId = adminQuizCreateWrapper(userToken, 'Basic quiz', 'Just a normal quiz');

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`, {
      qs: { token: userToken },
      timeout: TIMEOUT_MS
    });

    expect(result.statusCode).toStrictEqual(200);
    const parsedRes = JSON.parse(result.body.toString());
    expect(parsedRes).toStrictEqual({

      quizId: quizId,
      name: 'Basic quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Just a normal quiz',
      numOfQuestions: 0,
      questions: [],
    });
  });

  test('successfully returns quiz info when a multiple quizzes exists', () => {


    const userToken1 = adminAuthRegisterWrapper('jake.renzella@gmail.com', 'password123','Jake',
      'Renzella' 
    );

    const quizId1 = adminQuizCreateWrapper(userToken1, 'Basic quiz', 'Just a normal quiz');

    const userToken2 = adminAuthRegisterWrapper('hayden.smith@gmail.com', 'password123', 'Hayden',
      'Smith'
    )

    const quizId2 = adminQuizCreateWrapper(userToken2, 'Good quiz', 'Just a good quiz');


    expect(quizId2).toStrictEqual(expect.any(Number));

    const result = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId1}`, {
      qs: { token: userToken1 },
      timeout: TIMEOUT_MS
    });

    expect(result.statusCode).toStrictEqual(200);

    const parsedRes = JSON.parse(result.body.toString());
    expect(parsedRes).toStrictEqual({
      quizId: quizId1,
      name: 'Basic quiz',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Just a normal quiz',
      numOfQuestions: 0,
      questions: [],
    });
  });
});
