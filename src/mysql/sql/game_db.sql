CREATE TABLE IF NOT EXISTS Game_Log (
    game_id         INT AUTO_INCREMENT PRIMARY KEY,
    win_user_id     VARCHAR(36) NOT NULL,
    lose_user_id    VARCHAR(36) NOT NULL,    
    create_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
