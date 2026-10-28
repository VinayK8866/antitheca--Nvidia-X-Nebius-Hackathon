FROM python:3.11-slim

# Configure non-root user required by Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user

WORKDIR /app

# Install minimal OS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source and pre-seeded demo vault
COPY backend /app

# Create data directories and grant full permissions to user
RUN mkdir -p /app/data && chown -R user:user /app

USER user

ENV PORT=7860
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1
ENV DATA_DIR=/app/data

EXPOSE 7860

# Run FastAPI via uvicorn on Hugging Face Spaces default port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]

