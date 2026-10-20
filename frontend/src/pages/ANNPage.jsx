import React, { useState } from 'react';
import { Network, Play, Send } from 'lucide-react';
import { trainANN, predictANN } from '../services/api';
import NetworkGraph from '../components/NetworkGraph';
import LossChart from '../components/LossChart';
import NumberDisplay from '../components/NumberDisplay';
import Matrix from '../components/Matrix';
import StepByStepControl from '../components/StepByStepControl';
import StepCard from '../components/StepCard';
import FormulaCalcCard from '../components/FormulaCalcCard';
import Loading from '../components/Loading';
import { PageHeader, ErrorBanner, Panel, Collapsible, CheckBanner, Field, ModuleLayout, inputCls } from '../components/Layout';
import { fmt, fmtVec } from '../utils/format';
import { nearlyEqual, compareMatrices, compareVectors, shapeOf } from '../utils/checks';

export default function ANNPage() {
  // Form controls
  const [inputsStr, setInputsStr] = useState('1.0, 2.0');
  const [task, setTask] = useState('classification');
  const [hiddenNeurons, setHiddenNeurons] = useState(3);
  const [hiddenActivation, setHiddenActivation] = useState('relu');
  const [outputNeurons, setOutputNeurons] = useState(1);
  const [targetStr, setTargetStr] = useState('1.0');
  const [learningRate, setLearningRate] = useState(0.05);
  const [epochs, setEpochs] = useState(20);
  const [optimizer, setOptimizer] = useState('adam');

  // Prediction testing form
  const [predictInputsStr, setPredictInputsStr] = useState('1.0, 2.0');
  const [predictResult, setPredictResult] = useState(null);

  // Training state
  const [loading, setLoading] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [ranParams, setRanParams] = useState(null); // settings actually sent with the last training run
  const [selectedParamCell, setSelectedParamCell] = useState({ r: 0, c: 0 });
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const parseInputs = (str) =>
    str
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

  const handleTrain = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    const parsedInputs = parseInputs(inputsStr);
    const parsedTarget = parseInputs(targetStr);

    if (parsedInputs.length === 0) {
      setErrorMsg('Inputs cannot be empty. Enter comma-separated floats like 1.0, 2.0');
      return;
    }

    if (parsedTarget.length !== Number(outputNeurons)) {
      setErrorMsg(`Target count (${parsedTarget.length}) must match output neurons (${outputNeurons})`);
      return;
    }

    setLoading(true);

    const payload = {
      inputs: parsedInputs,
      task,
      hidden_neurons: Number(hiddenNeurons),
      hidden_activation: hiddenActivation,
      output_neurons: Number(outputNeurons),
      target: parsedTarget,
      learning_rate: Number(learningRate),
      epochs: Number(epochs),
      optimizer,
    };

    const res = await trainANN(payload);
    setLoading(false);

    if (res.success) {
      setTrainResult(res.data);
      setRanParams({ optimizer: payload.optimizer, task: payload.task, hiddenActivation: payload.hidden_activation, learningRate: payload.learning_rate });
      setSelectedParamCell({ r: 0, c: 0 });
      setCurrentStep(0);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    const parsedInputs = parseInputs(predictInputsStr);

    if (parsedInputs.length === 0) {
      setErrorMsg('Prediction inputs cannot be empty.');
      return;
    }

    setLoading(true);
    const res = await predictANN({ inputs: parsedInputs });
    setLoading(false);

    if (res.success) {
      setPredictResult(res.data);
    } else {
      setErrorMsg(res.error);
    }
  };

  const history = trainResult?.history || [];
  const latestEpoch = history[history.length - 1] || null;
  const fwdLayers = latestEpoch?.forward?.layers;
  const forwardData = latestEpoch?.forward || (trainResult?.final_prediction ? { final_output: trainResult.final_prediction } : null);

  // Steps definition for Step-by-Step mode
  const steps = [
    { title: '1. Input Layer Vector', desc: 'Initialize input vector x' },
    { title: '2. Hidden Layer Weighted Sum (z)', desc: 'Compute z = xW + b' },
    { title: '3. Hidden Activation Output (a)', desc: 'Apply non-linear activation' },
    { title: '4. Output Layer & Prediction', desc: 'Compute final prediction ŷ' },
    { title: '5. Loss Calculation', desc: 'Compute exact loss with numerical substitution' },
    { title: '6. Backpropagation & Gradients', desc: 'Derive dL/dW and dL/db' },
    { title: '7. Parameter Update', desc: 'Update parameters using selected optimizer' },
  ];

  // What the last run actually used (not whatever the form says now)
  const ran = {
    optimizer: trainResult?.optimizer || ranParams?.optimizer || optimizer,
    task: trainResult?.task || ranParams?.task || task,
    hiddenActivation: ranParams?.hiddenActivation || hiddenActivation,
    lr: trainResult?.learning_rate ?? ranParams?.learningRate ?? Number(learningRate),
  };
  const optimizerNames = { adam: 'Adam', gradient_descent: 'Gradient Descent (SGD)', momentum: 'Momentum' };

  // Loss: recompute from the backend's own prediction & target for EVERY output and compare with the backend loss
  const getLossFormulaDetails = () => {
    if (!trainResult || !latestEpoch) return null;
    const ps = trainResult.final_prediction || [];
    const ys = trainResult.target || [];
    const backendLoss = trainResult.final_loss;
    const isClf = ran.task === 'classification';
    const eps = 1e-15;
    const terms = ps.map((p, i) => {
      const y = ys[i];
      if (isClf) {
        const pc = Math.min(Math.max(p, eps), 1 - eps);
        return { value: -(y * Math.log(pc) + (1 - y) * Math.log(1 - pc)), text: `-[${fmt(y, 6)} · log(${fmt(pc, 6)}) + (1 - ${fmt(y, 6)}) · log(1 - ${fmt(pc, 6)})]` };
      }
      return { value: (p - y) ** 2, text: `(${fmt(p, 6)} - ${fmt(y, 6)})²` };
    });
    const sum = terms.reduce((acc, t) => acc + t.value, 0);
    const mean = terms.length ? sum / terms.length : NaN;
    const reduction = nearlyEqual(mean, backendLoss, 1e-6) ? 'mean' : nearlyEqual(sum, backendLoss, 1e-6) ? 'sum' : null;
    const multi = terms.length > 1;
    return {
      formula: isClf ? 'L = -[y · log(p) + (1 - y) · log(1 - p)]' : 'L = (p - y)²',
      substitution: terms.map((t, i) => `${multi ? `output ${i + 1}: ` : 'L = '}${t.text} = ${fmt(t.value, 6)}`).join('\n') + (multi ? `\n${reduction === 'sum' ? 'Sum' : 'Mean'} over outputs = ${fmt(reduction === 'sum' ? sum : mean, 6)}` : ''),
      result: `Backend loss = ${fmt(backendLoss, 6)}`,
      explanation: isClf
        ? 'Binary Cross Entropy measures the divergence between target binary label y and predicted probability p.'
        : 'Mean Squared Error calculates the squared difference between actual target y and continuous prediction p.',
      check: reduction
        ? { status: 'ok', title: `Verified: recomputed loss ${fmt(reduction === 'sum' ? sum : mean, 6)} matches the backend loss (${reduction} over ${terms.length} output${multi ? 's' : ''})` }
        : { status: 'warn', title: 'Mismatch: recomputed loss does not match the backend loss', text: `Recomputed mean = ${fmt(mean, 6)}, sum = ${fmt(sum, 6)}; backend = ${fmt(backendLoss, 6)}. The backend may use a different clamp or reduction, or its prediction may come from a different forward pass than the one shown.` },
    };
  };

  // Does the diagram's forward pass (final epoch) agree with the final_prediction used for the loss?
  const fwdVsFinal = latestEpoch?.forward?.final_output && trainResult?.final_prediction
    ? compareVectors(latestEpoch.forward.final_output, trainResult.final_prediction, 1e-8)
    : null;

  // Optimizer: update rules are the standard definitions (explanatory only); numbers come from the backend response.
  const getOptimizerFormulaDetails = () => {
    const lr = ran.lr;
    if (ran.optimizer === 'gradient_descent') {
      return {
        name: 'Gradient Descent (SGD)',
        formula: 'W_new = W_old - η · dL/dW',
        rule: `W_new = W_old - ${lr} · dL/dW`,
        explanation: 'Gradient descent subtracts the learning-rate-scaled gradient from the current weights.',
      };
    } else if (ran.optimizer === 'momentum') {
      return {
        name: 'Momentum',
        formula: 'v_t = β · v_{t-1} - η · dL/dW   ➔   W_new = W_old + v_t',
        rule: `Standard momentum rule with η = ${lr}. β and the velocity v are not returned by the backend, so they are not shown as numbers.`,
        explanation: 'Momentum keeps a running "velocity" of past gradients, which smooths the update direction.',
      };
    }
    return {
      name: 'Adam',
      formula: 'm_t = β1·m_{t-1} + (1-β1)·g   |   v_t = β2·v_{t-1} + (1-β2)·g²   |   W_new = W_old - η · m̂_t / (√v̂_t + ε)',
      rule: `Standard Adam rule with η = ${lr}. β1, β2, ε and the moments m, v are not returned by the backend (unless listed below), so they are not shown as numbers.`,
      explanation: 'Adam tracks the average gradient (m) and average squared gradient (v) and scales each parameter\'s step individually.',
    };
  };

  const lossDetails = getLossFormulaDetails();
  const optDetails = getOptimizerFormulaDetails();

  // Per-layer optimizer data, derived only from what the backend returned
  const knownUpdateKeys = ['layer', 'old_weights', 'new_weights'];
  const isMatrixLike = (m) => Array.isArray(m) && m.length > 0;
  const as2d = (m) => (Array.isArray(m?.[0]) ? m : [m]);
  const layerUpdates = (latestEpoch?.updates || []).map((u, idx) => {
    const g = latestEpoch?.gradients?.find((x) => x.layer !== undefined && x.layer === u.layer) ?? latestEpoch?.gradients?.[idx] ?? {};
    const oldW = isMatrixLike(u.old_weights) ? as2d(u.old_weights) : null;
    const newW = isMatrixLike(u.new_weights) ? as2d(u.new_weights) : null;
    const delta = oldW && newW && compareMatrices(oldW, newW).sameShape ? newW.map((row, r) => row.map((v, c) => v - oldW[r][c])) : null;
    // weight-gradient candidate: a same-shaped matrix under a dW-like key (in the update or gradient entry)
    const gradKey = [u, g].flatMap((src) => Object.keys(src).map((k) => [src, k])).find(([src, k]) => /^(dL_dW|dW|grad_?w|weight_?grad)/i.test(k) && oldW && isMatrixLike(src[k]) && compareMatrices(as2d(src[k]), oldW, Infinity).sameShape);
    const gradW = gradKey ? as2d(gradKey[0][gradKey[1]]) : null;
    const sgdPred = gradW && oldW ? oldW.map((row, r) => row.map((v, c) => v - ran.lr * gradW[r][c])) : null;
    const sgdCheck = sgdPred && newW ? compareMatrices(sgdPred, newW, 1e-8) : null;
    const fwdW = fwdLayers?.[idx]?.weights;
    const fwdCheck = oldW && isMatrixLike(fwdW) ? compareMatrices(oldW, as2d(fwdW), 1e-8) : null;
    const entries = [u, g].flatMap((src, si) => Object.entries(src).map(([k, v]) => ({ k, v, from: si === 0 ? 'update' : 'gradient' })));
    const usable = ({ v }) => typeof v === 'number' || isMatrixLike(v);
    // extra fields the backend attached to the update record itself (optimizer state, biases, ...)
    const extras = entries.filter(({ k, v, from }) => from === 'update' && !knownUpdateKeys.includes(k) && usable({ v }) && !(gradKey && v === gradKey[0][gradKey[1]]));
    const moments = entries.filter(({ k, v }) => usable({ v }) && /^(m|v|m_hat|v_hat|moment|velocity|first_moment|second_moment)(_|$)/i.test(k));
    return { u, idx, oldW, newW, delta, gradW, gradName: gradKey?.[1], sgdCheck, fwdCheck, extras, moments };
  });

  const renderExtra = ({ k, v, from }) =>
    Array.isArray(v) && Array.isArray(v[0]) ? (
      <Matrix key={`${from}-${k}`} title={k} subtitle={`${from} · returned by backend`} data={v} colorScheme="rose" compact />
    ) : (
      <NumberDisplay key={`${from}-${k}`} label={`${k} (${from})`} value={v} color="slate" size="sm" />
    );

  const lastGrad = latestEpoch?.gradients?.[latestEpoch.gradients.length - 1];

  // Generic, data-driven renderer for advanced gradient/weight details (shows whatever the backend returned).
  const renderValue = (label, v, color = 'rose') => {
    if (Array.isArray(v) && Array.isArray(v[0])) return <Matrix key={label} title={label} data={v} colorScheme="rose" compact />;
    if (Array.isArray(v) || typeof v === 'number') return <NumberDisplay key={label} label={label} value={v} color={color} />;
    return null;
  };

  const controls = (
    <>
      <Panel title="Hyperparameters" badge="NumPy engine">
        <form onSubmit={handleTrain} className="space-y-3">
          <Field label="Inputs (comma-separated)">
            <input type="text" value={inputsStr} onChange={(e) => setInputsStr(e.target.value)} className={`${inputCls} focus:border-indigo-500`} placeholder="1.0, 2.0" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Task">
              <select value={task} onChange={(e) => setTask(e.target.value)} className={`${inputCls} focus:border-indigo-500`}>
                <option value="classification">Classification (Sigmoid)</option>
                <option value="regression">Regression (Linear)</option>
              </select>
            </Field>
            <Field label="Optimizer">
              <select value={optimizer} onChange={(e) => setOptimizer(e.target.value)} className={`${inputCls} focus:border-indigo-500`}>
                <option value="adam">Adam</option>
                <option value="gradient_descent">Gradient Descent</option>
                <option value="momentum">Momentum</option>
              </select>
            </Field>
            <Field label="Hidden neurons">
              <input type="number" min="1" max="10" value={hiddenNeurons} onChange={(e) => setHiddenNeurons(e.target.value)} className={`${inputCls} focus:border-indigo-500`} />
            </Field>
            <Field label="Activation">
              <select value={hiddenActivation} onChange={(e) => setHiddenActivation(e.target.value)} className={`${inputCls} focus:border-indigo-500`}>
                <option value="relu">ReLU</option>
                <option value="sigmoid">Sigmoid</option>
                <option value="tanh">Tanh</option>
              </select>
            </Field>
            <Field label="Output neurons">
              <input type="number" min="1" max="5" value={outputNeurons} onChange={(e) => setOutputNeurons(e.target.value)} className={`${inputCls} focus:border-indigo-500`} />
            </Field>
            <Field label="Target(s)">
              <input type="text" value={targetStr} onChange={(e) => setTargetStr(e.target.value)} className={`${inputCls} focus:border-indigo-500`} placeholder="1.0" />
            </Field>
            <Field label="Learning rate">
              <input type="number" step="0.001" value={learningRate} onChange={(e) => setLearningRate(e.target.value)} className={`${inputCls} focus:border-indigo-500`} />
            </Field>
            <Field label="Epochs">
              <input type="number" min="1" max="500" value={epochs} onChange={(e) => setEpochs(e.target.value)} className={`${inputCls} focus:border-indigo-500`} />
            </Field>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Train ANN</span>
          </button>
        </form>
      </Panel>

      <Collapsible title="Test inference" subtitle="POST /ann/predict on the trained weights" defaultOpen={!!predictResult}>
        <input type="text" value={predictInputsStr} onChange={(e) => setPredictInputsStr(e.target.value)} className={`${inputCls} focus:border-indigo-500`} placeholder="1.0, 2.0" />
        <button
          onClick={handlePredict}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run predict</span>
        </button>
        {predictResult && (
          <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-1 min-w-0">
            <span className="text-[10px] font-mono text-indigo-400 uppercase">Prediction</span>
            <div className="math-text scroll-box max-h-32 text-xs text-emerald-300 font-bold">{JSON.stringify(predictResult.prediction)}</div>
          </div>
        )}
      </Collapsible>
    </>
  );

  return (
    <div className="space-y-4 pb-12 min-w-0">
      {loading && <Loading message="Training Artificial Neural Network..." submessage="Executing forward pass, computing loss, backpropagating gradients, and updating weights..." />}

      <PageHeader
        icon={Network}
        accent="indigo"
        title="ANN Tutor"
        subtitle="Neurons, forward pass, activation, loss & optimizer updates"
      />

      <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

      <ModuleLayout controls={controls}>
        {/* 1. Main visualization + 2. selected-neuron inspector */}
        <NetworkGraph
          inputs={trainResult?.inputs || parseInputs(inputsStr)}
          hiddenNeurons={Number(hiddenNeurons)}
          outputNeurons={Number(outputNeurons)}
          forwardData={forwardData}
          hiddenActivation={ran.hiddenActivation}
        />

        {trainResult && (
          <>
            {/* 3. Step controls + current step */}
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
                  title="Input Layer Vector"
                  whatIsHappening="The input layer receives the raw feature vector x and passes it directly to the hidden layer neurons."
                  formula="x = [x_1, x_2, ..., x_n]"
                  substitution={`x = [${fmtVec(trainResult.inputs)}]`}
                  result={`Dimension: (${trainResult.inputs.length},)`}
                  whyItMatters="These initial numerical inputs serve as the foundation for all subsequent weighted transformations."
                  color="cyan"
                />
              )}

              {currentStep === 1 && (
                <FormulaCalcCard
                  title="Hidden Layer Weighted Sum"
                  whatIsHappening="Each hidden neuron takes the dot product of the input vector with its weight column and adds its bias. Select a neuron above to see its individual terms."
                  formula="z = x · W + b"
                  substitution={`z = [${fmtVec(trainResult.inputs)}] · W_hidden + [${fmtVec(fwdLayers?.[0]?.biases)}]`}
                  result={`z_hidden = [${fmtVec(fwdLayers?.[0]?.weighted_sums)}]`}
                  whyItMatters="Weighted sum z provides the linear baseline before introducing non-linearity via activation functions."
                  color="amber"
                />
              )}

              {currentStep === 2 && (
                <FormulaCalcCard
                  title={`Hidden Activation (${hiddenActivation})`}
                  whatIsHappening={`The non-linear activation ${hiddenActivation} is applied element-wise to each weighted sum z.`}
                  formula={`a = ${hiddenActivation}(z)`}
                  substitution={`a = ${hiddenActivation}([${fmtVec(fwdLayers?.[0]?.weighted_sums)}])`}
                  result={`a_hidden = [${fmtVec(fwdLayers?.[0]?.outputs)}]`}
                  whyItMatters="Without non-linear activations, multi-layer neural networks would collapse into a single linear regression."
                  color="emerald"
                />
              )}

              {currentStep === 3 && fwdVsFinal && !fwdVsFinal.ok && (
                <CheckBanner status="warn" title="The diagram's output differs from final_prediction">
                  The network diagram shows the final epoch's forward pass ŷ = [{fmtVec(latestEpoch.forward.final_output, 6)}], while the loss below uses final_prediction = [{fmtVec(trainResult.final_prediction, 6)}]. They are different forward passes (for example before vs after the last update).
                </CheckBanner>
              )}
              {currentStep === 3 && (
                <FormulaCalcCard
                  title="Output Layer & Prediction"
                  whatIsHappening="Hidden activations a_hidden are passed to the output layer to calculate the final prediction ŷ."
                  formula={`z_y = a_hidden · W_out + b_out   ➔   ŷ = ${trainResult.output_activation}(z_y)`}
                  substitution={`ŷ = ${trainResult.output_activation}(${fmtVec(fwdLayers?.[1]?.weighted_sums)})`}
                  result={`Final Prediction ŷ = [${fmtVec(trainResult.final_prediction)}]`}
                  whyItMatters="This prediction represents the network's current hypothesis for target y."
                  color="emerald"
                />
              )}

              {currentStep === 4 && lossDetails && (
                <CheckBanner status={lossDetails.check.status} title={lossDetails.check.title}>{lossDetails.check.text}</CheckBanner>
              )}
              {currentStep === 4 && lossDetails && (
                <FormulaCalcCard
                  title={`Loss (${ran.task})`}
                  whatIsHappening="The loss function quantifies prediction error relative to the actual target label y."
                  formula={lossDetails.formula}
                  substitution={lossDetails.substitution}
                  result={lossDetails.result}
                  whyItMatters={lossDetails.explanation}
                  color="rose"
                />
              )}

              {currentStep === 5 && (
                <>
                  <FormulaCalcCard
                    title="Backpropagation & Gradients"
                    whatIsHappening="Backpropagation moves backward from the output layer to the hidden layer using the chain rule to compute dL/dW and dL/db."
                    formula="dL/dW = a_{prev}^T · dL/dz   |   dL/db = ∑ dL/dz"
                    substitution="Gradients are computed layer by layer by the NumPy backend."
                    result={`Output-layer dL/dz = [${fmtVec(lastGrad?.dL_dz)}]`}
                    whyItMatters="Gradients indicate the steepness and direction of error increase for each parameter. Forward: Input ➔ Hidden ➔ Output ➔ Loss. Backward: Loss ➔ Output ➔ Hidden ➔ Input."
                    color="rose"
                  />
                  {latestEpoch?.gradients?.length > 0 && (
                    <Collapsible title="All layer gradients" subtitle="Advanced: every gradient returned by the backend">
                      {latestEpoch.gradients.map((g, gi) => (
                        <div key={gi} className="space-y-2 min-w-0">
                          <div className="text-[11px] font-mono font-bold text-rose-300">Layer {gi + 1}</div>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries(g).map(([k, v]) => renderValue(k, v))}
                          </div>
                        </div>
                      ))}
                    </Collapsible>
                  )}
                </>
              )}

              {currentStep === 6 && (
                <>
                  <CheckBanner status="info" title={`Optimizer used for this run: ${optimizerNames[ran.optimizer] || ran.optimizer} · learning rate η = ${ran.lr}`}>
                    {trainResult?.optimizer ? 'Reported by the backend.' : 'Taken from the settings you submitted (the backend did not echo it).'} Values below are the final epoch's records from the backend; the update rule text is the standard textbook definition, not a computed number.
                  </CheckBanner>

                  <FormulaCalcCard
                    title={`Update rule: ${optDetails.name}`}
                    whatIsHappening={optDetails.explanation}
                    formula={optDetails.formula}
                    substitution={optDetails.rule}
                    result={`Learning rate η = ${ran.lr}`}
                    whyItMatters="Gradients tell the optimizer which direction reduces the loss; the optimizer decides how far to move each weight."
                    badgeText="Rule (explanatory)"
                    color="emerald"
                  />

                  {layerUpdates.length === 0 && (
                    <CheckBanner status="info" title="No parameter updates were returned by the backend for the final epoch." />
                  )}

                  {layerUpdates.map(({ u, idx, oldW, newW, delta, gradW, gradName, sgdCheck, fwdCheck, extras, moments }) => {
                    const r = selectedParamCell.r < (oldW?.length || 0) ? selectedParamCell.r : 0;
                    const c = selectedParamCell.c < (oldW?.[0]?.length || 0) ? selectedParamCell.c : 0;
                    const o = oldW?.[r]?.[c];
                    const n = newW?.[r]?.[c];
                    const g = gradW?.[r]?.[c];
                    return (
                      <Collapsible key={idx} title={`Layer ${u.layer ?? idx + 1} weights: old ➔ new`} subtitle="W_new = W_old + Δ, with Δ = W_new − W_old" defaultOpen={idx === 0}>
                        {fwdCheck && (
                          <CheckBanner status={fwdCheck.ok ? 'ok' : 'warn'} title={fwdCheck.ok ? 'old_weights equal the weights used in the forward pass shown in the diagram' : 'old_weights differ from the weights used in the forward pass shown in the diagram'} />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
                          <Matrix title="Old weights" data={oldW} colorScheme="rose" compact highlightRow={r} highlightCol={c} onCellClick={(rr, cc) => setSelectedParamCell({ r: rr, c: cc })} />
                          <Matrix title="New weights" data={newW} colorScheme="emerald" compact highlightRow={r} highlightCol={c} onCellClick={(rr, cc) => setSelectedParamCell({ r: rr, c: cc })} />
                          {delta && <Matrix title="Δ = new − old" subtitle="derived from the two matrices" data={delta} colorScheme="rose" compact highlightRow={r} highlightCol={c} onCellClick={(rr, cc) => setSelectedParamCell({ r: rr, c: cc })} />}
                          {gradW && <Matrix title={`Gradient (${gradName})`} subtitle="returned by backend" data={gradW} colorScheme="rose" compact highlightRow={r} highlightCol={c} onCellClick={(rr, cc) => setSelectedParamCell({ r: rr, c: cc })} />}
                        </div>

                        {typeof o === 'number' && typeof n === 'number' && (
                          <div className="math-text scroll-box max-h-40 rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-300">
                            {ran.optimizer === 'gradient_descent' && typeof g === 'number'
                              ? `W[${r}][${c}]: new = old − η · grad = ${fmt(o, 8)} − ${fmt(ran.lr, 8)} × ${fmt(g, 8)} = ${fmt(o - ran.lr * g, 8)}   (backend new = ${fmt(n, 8)})`
                              : `W[${r}][${c}]: old = ${fmt(o, 8)}, new = ${fmt(n, 8)}, Δ = ${fmt(n - o, 8)}${typeof g === 'number' ? `, gradient = ${fmt(g, 8)}` : ''}`}
                          </div>
                        )}
                        <p className="text-[11px] text-slate-500">Click any weight cell to inspect that single parameter.</p>

                        {ran.optimizer === 'gradient_descent' && (
                          sgdCheck ? (
                            <CheckBanner status={sgdCheck.ok ? 'ok' : 'warn'} title={sgdCheck.ok ? 'Verified: new = old − η · gradient for every weight in this layer' : 'Mismatch: new ≠ old − η · gradient'}>
                              {sgdCheck.ok ? `Largest difference ${sgdCheck.maxDiff.toExponential(2)}.` : `Largest difference ${fmt(sgdCheck.maxDiff, 8)}. The gradient shown may not be the one the optimizer used (e.g. averaged or clipped).`}
                            </CheckBanner>
                          ) : (
                            <CheckBanner status="info" title="Cannot verify SGD for this layer">The backend response contains no weight-gradient matrix of matching shape, so new = old − η · gradient cannot be checked here.</CheckBanner>
                          )
                        )}

                        {ran.optimizer !== 'gradient_descent' && (
                          moments.length > 0 ? (
                            <CheckBanner status="info" title={`${optimizerNames[ran.optimizer] || ran.optimizer} state returned by the backend`}>
                              The fields below are shown exactly as returned. The step counter needed to bias-correct Adam's moments is not provided, so corrected values are not derived here.
                            </CheckBanner>
                          ) : (
                            <CheckBanner status="info" title={ran.optimizer === 'adam' ? 'Adam moments (m, v, bias-corrected m̂, v̂) are not exposed by the backend' : 'Momentum velocity is not exposed by the backend'}>
                              Only the old and new weights are returned, so the optimizer's intermediate values cannot be shown or re-derived. Δ = new − old is the real net change, but it is not split into optimizer terms.
                            </CheckBanner>
                          )
                        )}

                        {(() => {
                          const shown = [...extras, ...moments.filter((m) => !extras.some((e) => e.k === m.k && e.from === m.from))];
                          return shown.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">{shown.map(renderExtra)}</div> : null;
                        })()}
                      </Collapsible>
                    );
                  })}
                </>
              )}
            </StepCard>

            <LossChart history={history} title="Loss curve" />
          </>
        )}
      </ModuleLayout>
    </div>
  );
}
