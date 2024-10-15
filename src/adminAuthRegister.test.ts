/*
Test for adminAuthRegister function.
Registers a user with an email, password, first name, and last name,
then returns their authUserId value or relevant error messages for invalid inputs.
Parameters: email, password, nameFirst, nameLast
*/
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  adminAuthRegister,
  adminAuthLogin
} from './auth';

describe('adminAuthRegister', () => {
  test('Succesful case', () => {
    const user = adminAuthRegister('aero@mail.com', 'Aeropass1', 'Jason', 'Chandra');
    const logUser = adminAuthLogin('aero@mail.com', 'Aeropass1');
    expect(user).toStrictEqual(logUser);
  });

  test('returns error for duplicate email', () => {
    adminAuthRegister('aero@mail.com', 'Aeropass1', 'Jason', 'Chandra');
    const result = adminAuthRegister('aero@mail.com', 'Aeropass2', 'Mark', 'James');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid email format', () => {
    const result = adminAuthRegister('invalid-email', 'Aeropass1', 'Jason', 'Chandra');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid first name', () => {
    const result = adminAuthRegister('aero@mail.com', 'Aeropass1', 'J', 'Chandra');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for invalid last name', () => {
    const result = adminAuthRegister('aero@mail.com', 'Aeropass1', 'Jason', 'C');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for password too short', () => {
    const result = adminAuthRegister('aero@mail.com', 'Notlong', 'Jason', 'Chandra');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for password without letter', () => {
    const result = adminAuthRegister('aero@mail.com', '12345678', 'Jason', 'Chandra');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });

  test('returns error for password without number', () => {
    const result = adminAuthRegister('aero@mail.com', 'Nonumber', 'Jason', 'Chandra');
    expect(result).toStrictEqual({ error: expect.any(String) });
  });
});
