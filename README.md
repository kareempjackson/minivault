# MiniVault

**MiniVault** is a full-stack local AI prompt API and UI that allows you to generate and stream responses from Hugging Face models.

Built with:

- FastAPI (Python) backend with Hugging Face model support
- Next.js 15+ frontend with TailwindCSS
- Real-time streaming via Server-Sent Events (SSE)
- Docker

---

## Features

- `POST /generate`: Full response generation
- `GET /stream`: Token-by-token streaming
- `GET /models`: Dynamically lists available models
- Frontend dropdown to select model
- Backend caching for fast model switching
- Logs all prompts and responses to `logs/log.jsonl`

---

## Project Structure

```
minivault-ui/
minivault-api/
│   ├── app.py
│   ├── generator.py
│   ├── requirements.txt
│   └── logs/
│   ├── app/
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md

```

---

## Setup Locally (Dev)

### 1. Clone & Install

```bash
git clone https://github.com/yourname/minivault.git
cd minivault
```

add a .env file to the minivault-api folder and enter the PORT you will be running the frontend. Default localhost:3000

### 2. Run Backend

```bash
cd minivault-api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

> Accessible at `http://localhost:8000`

Can test with postman using the postman collection in the `minivault-api/postman` folder

Can test test via curl:-

```
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain corporal punishment."}'
```

or can test using the frontend

### 3. Run Frontend

add a .env file to the minivault-api folder and enter the PORT you will be running the frontend.
`ALLOW_ORIGINS=http://localhost:3000"`

add a .env file to the minivault-ui folder and enter the PORT of the api.
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

```bash
cd minivault-ui
npm install
npm run dev
```

> Accessible at `http://localhost:3000`

---

## Dockerized Setup (All-in-One)

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/docs`

## API Endpoints

| Method | Endpoint    | Description                             |
| ------ | ----------- | --------------------------------------- |
| POST   | `/generate` | Generates a full LLM response           |
| GET    | `/stream`   | Streams response character-by-character |
| GET    | `/models`   | Returns available model options         |

Example `/generate` request:

```json
{
  "prompt": "Write a poem about space",
  "model": "gpt2"
}
```

---

## Model Switching

You can switch between supported Hugging Face models like:

- `distilgpt2` (default)
- `gpt2`
- `gpt2-medium`
- `tiiuae/falcon-7b-instruct` (GPU required)

Models are preloaded on app startup and cached using `@lru_cache`.

---

## Logs

All prompts and responses are logged to:

```
minivault-api/logs/log.jsonl
```

Each line is a JSON entry:

```json
{ "timestamp": "...", "prompt": "...", "response": "..." }
```

## Testing

```
cd minivault-api
python run_tests.py
```

## Next Steps / Future Improvements

1. The models that I am using are fast and small but aren't very good. Next steps would be using larger models that can give better reasoning and responses.
2. We should store the prompts and responses in a vector database in the future, not in JSONL.
3. I am currently preloading models, this is good for prototyping but in production I would have to optimize how I am loading models. Possibly on demand.
