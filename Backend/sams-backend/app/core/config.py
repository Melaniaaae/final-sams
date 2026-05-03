from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "sams_db"

    # JWT
    SECRET_KEY: str = "change_this_secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "SAMS API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 5

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:4200,http://127.0.0.1:4200"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    @property
    def allowed_origins_list(self) -> list[str]:
         return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
