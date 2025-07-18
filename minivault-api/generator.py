from transformers import pipeline, set_seed
from functools import lru_cache
import threading
from typing import Optional

_model_lock = threading.Lock()

set_seed(42)

SUPPORTED_MODELS = [
    "distilgpt2",
    "gpt2", 
    "gpt2-medium",
    "microsoft/DialoGPT-small",
    "microsoft/DialoGPT-medium"
]

@lru_cache(maxsize=5)
def get_generator(model_name: str):
    with _model_lock:
        try:
            print(f"Loading model: {model_name}")
            generator = pipeline(
                "text-generation", 
                model=model_name, 
                tokenizer=model_name,
                truncation=True,                  
                pad_token_id=50256
            )
            print(f"Model loaded successfully: {model_name}")
            return generator
        except Exception as e:
            print(f"Failed to load model '{model_name}': {str(e)}")
            raise ValueError(f"Failed to load model '{model_name}': {str(e)}")

# Preload models at startup
def load_all_models():
    print("Preloading all supported models...")
    for model_name in SUPPORTED_MODELS:
        try:
            print(f"Loading {model_name}...")
            get_generator(model_name)
            print(f"{model_name} loaded successfully")
        except Exception as e:
            print(f"Failed to load {model_name}: {str(e)}")
    print("Model preloading complete!")

def generate_response(prompt: str, model_name: str = "distilgpt2", max_length: int = 120) -> str:
    try:
        generator = get_generator(model_name)
        result = generator(
            prompt, 
            max_length=max_length, 
            num_return_sequences=1,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            no_repeat_ngram_size=2
        )
        return result[0]["generated_text"]
    except Exception as e:
        raise ValueError(f"Generation failed for model '{model_name}': {str(e)}")

def get_default_generator():
    return get_generator("distilgpt2")

generator = None  