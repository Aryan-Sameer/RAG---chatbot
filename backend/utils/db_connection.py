import os
import chromadb
from chromadb.config import Settings

_client = None

def get_chroma_client(db_path):
    global _client
    if _client is None:
        abs_db_path = os.path.abspath(db_path)
        os.makedirs(abs_db_path, exist_ok=True)
        _client = chromadb.PersistentClient(
            path=abs_db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
    return _client
