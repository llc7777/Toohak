/**
 * Reset the state of the application back to the start.
 * Parameters: no parameters
 * Return object: empty object
 */
function clear() {
    try {
    } catch (error) {
        return { error: "Error resetting application state: " + error.message };
    }

    return {};
}

module.exports = clear; 
