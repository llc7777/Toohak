/*
Test for adminAuthRegister function.
Registers a user with an email, password, first name, and last name, 
then returns their authUserId value or relevant error messages for invalid inputs.
Parameters: email, password, nameFirst, nameLast
*/

const { adminAuthRegister, users } = require("./auth"); 

describe("adminAuthRegister", () => {
    beforeEach(() => {
        users.length = 0; 
    });

    test("registers a user with valid data", () => {
        expect(adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra")).
        toEqual({ authUserId: 1 });
        expect(users.length).toBe(1);
    });

    test("returns error for duplicate email", () => {
        adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "Chandra");
        expect(adminAuthRegister("aero@mail.com", "Aeropass2", "Mark", "James")).
        toEqual({ error: "Email address is already in use." });
    });

    test("returns error for invalid email format", () => {
        expect(adminAuthRegister("invalid-email", "Aeropass1", "Jason", "Chandra")).
        toEqual({ error: "Invalid email format." });
    });

    test("returns error for invalid first name", () => {
        expect(adminAuthRegister("aero@mail.com", "Aeropass1", "J", "Chandra")).
        toEqual({ error: "First name contains invalid characters or is not within length limits." });
    });

    test("returns error for invalid last name", () => {
        expect(adminAuthRegister("aero@mail.com", "Aeropass1", "Jason", "C")).
        toEqual({ error: "Last name contains invalid characters or is not within length limits." });
    });

    test("returns error for password too short", () => {
        expect(adminAuthRegister("aero@mail.com", "Notlong", "Jason", "Chandra")).
        toEqual({ error: "Password must be at least 8 characters long." });
    });

    test("returns error for password without letter", () => {
        expect(adminAuthRegister("aero@mail.com", "12345678", "Jason", "Chandra")).
        toEqual({ error: "Password must contain at least one letter and one number." });
    });

    test("returns error for password without number", () => {
        expect(adminAuthRegister("aero@mail.com", "Nonumber", "Jason", "Chandra")).
        toEqual({ error: "Password must contain at least one letter and one number." });
    });
});
