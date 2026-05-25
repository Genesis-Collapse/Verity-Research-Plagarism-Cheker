---
title: Verity Backend
emoji: 🚀
colorFrom: blue
colorTo: red
sdk: docker
pinned: false
---

# 🛡️ Verity | The Open-Source Originality Engine

![Status: Active](https://img.shields.io/badge/Status-Active_Development-success?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A privacy-first, deterministic originality scanner for independent researchers, students, and writers. 

Verity is designed to be your final pre-submission checkpoint. Before you submit your thesis, grant proposal, or research paper, Verity cross-references your work against 8 global data lakes and runs it through a hybrid AI-detection engine—all while guaranteeing 100% zero-retention data privacy for your unpublished intellectual property.

Built specifically to address the **University Grants Commission (UGC)** problem statement for the **Smart India Hackathon (SIH 2022)**, Verity serves as an authoritative, open-source alternative to proprietary software like Turnitin. 

---

## 📌 SIH 2022 Context

**UGC Problem Statement:** > *"Development of a system to avoid the duplicity of Research Projects submitted to various funding agencies."* By integrating semantic similarity vectors and pulling from Indian academic data lakes, Verity ensures funding is allocated to genuinely original research, preventing double-dipping and duplicity across all national funding bodies.

---

## ✨ Core Features

### 🧠 1. Hybrid AI-Detection Engine
Verity abandons hallucinatory, black-box LLMs (like GPT-2) in favor of strict, deterministic evaluation. It computes a blended probability score using three local models:
* **Burstiness (NLTK):** Analyzes sentence length variance. (Low variance = AI).
* **Perplexity (distilgpt2):** Calculates cross-entropy loss to detect highly predictable text sequences.
* **Modern Classification:** Utilizes `Hello-SimpleAI/chatgpt-detector-roberta`, fine-tuned specifically on modern LLM outputs (ChatGPT/Claude).

### 🌐 2. Asynchronous Federated Search
Why rely on one database when you can check them all? The backend uses `httpx` and `asyncio` to concurrently cross-reference uploaded text against **8 major global databases**:
1. **OpenAlex** (Global Academic Metadata)
2. **Crossref** (DOI & Publication Metadata)
3. **Semantic Scholar** (Academic Paper Search)
4. **CORE** (Open Access Research Outputs)
5. **arXiv** (STEM e-prints)
6. **Europe PMC** (Life Sciences & Medical)
7. **Wikipedia** (Broad Internet Scraping)
8. **BASE** (Gateway to Indian institutional repositories like Shodhganga)

### 📐 3. Semantic Vector Matching
Verity doesn't just look for copy-pasted text. It uses local `sentence-transformers` (`all-MiniLM-L6-v2`) to mathematically calculate cosine similarity, catching complex idea-plagiarism and heavy paraphrasing.

### 🎨 4. The "Feedback Studio" UI
A clean, progressive-disclosure React interface. It presents dense vector math and metadata through a highly accessible, white-space-heavy workspace designed for non-technical academic staff. Includes live SSE (Server-Sent Events) streaming for real-time document scanning.

### 🔒 5. Zero-Retention Security
Unreleased research and intellectual property are never at risk. 
* Documents are processed entirely **in-memory (RAM)**.
* Strict MIME-type magic-byte validation using `python-magic` to block malicious executables.
* Rate limiting via `slowapi` to prevent API abuse.
* Immediate garbage collection. Nothing is ever saved to the server's disk.

---

## 🏗️ Technical Architecture & Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript | High-performance SPA client |
| **UI / Styling** | Tailwind CSS, shadcn/ui, Framer Motion | Clean, academic white-space UI |
| **Backend Core** | FastAPI (Python 3.10+) | High-speed, async Python server |
| **Networking** | `httpx`, `asyncio` | Concurrent 8-API federated search |
| **Doc Parser** | `PyMuPDF` (fitz), `langchain` | PDF text extraction & chunking |
| **Security** | `python-magic`, `slowapi` | MIME-type validation & Rate Limiting |
| **Auth** | Firebase Auth | Role-based (Student/Instructor) access |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* Firebase Account (for Auth config)

### 1. Clone the Repository
```bash
git clone [https://github.com/Genesis-Collapse/Verity-Research-Plagarism-Cheker.git](https://github.com/Genesis-Collapse/Verity-Research-Plagarism-Cheker.git)
cd Verity-Research-Plagarism-Cheker
```

### 2. Setup the Frontend
```bash
cd frontend
npm install
# Add your Firebase config to .env.local
npm run dev
```

### 3. Setup the Backend & ML Models
``` bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

Note: On the first run, the backend will download the required Hugging Face models (~1-2GB) to your local machine.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is licensed under the MIT License.
