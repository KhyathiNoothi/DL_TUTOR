import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, RefreshCcw, Award } from 'lucide-react';

export default function QuizPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const questions = [
    {
      id: 1,
      category: 'ann',
      question: 'What calculation happens at a single neuron before activation is applied?',
      options: [
        'Elementwise matrix multiplication',
        'Weighted sum z = x · W + b',
        'Max pooling over 2D window',
        'Sigmoid logit inversion',
      ],
      correct: 1,
      explanation: 'Each neuron multiplies every incoming input by its corresponding parameter weight, adds the bias term, producing weighted sum z.',
    },
    {
      id: 2,
      category: 'ann',
      question: 'What is the primary function of an activation function like ReLU or Sigmoid?',
      options: [
        'To scale down the learning rate',
        'To unroll sequence timesteps over time',
        'To introduce non-linearity so the network can learn complex patterns',
        'To reduce image height and width',
      ],
      correct: 2,
      explanation: 'Without non-linear activations, a multi-layer neural network would collapse into a simple linear transformation.',
    },
    {
      id: 3,
      category: 'cnn',
      question: 'What operation does Max Pooling perform in a CNN pipeline?',
      options: [
        'Computes weighted dot product with a sliding filter',
        'Applies tanh activation to prevent gradient vanishing',
        'Flattens a 2D image into a 1D vector',
        'Selects the maximum value within a spatial grid window to downsample feature maps',
      ],
      correct: 3,
      explanation: 'Max pooling keeps the strongest activation within each window (e.g. 2×2), which reduces the feature map size and gives a degree of tolerance to small shifts.',
    },
    {
      id: 4,
      category: 'cnn',
      question: 'In a 2D convolution operation, how is a single feature map cell computed?',
      options: [
        'Sum of element-wise multiplication between kernel filter and input image patch',
        'Logarithm of input target class',
        'Gradient of binary cross entropy',
        'Vector dot product of hidden state h_t',
      ],
      correct: 0,
      explanation: 'A convolution filter multiplies its matrix weights elementwise with the image sub-patch and sums up the resulting numbers.',
    },
    {
      id: 5,
      category: 'rnn',
      question: 'What information is carried by the hidden state h_t in a Recurrent Neural Network?',
      options: [
        'The static spatial dimensions of an input image',
        'The learning rate multiplier for Adam optimizer',
        'Accumulated memory context from previous time steps in the sequence',
        'The max pooled feature indices',
      ],
      correct: 2,
      explanation: 'In an RNN, h_t is calculated from both the current input x_t and the previous hidden state h_{t-1}, allowing the network to retain sequential context.',
    },
    {
      id: 6,
      category: 'rnn',
      question: 'What does BPTT stand for in RNN training?',
      options: [
        'Backpropagation Through Time',
        'Binary Pooling Transformation Technique',
        'Bi-directional Parameter Tuning Template',
        'Batch Parallel Training Tensor',
      ],
      correct: 0,
      explanation: 'BPTT (Backpropagation Through Time) unrolls an RNN across the sequence time steps and applies the chain rule backward through them, accumulating gradients for the recurrent parameters W_xh, W_hh, and b_h.',
    },
  ];

  const filteredQuestions =
    activeCategory === 'all' ? questions : questions.filter((q) => q.category === activeCategory);

  const handleSelectOption = (qId, optionIdx) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    filteredQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correct) score += 1;
    });
    return score;
  };

  const unansweredCount = filteredQuestions.filter((q) => userAnswers[q.id] === undefined).length;

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
              <span>Deep Learning Knowledge Quiz</span>
            </h1>
            <p className="text-xs text-slate-400">Test your understanding of ANN, CNN, and RNN concepts</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 font-mono text-xs">
          {['all', 'ann', 'cnn', 'rnn'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSubmitted(false);
              }}
              className={`px-3 py-1 rounded-lg uppercase font-semibold transition-all ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Score Banner when submitted */}
      {submitted && (
        <div className="bg-gradient-to-r from-indigo-900/80 to-slate-900 border border-indigo-500/40 p-6 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono">Quiz results (this session only)</h3>
              <p className="text-xs text-slate-300">
                You scored <strong className="text-emerald-400 text-base">{calculateScore()}</strong> out of{' '}
                <strong>{filteredQuestions.length}</strong> questions correctly
                {unansweredCount > 0 ? ` (${unansweredCount} unanswered, counted as not correct)` : ''}. Scores are not saved.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-2"
          >
            <RefreshCcw className="w-4 h-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}

      {/* Question Cards */}
      <div className="space-y-6">
        {filteredQuestions.map((q, qIdx) => {
          const isSelected = userAnswers[q.id] !== undefined;
          const userChoice = userAnswers[q.id];
          const isCorrect = userChoice === q.correct;

          return (
            <div key={q.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase">
                  Question {qIdx + 1} • {q.category}
                </span>
                {submitted && (
                  <span
                    className={`text-xs font-mono font-bold flex items-center space-x-1 ${
                      isCorrect ? 'text-emerald-400' : isSelected ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{isCorrect ? 'Correct' : isSelected ? 'Incorrect' : 'Unanswered'}</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white leading-snug">{q.question}</h3>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  let optStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (userChoice === optIdx) {
                    optStyle = 'bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-500/30';
                  }

                  if (submitted) {
                    if (optIdx === q.correct) {
                      optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else if (userChoice === optIdx && !isCorrect) {
                      optStyle = 'bg-rose-950/80 border-rose-500 text-rose-300';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-mono transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span className="min-w-0 break-words pr-2">{opt}</span>
                      <span className="w-5 h-5 shrink-0 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-bold font-mono text-indigo-400 uppercase text-[10px]">Explanation:</span>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(userAnswers).length === 0}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
        >
          Submit Quiz Answers
        </button>
      )}
    </div>
  );
}
