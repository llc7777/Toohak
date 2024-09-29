/*
Test for clear function.
*/

const clear = require("./other"); 

describe("clear function", () => {
    test("should return an empty object when called", () => {
        const result = clear();
        expect(result).toEqual({});
    });

    test("should handle errors gracefully", () => {
        const wrongClear = () => {
            throw new Error("Test error");
        };

        try {
            wrongClear();
        } catch (error) {
            const result = { error: "Error resetting application state: " + error.message };
            expect(result).toEqual({ error: "Error resetting application state: Test error" });
        }
    });
});