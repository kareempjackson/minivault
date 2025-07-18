from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
import os, json, time
from dotenv import load_dotenv
from contextlib import asynccontextmanager

load_dotenv()

from generator import generate_response, get_generator, SUPPORTED_MODELS, load_all_models

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting MiniVault API...")
    try:
        print("Preloading default model (distilgpt2)...")
        get_generator("distilgpt2")
        print("Default model loaded successfully")
    except Exception as e:
        print(f"Warning: Failed to preload default model: {e}")
        print("Models will be loaded on-demand")
        print("API will still start but model loading may be slower on first request")
    print("MiniVault API startup complete!")
    yield

app = FastAPI(lifespan=lifespan)

allow_origins = os.getenv("ALLOW_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_methods=['*'],
    allow_headers=['*'],
)

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "log.jsonl")
os.makedirs(LOG_DIR, exist_ok=True)

class PromptRequest(BaseModel):
    prompt: str
    model: str = "distilgpt2" 

class ResponseOutput(BaseModel):
    response: str

class Conversation(BaseModel):
    id: str
    timestamp: str
    prompt: str
    response: str

class ModelInfo(BaseModel):
    name: str
    description: str

def log_interaction(prompt: str, response: str):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "prompt": prompt,
        "response": response
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

@app.get("/health")
def health_check():
    try:
        # Try to get the default model to check if models are working
        from generator import get_generator
        get_generator("distilgpt2")
        return {
            "status": "healthy", 
            "message": "MiniVault API is running",
            "models": "available"
        }
    except Exception as e:
        return {
            "status": "degraded", 
            "message": "MiniVault API is running but models may not be available",
            "error": str(e)
        }

@app.get("/models")
def get_available_models():
    #Get list of all models
    model_descriptions = {
        "distilgpt2": "Fast, lightweight GPT-2 model (82M parameters)",
        "gpt2": "Standard GPT-2 model (124M parameters)", 
        "gpt2-medium": "Medium-sized GPT-2 model (355M parameters)",
        "microsoft/DialoGPT-small": "Small conversational model (117M parameters)",
        "microsoft/DialoGPT-medium": "Medium conversational model (355M parameters)"
    }
    
    models = []
    for model_name in SUPPORTED_MODELS:
        models.append(ModelInfo(
            name=model_name,
            description=model_descriptions.get(model_name, "Text generation model")
        ))
    
    return models

#Return past conversations from the log json file
@app.get("/conversations")
def get_conversations():
    conversations = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            for i, line in enumerate(f):
                if line.strip():
                    try:
                        data = json.loads(line)
                        conversation = Conversation(
                            id=str(i),
                            timestamp=data["timestamp"],
                            prompt=data["prompt"],
                            response=data["response"]
                        )
                        conversations.append(conversation)
                    except json.JSONDecodeError:
                        continue
    
    return conversations[::-1]

@app.post("/generate", response_model=ResponseOutput)
def generate(prompt_request: PromptRequest):
    # Validate model name first
    if prompt_request.model not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400, 
            detail=f"Model '{prompt_request.model}' not available. Available models: {SUPPORTED_MODELS}"
        )
    
    try:
        prompt = prompt_request.prompt
        response = generate_response(prompt, prompt_request.model)
        log_interaction(prompt, response)
        return {"response": response}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/stream")
def stream_generate(prompt: str, model: str = "distilgpt2"):
    # Validate model name
    if model not in SUPPORTED_MODELS:
        raise HTTPException(
            status_code=400, 
            detail=f"Model '{model}' not available. Available models: {SUPPORTED_MODELS}"
        )
    
    def event_stream():
        try:
            generator = get_generator(model)
            result = generator(
                prompt, 
                max_length=120, 
                num_return_sequences=1,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                repetition_penalty=1.1,
                no_repeat_ngram_size=2
            )
            
            full_text = result[0]["generated_text"]
            new_text = full_text[len(prompt):]
            
            # Stream the new text character by character
            for char in new_text:
                yield f"data: {char}\n\n"
                time.sleep(0.01)
            
            log_interaction(prompt, new_text)
            
            yield "data: [DONE]\n\n"
            
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream; charset=utf-8")