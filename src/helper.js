<<<<<<< HEAD
=======
//helper function for adminAuthRegister
>>>>>>> d026340a38e8d3e3bf370f35370bdef0f136d3c0
export function isValidName(name) {
  if (name.length < 2 || name.length > 20) {
    return false;
  }

  const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ '-";
  for (let char of name) {
    if (!validChars.includes(char)) {
      return false;
    }
  }
  
  return true;
}