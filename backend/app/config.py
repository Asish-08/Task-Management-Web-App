from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    cors_origins: str = "http://localhost:5173"
    environment: str = "local"
    jwt_secret_key: str
    jwt_expire_minutes: int = 60 * 24 * 30  # 30 days — long-lived localStorage session, personal app

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    model_config = {"env_file": ".env.local"}


settings = Settings()
