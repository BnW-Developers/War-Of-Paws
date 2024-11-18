export const SQL_QUERIES = {
  FIND_USER_BY_ID: 'SELECT * FROM User WHERE user_id = ?',
  CREATE_USER: `INSERT INTO User (user_id, password, email, created_at) VALUES(?, ?, ?, ?)`,
};
