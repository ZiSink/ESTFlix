export function hashPassword(str) {
  let h = 0;
  for (let index = 0; index < str.length; index++) {
    h = (h << 5) - h + str.charCodeAt(index);
    h |= 0;
  }
  return String(h);
}

export function verifyPassword(password, passwordHash) {
  return hashPassword(password) === passwordHash;
}
