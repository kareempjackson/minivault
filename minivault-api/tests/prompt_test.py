import pytest
import json
import os
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

TEST_PROMPT = "Hello, how are you?"
TEST_MODEL = "distilgpt2"

class TestModelsEndpoint:
    
    def test_get_models_success(self):
        response = client.get("/models")
        assert response.status_code == 200
        
        models = response.json()
        assert isinstance(models, list)
        assert len(models) > 0

        for model in models:
            assert "name" in model
            assert "description" in model
            assert isinstance(model["name"], str)
            assert isinstance(model["description"], str)
    
    def test_models_include_expected_models(self):
        response = client.get("/models")
        models = response.json()
        model_names = [model["name"] for model in models]
        
        expected_models = [
            "distilgpt2",
            "gpt2", 
            "gpt2-medium",
            "microsoft/DialoGPT-small",
            "microsoft/DialoGPT-medium"
        ]
        
        for expected_model in expected_models:
            assert expected_model in model_names

class TestGenerateEndpoint:
    def test_generate_success(self):
        response = client.post("/generate", json={
            "prompt": TEST_PROMPT,
            "model": TEST_MODEL
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert isinstance(data["response"], str)
        assert len(data["response"]) > 0
    
    def test_generate_with_default_model(self):
        response = client.post("/generate", json={
            "prompt": TEST_PROMPT
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert isinstance(data["response"], str)
    
    def test_generate_invalid_model(self):
        response = client.post("/generate", json={
            "prompt": TEST_PROMPT,
            "model": "invalid_model"
        })
        assert response.status_code == 400
        assert "not available" in response.json()["detail"]
    
    def test_generate_empty_prompt(self):
        response = client.post("/generate", json={
            "prompt": "",
            "model": TEST_MODEL
        })
        # This may succeed or fail depending on the model
        assert response.status_code in [200, 400]
    
    def test_generate_missing_prompt(self):
        response = client.post("/generate", json={
            "model": TEST_MODEL
        })
        assert response.status_code == 422 
    
    def test_generate_different_models(self):
        models_to_test = ["distilgpt2", "gpt2"]
        
        for model in models_to_test:
            response = client.post("/generate", json={
                "prompt": TEST_PROMPT,
                "model": model
            })
            assert response.status_code == 200
            
            data = response.json()
            assert "response" in data
            assert isinstance(data["response"], str)

class TestStreamEndpoint:

    def test_stream_success(self):
        response = client.get(f"/stream?prompt={TEST_PROMPT}&model={TEST_MODEL}")
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

        content = response.content.decode()
        lines = content.strip().split('\n')
        
        assert len(lines) > 1
        assert any("data: [DONE]" in line for line in lines)
        
        data_lines = [line for line in lines if line.startswith("data: ") and "[DONE]" not in line]
        assert len(data_lines) > 0
    
    def test_stream_with_default_model(self):
        response = client.get(f"/stream?prompt={TEST_PROMPT}")
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
    
    def test_stream_invalid_model(self):
        response = client.get(f"/stream?prompt={TEST_PROMPT}&model=invalid_model")
        assert response.status_code == 400
        assert "not available" in response.json()["detail"]
    
    def test_stream_empty_prompt(self):
        response = client.get("/stream?prompt=")
        assert response.status_code in [200, 400]
    
    def test_stream_missing_prompt(self):
        response = client.get("/stream")
        assert response.status_code == 422 

class TestConversationsEndpoint:
    def test_get_conversations_success(self):
        response = client.get("/conversations")
        assert response.status_code == 200
        
        conversations = response.json()
        assert isinstance(conversations, list)
        
        if conversations:
            for conversation in conversations:
                assert "id" in conversation
                assert "timestamp" in conversation
                assert "prompt" in conversation
                assert "response" in conversation
                assert isinstance(conversation["id"], str)
                assert isinstance(conversation["timestamp"], str)
                assert isinstance(conversation["prompt"], str)
                assert isinstance(conversation["response"], str)
    
    def test_conversations_ordered_recent_first(self):
        for i in range(2):
            client.post("/generate", json={
                "prompt": f"Test prompt {i}",
                "model": TEST_MODEL
            })
        
        response = client.get("/conversations")
        conversations = response.json()
        
        if len(conversations) >= 2:
            timestamps = [conv["timestamp"] for conv in conversations[:2]]
            assert timestamps[0] >= timestamps[1]

class TestIntegration:

    def test_generate_and_conversations_integration(self):
        generate_response = client.post("/generate", json={
            "prompt": "Integration test prompt",
            "model": TEST_MODEL
        })
        assert generate_response.status_code == 200

        conversations_response = client.get("/conversations")
        assert conversations_response.status_code == 200
        
        conversations = conversations_response.json()
        if conversations:
            test_conversation = None
            for conv in conversations:
                if conv["prompt"] == "Integration test prompt":
                    test_conversation = conv
                    break
            
            if test_conversation:
                assert test_conversation["response"] == generate_response.json()["response"]
    


class TestErrorHandling:
    
    def test_invalid_json(self):
        response = client.post("/generate", content="invalid json")
        assert response.status_code == 422
    
    def test_malformed_request(self):
        response = client.post("/generate", json={"wrong_field": "value"})
        assert response.status_code == 422

def cleanup_test_logs():
    log_file = "logs/log.jsonl"
    if os.path.exists(log_file):
        with open(log_file, "r") as f:
            lines = f.readlines()
        
        filtered_lines = [
            line for line in lines 
            if "Integration test prompt" not in line 
            and "Stream test prompt" not in line
            and "Test prompt" not in line
        ]
        
        with open(log_file, "w") as f:
            f.writelines(filtered_lines)

def teardown_module(module):
    cleanup_test_logs()
