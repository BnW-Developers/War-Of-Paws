export const SQL_QUERIES = {
  FIND_USER_BY_ID: 'SELECT * FROM User WHERE user_id = ?',
  CREATE_USER: `INSERT INTO User (user_id, password, email, create_at) VALUES(?, ?, ?, ?)`,
  FIND_USER_BY_GOOGLE_ID: 'SELECT * FROM users WHERE google_id = ?',
  CREATE_GOOGLE_USER: 'INSERT INTO users (google_id, email, name, create_at) VALUES (?, ?, ?. ?)',
};
