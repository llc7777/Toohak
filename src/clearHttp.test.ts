import request from 'sync-request-curl';
import { port, url } from './config.json';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

// clear response interface
interface ClearResponse {
  statusCode: number;
  body: Record<string, never>; // empty object
}

interface AuthRegisterResponse {
  statusCode: number;
  body: {
    token?: string
    error?: string
  };
}

// Helper function to clear the server data
const requestClear = (): ClearResponse => {
  const res = request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: TIMEOUT_MS });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Helper function to send the authRegister request
const registerUser = (
  email: string,
  password: string,
  firstName: string,
  lastName: string
): AuthRegisterResponse => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: { email, password, nameFirst: firstName, nameLast: lastName },
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// Helper function to create a quiz
const createQuiz = (authUserId: string, name: string, description: string) => {
  const res = request('POST', `${SERVER_URL}/v1/admin/quiz/create`, {
    json: { authUserId, name, description },
    timeout: TIMEOUT_MS,
  });
  return JSON.parse(res.body.toString());
};

describe('DELETE /v1/clear', () => {
  beforeEach(() => {
    requestClear();
  });

  test('clear data when there is one user', () => {
    registerUser('user1@example.com', 'password123', 'John', 'Doe');

    const clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});
  });

  test('clear data when there are two users', () => {
    registerUser('user1@example.com', 'password123', 'John', 'Doe');
    registerUser('user2@example.com', 'password456', 'Jane', 'Smith');

    // Clear the data
    const clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});
  });

  test('clear data when there is one user and one quiz', () => {
    // Register a user
    const user = registerUser('user1@example.com', 'password123', 'John', 'Doe');

    // Create a quiz
    createQuiz(user.body.token, 'Quiz 1', 'Description for quiz 1');

    // Clear the data
    const clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});
  });

  test('clear data when there are two users and two quizzes', () => {
    // Register two users
    const user1 = registerUser('user1@example.com', 'password123', 'John', 'Doe');
    const user2 = registerUser('user2@example.com', 'password456', 'Jane', 'Smith');

    // Create quizzes for both users
    createQuiz(user1.body.token, 'Quiz 1', 'Description for quiz 1');
    createQuiz(user2.body.token, 'Quiz 2', 'Description for quiz 2');

    // Clear the data
    const clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});
  });

  test('should return 200 when already cleared', () => {
    // Clear the data for the first time
    let clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});

    // Clear the data for the second time (should still succeed)
    clearResponse = requestClear();
    expect(clearResponse.statusCode).toBe(200);
    expect(clearResponse.body).toStrictEqual({});
  });
});
