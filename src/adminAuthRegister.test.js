/*
Test for adminAuthRegister function.
Registers a user with an email, password, first name, and last name, 
then returns their authUserId value or relevant error messages for invalid inputs.
Parameters: email, password, nameFirst, nameLast
*/
import { adminAuthRegister } from './auth.js';

describe("adminAuthRegister", () => {
    test("returns error for duplicate email", () => {
        adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
       let result = adminAuthRegister("aero@mail.com", "Aeropass2", "Mark", "James")
       expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for invalid email format", () => {
       let result = adminAuthRegister("invalid-email", "Aeropass1", "Jason", "Chandra")
       expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for invalid first name", () => {
       let result = adminAuthRegister("aero@mail.com", "Aeropass1", "J", "Chandra")
       expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for invalid last name", () => {
       let result = adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "C")
       expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for password too short", () => {
       let result = adminAuthRegister("aero@mail.com", "Notlong", "Jason", "Chandra")
       expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for password without letter", () => {
       let result = adminAuthRegister("aero@mail.com", "12345678", "Jason", "Chandra")
        expect(result).toStrictEqual({ error: expect.any(String)});
    });

    test("returns error for password without number", () => {
       let result = adminAuthRegister("aero@mail.com", "Nonumber", "Jason", "Chandra")
        expect(result).toStrictEqual({ error: expect.any(String)});
    });
});
