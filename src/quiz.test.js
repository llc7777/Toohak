import {
    adminQuizDescriptionUpdate,
} from './quiz';

describe('Tests for function adminQuizDescriptionUpdate', () => {

    let result;

    beforeEach(() => {
        result = adminQuizDescriptionUpdate(1, 1, 'Test description');
    });

    // Test 1: Function should return an empty object
    test('should return an empty object', () => {
        expect(result).toEqual({});
    });


});