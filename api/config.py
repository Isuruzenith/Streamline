from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    download_path: str = "/downloads"
    cookies_path: str = "/cookies"
    data_path: str = "/data"
    max_queue_size: int = 50
    max_retries: int = 3
    default_format: str = "mp4"
    api_key: str = ""
    host: str = "0.0.0.0"
    port: int = 8080


settings = Settings()
