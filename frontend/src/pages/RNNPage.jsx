import React, { useState } from 'react';
import { Repeat, Play, Send, ArrowRight } from 'lucide-react';
import { trainRNN, predictRNN } from '../services/api';
import LossChart from '../components/LossChart';
import NumberDisplay from '../components/NumberDisplay';
import Matrix from '../components/Matrix';
import StepByStepControl from '../components/StepByStepControl';
import StepCard from '../components/StepCard';
import FormulaCalcCard from '../components/FormulaCalcCard';
import Loading from '../components/Loading';
import { PageHeader, ErrorBanner, Panel, Collapsible, CheckBanner, Field, ModuleLayout, IndexSelector, inputCls } from '../components/Layout';
import { fmt, fmtVec } from '../utils/format';
import { compareVectors, nearlyEqual } from '../utils/checks';

export default function RNNPage() {
  // Form controls
  const [textsStr, setTextsStr] = useState('i love this movie\nthis is terrible');
  const [targetsStr, setTargetsStr] = useState('1, 0');
  const [learningRate, setLearningRate] = useState(0.05);
  const [epochs, setEpochs] = useState(25);
  const [hiddenSize, setHiddenSize] = useState(4);
  const [embeddingSize, setEmbeddingSize] = useState(4);

  // Prediction test form
  const [predictText, setPredictText] = useState('i love this movie');
  const [predictResult, setPredictResult] = useState(null);

  // Training state
  const [loading, setLoading] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Interactivity state
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedBPTTStep, setSelectedBPTTStep] = useState(0);
  const [selectedTimestep, setSelectedTimestep] = useState(0);

  const handleTrain = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    const texts = textsStr
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const targets = targetsStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (texts.length === 0) {
      setErrorMsg('Enter at least one training text sentence.');
      return;
    }

    if (texts.length !== targets.length) {
      setErrorMsg(`Text count (${texts.length}) must match target count (${targets.length}).`);
      return;
    }

    setLoading(true);

    const payload = {
      texts,
      targets,
      learning_rate: Number(learningRate),
      epochs: Number(epochs),
      hidden_size: Number(hiddenSize),
      embedding_size: Number(embeddingSize),
    };

    const res = await trainRNN(payload);
    setLoading(false);

    if (res.success) {
      setTrainResult(res.data);
      setCurrentStep(0);
      setSelectedBPTTStep(0);
      setSelectedTimestep(0);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    if (!predictText.trim()) {
      setErrorMsg('Prediction text cannot be empty.');
      return;
    }

    setLoading(true);
    const res = await predictRNN({ text: predictText.trim() });
    setLoading(false);

    if (res.success) {
      setPredictResult(res.data);
      setSelectedTimestep(0);
    } else {
      setErrorMsg(res.error);
    }
  };

  // Active data sample
  const history = trainResult?.history || [];
  const latestEpoch = history[history.length - 1] || null;
  const sampleData = predictResult || (latestEpoch?.samples?.[0] ? latestEpoch.samples[0] : null);

  const tokens = sampleData?.tokens || [];
  const tokenIds = sampleData?.token_ids || [];
  const embeddings = sampleData?.embeddings || [];
  const forwardHistory = sampleData?.forward_history || [];
  const backwardHistory = latestEpoch?.samples?.[0]?.backward_history || [];

  // Active step details
  const activeFwd = forwardHistory[selectedTimestep] || null;

  // Stepper definition
  const steps = [
    { title: '1. Text Tokenization', desc: 'Split input sentence into individual word tokens' },
    { title: '2. Vocabulary & Token IDs', desc: 'Lookup unique integer token IDs' },
    { title: '3. Vector Embeddings', desc: 'Map token IDs to dense embedding vectors' },
    { title: '4. Additive Timestep Vector Breakdown', desc: 'Compute z_t = W_xh · x_t + W_hh · h_{t-1} + b_h' },
    { title: '5. Tanh Activation & Hidden State', desc: 'Compute h_t = tanh(z_t)' },
    { title: '6. Final Hidden & Output Logit', desc: 'Pass h_T to Output Layer: z_y = W_hy · h_T + b_y' },
    { title: '7. Sigmoid & Prediction', desc: 'Compute classification probability σ(z_y)' },
    { title: '8. Backpropagation Through Time (BPTT)', desc: 'Flow loss gradients backward through sequence timesteps' },
  ];

  const embDim = embeddings?.[0]?.length ?? embeddingSize;

  // ---- Consistency checks: backend values vs. values recomputed from other backend values ----
  const T = forwardHistory.length;
  const t = Math.min(selectedTimestep, Math.max(T - 1, 0));
  const isNum = (v) => Array.isArray(v) && v.every((x) => typeof x === 'number');
  const tanhCheck = activeFwd && isNum(activeFwd.weighted_sum) && isNum(activeFwd.hidden)
    ? { ...compareVectors(activeFwd.weighted_sum.map(Math.tanh), activeFwd.hidden, 1e-8), n: activeFwd.hidden.length }
    : null;
  const prevCheck = !activeFwd || !isNum(activeFwd.previous_hidden)
    ? null
    : t > 0 && isNum(forwardHistory[t - 1]?.hidden)
    ? { kind: 'prev', ...compareVectors(activeFwd.previous_hidden, forwardHistory[t - 1].hidden, 1e-12) }
    : { kind: 'h0', ok: activeFwd.previous_hidden.every((v) => v === 0) };
  const inputCheck = activeFwd && isNum(activeFwd.input) && isNum(embeddings?.[t]) ? compareVectors(activeFwd.input, embeddings[t], 1e-12) : null;
  const finalHiddenCheck = isNum(sampleData?.final_hidden) && isNum(forwardHistory[T - 1]?.hidden)
    ? compareVectors(sampleData.final_hidden, forwardHistory[T - 1].hidden, 1e-12)
    : null;
  const sigmoidCheck = typeof sampleData?.logit === 'number' && typeof sampleData?.probability === 'number'
    ? { expected: 1 / (1 + Math.exp(-sampleData.logit)), ok: nearlyEqual(1 / (1 + Math.exp(-sampleData.logit)), sampleData.probability, 1e-8) }
    : null;
  // Output-layer parameters: only used if the backend actually returns them
  const wHy = sampleData?.W_hy ?? sampleData?.output_weights ?? null;
  const bY = sampleData?.b_y ?? sampleData?.output_bias ?? null;
  const logitCheck = (() => {
    if (!wHy || bY === null || !isNum(sampleData?.final_hidden)) return null;
    const w = [wHy].flat(2);
    const b = [bY].flat(2)[0];
    if (w.length !== sampleData.final_hidden.length || typeof b !== 'number') return null;
    const z = w.reduce((acc, wi, i) => acc + wi * sampleData.final_hidden[i], 0) + b;
    return { z, ok: nearlyEqual(z, sampleData.logit, 1e-8) };
  })();

  // BPTT: backward records belong to training sample 1 of the final epoch
  const trainFwd = latestEpoch?.samples?.[0]?.forward_history || [];
  const bStep = backwardHistory[selectedBPTTStep] || null;
  const bpttCheck = (() => {
    if (!bStep) return null;
    const out = {};
    if (isNum(bStep.dh_next) && isNum(bStep.tanh_derivative) && isNum(bStep.dL_dz)) {
      out.chain = compareVectors(bStep.dh_next.map((v, i) => v * bStep.tanh_derivative[i]), bStep.dL_dz, 1e-8);
    }
    if (isNum(bStep.tanh_derivative)) {
      const ts = bStep.time_step;
      const idx = [ts - 1, ts].find((i) => isNum(trainFwd[i]?.hidden) && compareVectors(trainFwd[i].hidden.map((h) => 1 - h * h), bStep.tanh_derivative, 1e-8).ok);
      out.deriv = idx === undefined ? { ok: false } : { ok: true, idx };
    }
    return out;
  })();
  // Parameter gradients: report each as available only if a matching field exists in the response
  const gradSources = [latestEpoch?.samples?.[0], latestEpoch, latestEpoch?.samples?.[0]?.gradients, latestEpoch?.gradients, latestEpoch?.samples?.[0]?.parameter_gradients].filter((x) => x && typeof x === 'object' && !Array.isArray(x));
  const paramGrads = [
    { label: 'dL/dW_xh', keys: ['dW_xh', 'dL_dW_xh', 'dL_dWxh', 'dWxh'] },
    { label: 'dL/dW_hh', keys: ['dW_hh', 'dL_dW_hh', 'dL_dWhh', 'dWhh'] },
    { label: 'dL/db_h', keys: ['db_h', 'dL_db_h', 'dL_dbh', 'dbh'] },
    { label: 'dL/dW_hy', keys: ['dW_hy', 'dL_dW_hy', 'dL_dWhy', 'dWhy'] },
    { label: 'dL/db_y', keys: ['db_y', 'dL_db_y', 'dL_dby', 'dby'] },
  ].map((g) => {
    const src = gradSources.find((o) => g.keys.some((k) => o[k] !== undefined));
    const key = src && g.keys.find((k) => src[k] !== undefined);
    return { ...g, value: key ? src[key] : undefined };
  });
  const f = `${inputCls} focus:border-emerald-500`;
  const sourceLabel = predictResult ? 'prediction input' : 'training sample 1';

  const controls = (
    <>
      <Panel title="Dataset & architecture" badge="sequence model">
        <form onSubmit={handleTrain} className="space-y-3">
          <Field label="Training texts (1 per line)">
            <textarea rows="3" value={textsStr} onChange={(e) => setTextsStr(e.target.value)} className={`${f} resize-y`} />
          </Field>
          <Field label="Targets (0 or 1, comma-separated)">
            <input type="text" value={targetsStr} onChange={(e) => setTargetsStr(e.target.value)} className={f} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hidden size">
              <input type="number" min="1" max="16" value={hiddenSize} onChange={(e) => setHiddenSize(e.target.value)} className={f} />
            </Field>
            <Field label="Embedding size">
              <input type="number" min="1" max="16" value={embeddingSize} onChange={(e) => setEmbeddingSize(e.target.value)} className={f} />
            </Field>
            <Field label="Learning rate">
              <input type="number" step="0.001" value={learningRate} onChange={(e) => setLearningRate(e.target.value)} className={f} />
            </Field>
            <Field label="Epochs">
              <input type="number" min="1" value={epochs} onChange={(e) => setEpochs(e.target.value)} className={f} />
            </Field>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Train RNN</span>
          </button>
        </form>
      </Panel>

      <Collapsible title="Test text inference" subtitle="POST /rnn/predict" defaultOpen={!!predictResult}>
        <input type="text" value={predictText} onChange={(e) => setPredictText(e.target.value)} className={f} placeholder="i love this movie" />
        <button
          onClick={handlePredict}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run text predict</span>
        </button>
        {predictResult && (
          <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400">Label</span>
              <span className={`font-bold px-2 py-0.5 rounded ${predictResult.prediction === 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {predictResult.label} ({predictResult.prediction})
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400">Probability σ(logit)</span>
              <span className="font-bold text-white">{fmt(predictResult.probability)}</span>
            </div>
          </div>
        )}
      </Collapsible>
    </>
  );

  // Timestep selector shown inside the inspector for the per-timestep steps
  const timestepBar = (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
      <span className="text-xs font-mono font-bold text-slate-300 break-words min-w-0">
        Timestep t = {selectedTimestep + 1} ("{tokens[selectedTimestep]}")
      </span>
      <IndexSelector count={tokens.length} selected={selectedTimestep} onSelect={setSelectedTimestep} />
    </div>
  );

  return (
    <div className="space-y-4 pb-12 min-w-0">
      {loading && <Loading message="Training Recurrent Neural Network..." submessage="Tokenizing text, projecting embeddings, unrolling RNN cell timesteps, and executing BPTT..." />}

      <PageHeader
        icon={Repeat}
        accent="emerald"
        title="RNN Tutor"
        subtitle="Tokens, embeddings, additive vector components & unrolled BPTT"
      />

      <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

      <ModuleLayout controls={controls}>
        {/* Unrolled sequence diagram: compact cards that wrap; vectors live in the inspector */}
        <Panel
          title="Unrolled sequence"
          subtitle="Select a timestep to inspect its vectors"
          badge={sampleData ? `${tokens.length} tokens · ${sourceLabel}` : undefined}
        >
          {tokens.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-3">
              {tokens.map((token, tIdx) => {
                const isSelected = selectedTimestep === tIdx;
                return (
                  <React.Fragment key={tIdx}>
                    <button
                      type="button"
                      onClick={() => setSelectedTimestep(tIdx)}
                      className={`bg-slate-950 px-3 py-2 rounded-xl border text-left transition-colors min-w-[5.5rem] max-w-full ${
                        isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-[10px] font-mono font-bold text-emerald-400">t = {tIdx + 1}</div>
                      <div className="text-xs font-bold text-white font-mono break-all">"{token}"</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        id <span className="text-cyan-300 font-bold">{tokenIds[tIdx]}</span>
                      </div>
                    </button>
                    <div className="flex flex-col items-center px-1">
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-[9px] font-mono text-slate-500">h<sub>{tIdx + 1}</sub></span>
                    </div>
                  </React.Fragment>
                );
              })}
              <div className="bg-slate-950 px-3 py-2 rounded-xl border border-indigo-500/40 text-xs font-mono min-w-[7rem]">
                <div className="text-[10px] font-bold text-indigo-400 uppercase">Output</div>
                <div className="text-slate-400">logit <span className="text-white font-bold">{fmt(sampleData?.logit)}</span></div>
                <div className="text-slate-400">p <span className="text-emerald-300 font-bold">{fmt(sampleData?.probability)}</span></div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500 font-mono">
              No sequence loaded. Train the model or run a text prediction to render the sequence.
            </div>
          )}

          {/* Selected timestep: real vectors from the backend, only for this timestep */}
          {activeFwd && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 space-y-2 min-w-0">
              <div className="text-xs font-mono font-bold text-emerald-300">
                Timestep t = {selectedTimestep + 1} vectors
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <NumberDisplay label={`Input x_${selectedTimestep + 1}`} value={activeFwd.input} color="cyan" size="sm" />
                <NumberDisplay label={`Previous hidden h_${selectedTimestep}`} value={activeFwd.previous_hidden} color="slate" size="sm" />
                <NumberDisplay label={`Weighted sum z_${selectedTimestep + 1}`} value={activeFwd.weighted_sum} color="amber" size="sm" />
                <NumberDisplay label={`Hidden h_${selectedTimestep + 1}`} value={activeFwd.hidden} color="emerald" size="sm" />
              </div>
              {(() => {
                const problems = [];
                if (prevCheck && prevCheck.kind === 'prev' && !prevCheck.ok) problems.push(`previous hidden ≠ h_${t} from timestep ${t}`);
                if (inputCheck && !inputCheck.ok) problems.push(`input x_${t + 1} ≠ embedding row ${t + 1}`);
                if (tanhCheck && !tanhCheck.ok) problems.push('h_t ≠ tanh(z_t)');
                const checked = [prevCheck?.kind === 'prev' ? `h_${t} → previous hidden` : prevCheck?.kind === 'h0' ? (prevCheck.ok ? 'h_0 is the zero vector' : null) : null, inputCheck ? 'x_t = embedding row' : null, tanhCheck ? 'h_t = tanh(z_t)' : null].filter(Boolean);
                if (problems.length) return <CheckBanner status="warn" title={`Timestep t = ${t + 1}: values are inconsistent`}>{problems.join('; ')}.</CheckBanner>;
                if (prevCheck?.kind === 'h0' && !prevCheck.ok) return <CheckBanner status="info" title="Initial hidden state h_0 is not the zero vector">The backend started this sequence from a non-zero h_0 (shown above as the previous hidden state).</CheckBanner>;
                return checked.length ? <CheckBanner status="ok" title={`Timestep t = ${t + 1} verified`}>{checked.join(' · ')}</CheckBanner> : null;
              })()}
            </div>
          )}
        </Panel>

        {sampleData && (
          <>
            <StepByStepControl
              currentStep={currentStep}
              totalSteps={steps.length}
              onNext={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}
              onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
              onReset={() => setCurrentStep(0)}
              steps={steps}
            />

            <StepCard stepNumber={currentStep + 1} title={steps[currentStep].title} subtitle={steps[currentStep].desc} active={true}>
              {currentStep === 0 && (
                <FormulaCalcCard
                  title="Input text tokenization"
                  whatIsHappening="The input text is split into clean lowercase word tokens."
                  formula="Text ➔ [token_1, token_2, ..., token_T]"
                  substitution={`Text: "${sampleData.text}"`}
                  result={`Tokens = [${tokens.map((t) => `"${t}"`).join(', ')}]`}
                  whyItMatters="Tokenization converts unstructured text into discrete sequence units for processing."
                  color="cyan"
                />
              )}

              {currentStep === 1 && (
                <FormulaCalcCard
                  title="Vocabulary integer encoding"
                  whatIsHappening="Each token string is looked up in the trained vocabulary to extract its integer ID."
                  formula="token_id = Vocabulary.encode(token)"
                  substitution={`Tokens: [${tokens.map((t) => `"${t}"`).join(', ')}]`}
                  result={`Token IDs = [${tokenIds.join(', ')}]`}
                  whyItMatters="Integer IDs enable memory-efficient lookup into dense embedding matrices."
                  color="cyan"
                />
              )}

              {currentStep === 2 && (
                <>
                  <FormulaCalcCard
                    title="Dense vector embedding"
                    whatIsHappening="Each integer token ID retrieves its row from the trained embedding matrix."
                    formula="x_t = EmbeddingMatrix[token_id]"
                    substitution={`Token IDs: [${tokenIds.join(', ')}]`}
                    result={`Embeddings shape: (${embeddings.length}, ${embDim})`}
                    whyItMatters="Embedding vectors capture semantic word meanings in continuous vector space."
                    color="indigo"
                  />
                  {embeddings.length > 0 && (
                    <Collapsible title="Embedding vectors" subtitle="One row per token (scrolls if wide)">
                      <Matrix data={embeddings} colorScheme="indigo" compact />
                    </Collapsible>
                  )}
                </>
              )}

              {currentStep === 3 && activeFwd && (
                <>
                  {timestepBar}
                  <FormulaCalcCard
                    title={`Additive vector calculation z_${selectedTimestep + 1}`}
                    whatIsHappening="z_t is the sum of the input projection, the previous-hidden-state projection, and the bias vector."
                    formula="z_t = (W_xh · x_t) + (W_hh · h_{t-1}) + b_h"
                    substitution={`x_${selectedTimestep + 1} = [${fmtVec(activeFwd.input)}]  |  h_${selectedTimestep} = [${fmtVec(activeFwd.previous_hidden)}]`}
                    result={`z_${selectedTimestep + 1} = [${fmtVec(activeFwd.weighted_sum)}]`}
                    whyItMatters="This additive combination merges new incoming token information with accumulated sequence memory."
                    color="emerald"
                  />
                </>
              )}

              {currentStep === 4 && activeFwd && (
                <>
                  {timestepBar}
                  {tanhCheck && (
                    <CheckBanner status={tanhCheck.ok ? 'ok' : 'warn'} title={tanhCheck.ok ? `Verified: tanh(z_${t + 1}) reproduces h_${t + 1} for all ${tanhCheck.n} units` : `Mismatch: tanh(z_${t + 1}) does not reproduce h_${t + 1}`}>
                      {tanhCheck.ok ? `Largest difference ${tanhCheck.maxDiff.toExponential(2)}.` : tanhCheck.sameShape ? `Largest difference ${fmt(tanhCheck.maxDiff, 8)}.` : 'The vectors have different lengths.'}
                    </CheckBanner>
                  )}
                  <FormulaCalcCard
                    title={`Tanh activation → hidden h_${selectedTimestep + 1}`}
                    whatIsHappening="The hyperbolic tangent restricts weighted-sum values to between -1 and +1."
                    formula="h_t = tanh(z_t)"
                    substitution={`h_${selectedTimestep + 1} = tanh([${fmtVec(activeFwd.weighted_sum)}])`}
                    result={`h_${selectedTimestep + 1} = [${fmtVec(activeFwd.hidden)}]`}
                    whyItMatters="Hidden state h_t serves as the context vector forwarded to timestep t + 1."
                    color="emerald"
                  />
                </>
              )}

              {currentStep === 5 && (
                <FormulaCalcCard
                  title="Final hidden state → output logit"
                  whatIsHappening="The final hidden state h_T from the last timestep is passed to the output dense layer to calculate the logit z_y."
                  formula="z_y = W_hy · h_T + b_y"
                  substitution={`z_y = W_hy · [${fmtVec(sampleData.final_hidden)}] + b_y`}
                  result={`Dense output logit z_y = ${fmt(sampleData.logit)}`}
                  whyItMatters="h_T condenses the full sentence history into a single vector representation."
                  color="indigo"
                />
              )}
              {currentStep === 5 && finalHiddenCheck && (
                <CheckBanner status={finalHiddenCheck.ok ? 'ok' : 'warn'} title={finalHiddenCheck.ok ? `Verified: final_hidden equals h_${T} (the last timestep's hidden state)` : `Mismatch: final_hidden is not h_${T}`} />
              )}
              {currentStep === 5 && (
                logitCheck ? (
                  <CheckBanner status={logitCheck.ok ? 'ok' : 'warn'} title={logitCheck.ok ? `Verified: W_hy · h_T + b_y = ${fmt(logitCheck.z, 6)} reproduces the logit` : `Mismatch: W_hy · h_T + b_y = ${fmt(logitCheck.z, 6)} but backend logit = ${fmt(sampleData.logit, 6)}`} />
                ) : (
                  <CheckBanner status="info" title="W_hy and b_y are not returned by the backend">
                    The logit z_y = {fmt(sampleData.logit, 6)} comes from the backend, but because the output-layer weights and bias are not in the response, the dot product cannot be recomputed or displayed here.
                  </CheckBanner>
                )
              )}

              {currentStep === 6 && (
                <FormulaCalcCard
                  title="Sigmoid & sentiment prediction"
                  whatIsHappening="Sigmoid calculates p = σ(z_y) to assign a binary label (Positive/Negative)."
                  formula="p = 1 / (1 + e^-z_y)"
                  substitution={`p = 1 / (1 + e^-(${fmt(sampleData.logit)}))`}
                  result={`p = ${fmt(sampleData.probability)} ➔ ${sampleData.label || (sampleData.prediction === 1 ? 'Positive' : 'Negative')}`}
                  whyItMatters="Converts continuous hidden memory into a readable classification decision."
                  color="emerald"
                />
              )}
              {currentStep === 6 && sigmoidCheck && (
                <CheckBanner status={sigmoidCheck.ok ? 'ok' : 'warn'} title={sigmoidCheck.ok ? `Verified: σ(${fmt(sampleData.logit, 6)}) = ${fmt(sigmoidCheck.expected, 6)} matches the backend probability` : `Mismatch: σ(logit) = ${fmt(sigmoidCheck.expected, 6)} but the backend probability is ${fmt(sampleData.probability, 6)}`} />
              )}

              {currentStep === 7 && (
                <>
                  <FormulaCalcCard
                    title="Backpropagation through time"
                    whatIsHappening="BPTT unrolls the RNN backward across timesteps (T ➔ 1) to derive parameter gradients."
                    formula="dL/dh_{t-1} = W_hh^T · (dL/dz_t)"
                    substitution="Forward: x_1 ➔ h_1 ➔ ... ➔ h_T ➔ Output ➔ Loss  |  Backward: Loss ➔ Output ➔ h_T ➔ ... ➔ h_1"
                    result={`Parameter gradients available in this response: ${paramGrads.filter((g) => g.value !== undefined).map((g) => g.label).join(', ') || 'none'}. Per-timestep records are in the advanced section below.`}
                    whyItMatters="BPTT allows W_xh and W_hh to learn sequential dependencies."
                    color="rose"
                  />

                  {paramGrads.some((g) => g.value !== undefined) && (
                    <Collapsible title="Parameter gradients returned by the backend" subtitle="Exactly as returned">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                        {paramGrads.filter((g) => g.value !== undefined).map((g) =>
                          Array.isArray(g.value) && Array.isArray(g.value[0])
                            ? <Matrix key={g.label} title={g.label} data={g.value} colorScheme="rose" compact />
                            : <NumberDisplay key={g.label} label={g.label} value={g.value} color="rose" size="sm" />
                        )}
                      </div>
                    </Collapsible>
                  )}
                  {paramGrads.some((g) => g.value === undefined) && (
                    <CheckBanner status="info" title={`Not returned by the backend: ${paramGrads.filter((g) => g.value === undefined).map((g) => g.label).join(', ')}`}>
                      Only the per-timestep records (dh_next, tanh derivative, dL/dz, dL/dx) are available, so the accumulated parameter gradients are not displayed.
                    </CheckBanner>
                  )}

                  {backwardHistory.length > 0 && (
                    <Collapsible title="Per-timestep gradients" subtitle="Advanced · from the last training epoch, training sample 1">
                      <IndexSelector
                        count={backwardHistory.length}
                        selected={selectedBPTTStep}
                        onSelect={setSelectedBPTTStep}
                        label={(i) => `t = ${backwardHistory[i].time_step}`}
                        accent="indigo"
                      />
                      {bpttCheck?.chain && (
                        <CheckBanner status={bpttCheck.chain.ok ? 'ok' : 'warn'} title={bpttCheck.chain.ok ? 'Verified: dL/dz = dh_next ⊙ (1 − tanh² z)' : 'Mismatch: dL/dz ≠ dh_next ⊙ tanh derivative'} />
                      )}
                      {bpttCheck?.deriv && (
                        <CheckBanner status={bpttCheck.deriv.ok ? 'ok' : 'warn'} title={bpttCheck.deriv.ok ? `Verified: tanh derivative = 1 − h² of forward timestep ${bpttCheck.deriv.idx + 1}` : 'Could not match the tanh derivative to any forward hidden state of training sample 1'} />
                      )}
                      {backwardHistory[selectedBPTTStep] && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <NumberDisplay label="Upstream gradient (dh_next)" value={backwardHistory[selectedBPTTStep].dh_next} color="rose" size="sm" />
                          <NumberDisplay label="Tanh derivative (1 - tanh² z)" value={backwardHistory[selectedBPTTStep].tanh_derivative} color="amber" size="sm" />
                          <NumberDisplay label="Cell error gradient (dL/dz)" value={backwardHistory[selectedBPTTStep].dL_dz} color="indigo" size="sm" />
                          <NumberDisplay label="Input gradient (dL/dx)" value={backwardHistory[selectedBPTTStep].dL_dx} color="cyan" size="sm" />
                        </div>
                      )}
                    </Collapsible>
                  )}
                </>
              )}
            </StepCard>

            <LossChart history={history} title="Average loss curve" />
          </>
        )}
      </ModuleLayout>
    </div>
  );
}
