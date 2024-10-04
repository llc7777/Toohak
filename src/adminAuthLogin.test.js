import { adminAuthRegister } from './auth.js'
import { adminAuthLogin } from './auth.js'

describe('tests for adminAuthLogin', ()=> {
   
   
    beforeAll( ()=> {
        let result = adminAuthRegister('validemail@gmail.com', '123abc!@#', 'Jake', 'Renzella')
    });
   
    test('successful valid login returns authUserId', ()=> {        
        expect(adminAuthLogin('validemail@gmail.com', '123abc!@#')).toStrictEqual(expect.objectContaining({
            authUserId: expect.any(Number)
        }));
    });


    test.each([
        // missing email
        ['', 'correctpassword'],
        // missing password TO DO Only this case
        ['validemail@gmail.com', ''],
        // missing email and missing password
        ['', '']
    ])('missing parameters returns error', (email, password) => {
        adminAuthRegister(email, password, 'Jake', 'Renzalla');
        expect(adminAuthLogin(email, password)).toStrictEqual({ error: expect.any(String) });
    });


    test('unregistered email returns error', ()=> {
        const email = 'unregisteredemail@gmail.com';
        const password = '123abs!@#'


        expect(adminAuthLogin(email, password)).toStrictEqual({ error: expect.any(String) });
    });


    test('invalid email returns error', ()=> {
        const email = 'invalidemail';
        const password = '123abs!@#'


        expect(adminAuthLogin(email, password)).toStrictEqual({ error: expect.any(String) });
    });


    test('incorrect password returns error', ()=> {
        const email = 'validemail@gmail.com';
        const password = 'incorrectpassword'


        expect(adminAuthLogin(email, password)).toStrictEqual({ error: expect.any(String) });
    });
});
