import request from 'sync-request-curl'
import config from './config.json';
import { clear } from './other.js';
// TO DO check port and url
const port = config.port;
const url = config.url;
const SERVER_URL = `${url}:${port}`

// function to send the adminUserDetails request
const requestUserDetails = (authUserId) => {
    const res = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
        json: {
            authUserId: authUserId,
        },
    });
    return {
        statusCode: res.statusCode,
        body: JSON.parse(res.body.toString()),
    };
};
// TO DO check if password needs number 
// function to call user registration
const requestAdminAuthRegister = (email, password, nameFirst, nameLast) => {
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

beforeEach(() => {
    clear();
});

const requestAdminAuthRegister = (email, password, firstName, lastName) => {
    const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
        json: {
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
        },
    });
    return {
        statusCode: res.statusCode,
        body: JSON.parse(res.body.toString()),
    };
};

beforeEach(() => {
    // Reset the database for each test
    clear();
});

// Test for correct return value
describe('Test for correct return value', () => {
    // Test for correct return value and type
    test('Should return userDetail with 5 correct properties', () => {
        // Register the admin user
        const admin = requestAdminAuthRegister('a@gmail.com', 'password1', 'Hayden', 'Smith');

        expect(admin.statusCode).toBe(200);
        const userDetails = requestUserDetails(admin.body.authUserId);
        
        expect(userDetails.statusCode).toBe(200);
        expect(userDetails.body).toStrictEqual({
            user: {
                userId: admin.body.authUserId,
                name: 'Hayden Smith',
                email: 'a@gmail.com',
                numSuccessfulLogins: expect.any(Number),
                numFailedPasswordsSinceLastLogin: expect.any(Number),
            },
        });

        // Check if numSuccessfulLogins is at least 1
        expect(userDetails.body.user.numSuccessfulLogins).toBeGreaterThanOrEqual(1);
    });

    // Test for multiple correct return values
    test.each([
        { email: 'a@gmail.com', password: 'password1', firstName: 'Hayden', lastName: 'Smith' },
        { email: 'b@gmail.com', password: 'passss123', firstName: 'John', lastName: 'Doe' },
        { email: 'c@gmail.com', password: 'mypassword1', firstName: 'Jane', lastName: 'Doe' },
    ])('Should return userDetail with correct properties for each user', ({ email, password, firstName, lastName }) => {
        // Register the admin user
        const admin = requestAdminAuthRegister(email, password, firstName, lastName);
        
        expect(admin.statusCode).toBe(200);
        const fullName = `${firstName} ${lastName}`;
        const userDetails = requestUserDetails(admin.body.authUserId);

        expect(userDetails.statusCode).toBe(200);
        expect(userDetails.body).toStrictEqual({
            user: {
                userId: admin.body.authUserId,
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

// Test for error handling
describe('Test for error handling', () => {
    // Test for multiple invalid authUserIds
    test.each([
        { email: 'a@gmail.com', password: 'password1', firstName: 'Hayden', lastName: 'Smith' },
        { email: 'b@gmail.com', password: 'pass123', firstName: 'John', lastName: 'Doe' },
        { email: 'c@gmail.com', password: 'mypassword1', firstName: 'Jane', lastName: 'Doe' },
    ])('Should return error with invalid authUserId', ({ email, password, firstName, lastName }) => {
        // Register the admin user
        const admin = requestAdminAuthRegister(email, password, firstName, lastName);
        
        expect(admin.statusCode).toBe(200);
        // Check if error is returned for invalid authUserId by adding random number to the authUserId
        const invalidAuthUserId = admin.body.authUserId + 1531;
        const userDetails = requestUserDetails(invalidAuthUserId);

        expect(userDetails.statusCode).toBe(400); // Assuming 400 is returned for an invalid user
        expect(userDetails.body).toStrictEqual({ error: 'Invalid authUserId' });
    });
});
