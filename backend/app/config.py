from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://vaultis:vaultis@localhost:5432/vaultis"
    jwt_secret: str = "development-only-change-me"
    jwt_expiry_minutes: int = 60
    cors_origins: str = "http://localhost:3000"
    chroma_path: Path = Path("./data/chroma")
    document_storage_path: Path = Path("./data/documents")
    aes_256_key_b64: str = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY="
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b-instruct-q4_K_M"
    enable_tamper_demo_endpoint: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
