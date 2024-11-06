import request from 'sync-request-curl';
import config from '../config.json';
import { decodeToken } from '../helper';

const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`;
const timeout = 5 * 1000;

// function to send the adminUserDetails request
const requestAdminUserDetails = (token: string) => {
  const res = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
    qs: { token },
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

// function to call user registration
const requestAdminAuthRegister = (email: string, password: string,
  nameFirst: string, nameLast: string) => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
    json: {
      email: email,
      password: password,
      nameFirst: nameFirst,
      nameLast: nameLast,
    },
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

const requestAdminAuthLogin = (email: string, password: string) => {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/login`, {
    json: {
      email: email,
      password: password,
    },
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body.toString()),
  };
};

beforeEach(() => {
  request('DELETE', SERVER_URL + '/v1/clear', { timeout: timeout });
});

// Tests for correct return value
describe('Test for correct return value', () => {
  // Tests for correct return value and type
  test('Should return userDetail with 5 correct properties with valid token', () => {
    // Register admin user
    const admin = requestAdminAuthRegister('hayden.smith@unsw.edu.au',
      'password1', 'Hayden', 'Smith');
    const userId = decodeToken(admin.body.token).authUserId;

    expect(admin.statusCode).toBe(200);
    // To retrieve token
    const loginResponse = requestAdminAuthLogin('hayden.smith@unsw.edu.au', 'password1');
    expect(loginResponse.statusCode).toBe(200);
    const token = loginResponse.body.token;

    const userDetails = requestAdminUserDetails(token);

    expect(userDetails.statusCode).toBe(200);
    expect(userDetails.body).toStrictEqual({
      user: {
        userId: userId,
        name: 'Hayden Smith',
        email: 'hayden.smith@unsw.edu.au',
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number),
      },
    });

    // Check if numSuccessfulLogins is at least 1
    expect(userDetails.body.user.numSuccessfulLogins).toBeGreaterThanOrEqual(1);
  });

  // Test for multiple correct return values
  test.each([
    { email: 'apple@gmail.com', password: 'passswordd1', nameFirst: 'Hayden', nameLast: 'Smith' },
    { email: 'banana@gmail.com', password: 'passsss1234', nameFirst: 'Joe', nameLast: 'Mama' },
    { email: 'coconut@gmail.com', password: 'mypasswords1', nameFirst: 'Trevsi', nameLast: 'Scot' },
  ])('Should return user details with correct properties for each user',
    ({
      email,
      password,
      nameFirst,
      nameLast
    }) => {
    // Register the admin user
      const admin = requestAdminAuthRegister(email, password, nameFirst, nameLast);
      const userId = decodeToken(admin.body.token).authUserId;

      expect(admin.statusCode).toBe(200);

      const loginResponse = requestAdminAuthLogin(email, password);
      expect(loginResponse.statusCode).toBe(200);
      const token = loginResponse.body.token;

      const fullName = `${nameFirst} ${nameLast}`;
      const userDetails = requestAdminUserDetails(token);

      expect(userDetails.statusCode).toBe(200);
      expect(userDetails.body).toStrictEqual({
        user: {
          userId: userId,
          name: fullName,
          email: email,
          numSuccessfulLogins: expect.any(Number),
          numFailedPasswordsSinceLastLogin: expect.any(Number),
        },
      });

      // Check if numSuccessfulLogins is at least 1
      expect(userDetails.body.user.numSuccessfulLogins).toBeGreaterThanOrEqual(1);
    });
});

// Tests for error handling
describe('Test for error handling', () => {
  // Tests for multiple invalid authUserIds
  test('Retruns error for empty token', () => {
    const admin = requestAdminAuthRegister('hayden.smith@unsw.edu.au',
      'password1', 'Hayden', 'Smith');

    expect(admin.statusCode).toBe(200);

    const invalidToken = '';

    const userDetails = requestAdminUserDetails(invalidToken);

    expect(userDetails.statusCode).toBe(401);
    expect(userDetails.body).toStrictEqual({ error: expect.any(String) });
  });

  test('Returns error with invalid token', () => {
    const admin = requestAdminAuthRegister('hayden.smith@unsw.edu.au',
      'password1', 'Hayden', 'Smith');

    expect(admin.statusCode).toBe(200);

    const invalidToken = 'invalidToken1';

    const userDetails = requestAdminUserDetails(invalidToken);

    expect(userDetails.statusCode).toBe(401);
    expect(userDetails.body).toStrictEqual({ error: expect.any(String) });
  });
});
