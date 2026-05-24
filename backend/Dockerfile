FROM python:3.9-slim

# Install system dependencies required for PyMuPDF and other packages
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data required by the app
RUN python -m nltk.downloader punkt
RUN python -m nltk.downloader stopwords

# Pre-download huggingface models so they are cached in the docker image
# This prevents timeouts on first boot
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='roberta-base-openai-detector');"
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2');"

# Copy application code
COPY . .

# Expose port
EXPOSE 7860

# Run the FastAPI server on port 7860 (Hugging Face default)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
