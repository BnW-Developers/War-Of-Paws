CREATE TABLE IF NOT EXISTS Game_Log (
    game_id         INT AUTO_INCREMENT PRIMARY KEY,
    cat_user_id     VARCHAR(36) NOT NULL,
    dog_user_id    VARCHAR(36) NOT NULL,    
    win_team        VARCHAR(36) NOT NULL,
    create_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
