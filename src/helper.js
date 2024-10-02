export function isValidEmail(email) {
  const emailAt = email.indexOf('@');
  const emailDot = email.lastIndexOf('.');
  
  return (
    emailAt > 0 && emailDot > emailAt + 1 && emailDot < email.length - 1 
  );
}
  
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