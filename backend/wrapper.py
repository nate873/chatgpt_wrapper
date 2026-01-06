# backend/wrapper.py

import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("key.env")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_chatgpt(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a professional deal analyst."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            timeout=30,  # 👈 THIS PREVENTS HANGS
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("🔥 ask_chatgpt ERROR:", repr(e))
        return "Sorry — the AI failed to generate a response."
