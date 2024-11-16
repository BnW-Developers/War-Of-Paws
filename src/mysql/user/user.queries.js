export const SQL_QUERIES = {
  FIND_USER_BY_ID: 'SELECT * FROM accounts WHERE id = ?',
  CREATE_USER: `INSERT INTO accounts (id, password, email, created_at) VALUES(?, ?, ?, ?)`,
};
