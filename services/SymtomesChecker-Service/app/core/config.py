import os
from dotenv import load_dotenv

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH")
COLUMNS_PATH = os.getenv("COLUMNS_PATH")