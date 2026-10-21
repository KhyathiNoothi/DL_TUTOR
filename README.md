
# 🧠 DL_TUTOR — Interactive Deep Learning Tutor

An interactive web-based platform for learning **Artificial Neural Networks (ANNs), Convolutional Neural Networks (CNNs), and Recurrent Neural Networks (RNNs)** through hands-on experimentation, step-by-step explanations, and visual learning.

## 📌 About the Project

Deep learning concepts can be difficult to understand through theory alone. DL_TUTOR aims to make these concepts easier to explore by allowing learners to experiment with neural network configurations, observe training results, and understand how different components work.

The project combines a React-based frontend with a Python FastAPI backend that implements neural network operations and training logic.

## ✨ Features

### 🧠 Artificial Neural Networks (ANN)
- Configure input features, hidden neurons, and output neurons.
- Experiment with activation functions such as ReLU, sigmoid, tanh, and linear output activation.
- Explore gradient descent, momentum, and Adam optimizers.
- Configure learning rate and training epochs.
- Observe predictions, loss values, and training history.
- Explore forward propagation and neural network training.

### 🖼️ Convolutional Neural Networks (CNN)
- Experiment with image inputs and convolution kernels.
- Configure stride, padding, pooling size, and pooling stride.
- Explore convolution, pooling, flattening, and dense layers.
- Train the network and inspect prediction probabilities and loss history.

### 🔤 Recurrent Neural Networks (RNN)
- Experiment with text-based binary classification.
- Configure embedding size, hidden size, learning rate, and training epochs.
- Explore tokenization, vocabulary generation, embeddings, and hidden states.
- Inspect model predictions, probabilities, and forward-pass information.

### 📊 Interactive Learning Interface
- Dedicated ANN, CNN, and RNN learning pages.
- Dashboard for navigating learning modules.
- Step-by-step learning components and explanatory panels.
- Training-history and loss visualizations.
- Quiz and progress interfaces.

## 🛠️ Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | Tailwind CSS, PostCSS |
| Backend | Python, FastAPI |
| API validation | Pydantic |
| Numerical computation | NumPy |
| Backend server | Uvicorn |

## 🏗️ Project Structure

```text
DL_TUTOR/
├── backend/
│   ├── ann/
│   │   ├── network.py
│   │   ├── layer.py
│   │   ├── neuron.py
│   │   ├── forward.py
│   │   ├── backprop.py
│   │   ├── optimizer.py
│   │   └── training.py
│   ├── cnn/
│   │   ├── network.py
│   │   ├── convolution.py
│   │   ├── pooling.py
│   │   ├── flatten.py
│   │   ├── dense.py
│   │   └── training.py
│   ├── rnn/
│   │   ├── model.py
│   │   ├── cell.py
│   │   ├── embedding.py
│   │   ├── tokenizer.py
│   │   ├── vocabulary.py
│   │   ├── inference.py
│   │   └── training.py
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Install the following before running the project:

- Python 3.10 or a compatible version supported by the backend dependencies.
- Node.js and npm.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/KhyathiNoothi/DL_TUTOR.git
cd DL_TUTOR
```

### 2. Set up the backend

Open a terminal in the project root.

Create and activate a virtual environment:

**Windows PowerShell**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend should be available at:

- API base URL: `http://127.0.0.1:8000`
- Interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Set up the frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in the terminal, typically `http://localhost:5173`.

> **Note:** The frontend requires the backend to be running for API-dependent features to work. Configure the frontend API base URL to match your backend address.

## 🔌 API Endpoints

The FastAPI backend exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Check API availability |
| POST | `/ann/train` | Train an ANN |
| POST | `/ann/predict` | Generate ANN predictions |
| POST | `/cnn/train` | Train a CNN |
| POST | `/cnn/predict` | Generate CNN predictions |
| POST | `/rnn/train` | Train an RNN text classifier |
| POST | `/rnn/predict` | Generate RNN text predictions |

Explore the request schemas and test the endpoints through the interactive API documentation at `/docs`.

## 🌐 Deployment

The project can be deployed as two services:

- **Frontend:** Vercel — deploy the `frontend` directory using the Vite preset.
- **Backend:** Render — deploy the `backend` directory as a Python web service.

For Render, use the following commands:

**Build command**

```bash
pip install -r requirements.txt
```

**Start command**

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Configure the frontend to use the deployed backend URL. Ensure that the backend's CORS configuration permits requests from the deployed frontend domain.
🚀 Live Demo: Try DL_TUTOR

📚 API Documentation: Explore the API

An interactive web-based platform for learning Artificial Neural Networks (ANNs), Convolutional Neural Networks (CNNs), and Recurrent Neural Networks (RNNs) through hands-on experimentation and visual learning.

## 🎯 Project Objective

DL_TUTOR aims to provide an interactive environment where learners can explore the building blocks of deep learning, experiment with neural network parameters, and better understand training and prediction workflows.

## 🔮 Future Enhancements

- More interactive visualizations of forward propagation and backpropagation.
- Additional neural network architectures and learning experiments.
- Improved quizzes, learner progress tracking, and feedback.
- More detailed training metrics and model comparisons.
- Evaluation of the platform with students to assess usability and learning effectiveness.

This is my DL_TUTOR project

