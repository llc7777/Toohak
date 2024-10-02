/**
 * Reset the state of the application back to the start.
 * Parameters: no parameters
 * Return object: empty object
 */
export let users = [];
export let quizzes = [];
export let currentQuiz = { authUserId: null }; 

export function clear() {
    users = [];
    quizzes = [];
    currentQuiz = { authUserId: null };
    return {};
}





