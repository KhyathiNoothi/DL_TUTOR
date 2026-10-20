import React, { useState } from 'react';
import { Image as ImageIcon, Play, Send, ChevronRight, ChevronLeft } from 'lucide-react';
import { trainCNN, predictCNN } from '../services/api';
import Matrix from '../components/Matrix';
import LossChart from '../components/LossChart';
import StepByStepControl from '../components/StepByStepControl';
import ExplanationPanel from '../components/ExplanationPanel';
import StepCard from '../components/StepCard';
import FormulaCalcCard from '../components/FormulaCalcCard';
import Loading from '../components/Loading';
import { PageHeader, ErrorBanner, Panel, Collapsible, CheckBanner, Field, ModuleLayout, inputCls } from '../components/Layout';
import { fmt, fmtVec } from '../utils/format';
import { zeroPad, crossCorrelate, compareMatrices, nearlyEqual, shapeOf } from '../utils/checks';

export default function CNNPage() {
  // Matrix input JSON strings
  const [imageStr, setImageStr] = useState('[[1, 2, 3], [2, 3, 0], [1, 2, 3]]');
  const [kernelStr, setKernelStr] = useState('[[[1, 0], [2, 1]]]');
  const [stride, setStride] = useState(1);
  const [padding, setPadding] = useState(0);
  const [poolSize, setPoolSize] = useState(2);
  const [poolStride, setPoolStride] = useState(2);
  const [target, setTarget] = useState(1);
  const [learningRate, setLearningRate] = useState(0.01);
  const [epochs, setEpochs] = useState(15);

  // Prediction testing form
  const [predictImageStr, setPredictImageStr] = useState('[[1, 2, 3], [2, 3, 0], [1, 2, 3]]');
  const [predictResult, setPredictResult] = useState(null);

  // Training state
  const [loading, setLoading] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainedParams, setTrainedParams] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Interactive Convolution Stepper State
  const [currentStep, setCurrentStep] = useState(0);
  const [patchIndex, setPatchIndex] = useState(0);
  const [selectedReluCell, setSelectedReluCell] = useState({ r: 0, c: 0 });
  const [selectedPoolCell, setSelectedPoolCell] = useState({ r: 0, c: 0 });

  const parseJSON = (str, fallback) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };

  const handleTrain = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);

    const parsedImage = parseJSON(imageStr, null);
    const parsedKernels = parseJSON(kernelStr, null);

    if (!parsedImage || !Array.isArray(parsedImage)) {
      setErrorMsg('Invalid Image matrix format. Enter valid JSON like [[1,2],[3,4]]');
      return;
    }

    if (!parsedKernels || !Array.isArray(parsedKernels)) {
      setErrorMsg('Invalid Kernels format. Enter list of 2D matrices like [[[1,0],[2,1]]]');
      return;
    }

    setLoading(true);

    const payload = {
      image: parsedImage,
      kernels: parsedKernels,
      stride: Number(stride),
      padding: Number(padding),
      pool_size: Number(poolSize),
      pool_stride: Number(poolStride),
      target: Number(target),
      learning_rate: Number(learningRate),
      epochs: Number(epochs),
    };

    const res = await trainCNN(payload);
    setLoading(false);

    if (res.success) {
      setTrainResult(res.data);
      setTrainedParams({ stride: payload.stride, padding: payload.padding, poolSize: payload.pool_size, poolStride: payload.pool_stride });
      setCurrentStep(0);
      setPatchIndex(0);
    } else {
      setErrorMsg(res.error);
    }
  };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    const parsedImage = parseJSON(predictImageStr, null);

    if (!parsedImage) {
      setErrorMsg('Invalid prediction image JSON matrix.');
      return;
    }

    setLoading(true);
    const res = await predictCNN({
      image: parsedImage,
      stride: Number(stride),
      padding: Number(padding),
    });
    setLoading(false);

    if (res.success) {
      setPredictResult(res.data);
    } else {
      setErrorMsg(res.error);
    }
  };

  // Extract history details
  const history = trainResult?.history || [];
  const latestEpoch = history[history.length - 1] || null;
  const backendMap = latestEpoch?.feature_maps?.[0] || null;

  // After training, geometry comes from the parameters that were actually sent to the backend,
  // not from the (possibly since-edited) form fields.
  const used = trainResult && trainedParams ? trainedParams : { stride: Number(stride), padding: Number(padding), poolSize: Number(poolSize), poolStride: Number(poolStride) };
  const activePad = used.padding;
  const activeStride = Math.max(1, used.stride || 1);

  const DEFAULT_IMG = [[1, 2, 3], [2, 3, 0], [1, 2, 3]];
  const DEFAULT_KERNEL = [[1, 0], [2, 1]];
  const isMat = (m) => Array.isArray(m) && Array.isArray(m[0]) && m[0].length > 0;
  const candImage = trainResult?.image || parseJSON(imageStr, DEFAULT_IMG);
  const rawImage = isMat(candImage) ? candImage : DEFAULT_IMG;
  const formKernel = parseJSON(kernelStr, [DEFAULT_KERNEL])?.[0];
  const initialKernel = isMat(trainResult?.kernels?.[0]) ? trainResult.kernels[0] : isMat(formKernel) ? formKernel : DEFAULT_KERNEL;

  const paddedImage = zeroPad(rawImage, activePad);
  const imgH = paddedImage.length;
  const imgW = paddedImage[0].length;

  // Kernel candidates. The feature map the backend returns for the final epoch was produced by ONE of these;
  // we test each against the backend map and use (and name) the one that reproduces it.
  const kernelCandidates = trainResult
    ? [
        isMat(latestEpoch?.old_kernels?.[0]) && { key: 'used', label: 'kernel used in the final epoch (old_kernels[0], before that epoch\'s update)', k: latestEpoch.old_kernels[0] },
        { key: 'initial', label: 'initial kernel (kernels[0], before any training)', k: initialKernel },
        isMat(latestEpoch?.new_kernels?.[0]) && { key: 'updated', label: 'kernel after the final update (new_kernels[0])', k: latestEpoch.new_kernels[0] },
      ].filter(Boolean)
    : [{ key: 'form', label: 'initial kernel from the form (no training run yet)', k: initialKernel }];

  const candidateChecks = kernelCandidates.map((c) => ({
    ...c,
    cmp: backendMap && c.k[0] ? compareMatrices(crossCorrelate(paddedImage, c.k, activeStride), backendMap) : null,
  }));
  const matching = candidateChecks.find((c) => c.cmp?.ok);
  const chosen = matching || candidateChecks[0];
  const activeKernel = chosen.k;
  const kernelLabel = chosen.label;

  // Derive kernel dimensions dynamically
  const kh = activeKernel.length;
  const kw = activeKernel[0].length;

  // Patch positions come from the geometry; row/col are the feature-map coordinates of each patch.
  const validPatches = [];
  for (let r = 0, row = 0; r <= imgH - kh; r += activeStride, row++) {
    for (let c = 0, col = 0; c <= imgW - kw; c += activeStride, col++) {
      validPatches.push({ startRow: r, endRow: r + kh - 1, startCol: c, endCol: c + kw - 1, row, col });
    }
  }
  const outH = validPatches.length ? validPatches[validPatches.length - 1].row + 1 : 0;
  const outW = validPatches.length ? validPatches[validPatches.length - 1].col + 1 : 0;

  const safeIndex = Math.min(patchIndex, Math.max(validPatches.length - 1, 0));
  const activePatchPos = validPatches[safeIndex];
  const featureMapRow = activePatchPos ? activePatchPos.row : 0;
  const featureMapCol = activePatchPos ? activePatchPos.col : 0;

  // Whole-map consistency report (shape + every cell) for the kernel we display
  const mapCheck = backendMap
    ? matching
      ? { status: 'ok', cmp: matching.cmp }
      : { status: 'warn', cmp: candidateChecks[0].cmp }
    : null;

  // Exact element-wise products and their sum for the selected patch (cross-correlation, kernel NOT flipped)
  const getPatchCalcDetails = () => {
    if (!activePatchPos) return null;
    const prodGrid = [];
    const subPatch = [];
    const terms = [];
    let totalSum = 0;
    for (let i = 0; i < kh; i++) {
      const pRow = [];
      const mRow = [];
      for (let j = 0; j < kw; j++) {
        const imgVal = paddedImage[activePatchPos.startRow + i][activePatchPos.startCol + j];
        const kVal = activeKernel[i][j];
        const prod = imgVal * kVal;
        pRow.push(imgVal);
        mRow.push(prod);
        terms.push(`(${fmt(imgVal, 12)} × ${fmt(kVal, 12)})`);
        totalSum += prod;
      }
      subPatch.push(pRow);
      prodGrid.push(mRow);
    }
    const backendVal = backendMap?.[featureMapRow]?.[featureMapCol];
    const hasBackend = typeof backendVal === 'number';
    const cellOk = hasBackend ? nearlyEqual(totalSum, backendVal) : null;
    return {
      subPatch,
      prodGrid,
      sumVal: totalSum,
      backendVal: hasBackend ? backendVal : null,
      cellOk,
      formula: `FeatureMap[${featureMapRow}][${featureMapCol}] = ∑ (ImagePatch ⊙ Kernel)`,
      substitution: `${terms.join(' + ')} = ${fmt(totalSum, 12)}`,
    };
  };

  const patchCalc = getPatchCalcDetails();

  // Pooling window for the selected pooled cell (mapped back onto the activated map)
  const pooledMap = latestEpoch?.pooled_maps?.[0];
  const activatedMap = latestEpoch?.activated_maps?.[0];
  const rawMap = latestEpoch?.feature_maps?.[0];
  const ps = Math.max(1, used.poolSize || 1);
  const pst = Math.max(1, used.poolStride || 1);
  const poolWin = {
    startRow: selectedPoolCell.r * pst,
    endRow: selectedPoolCell.r * pst + ps - 1,
    startCol: selectedPoolCell.c * pst,
    endCol: selectedPoolCell.c * pst + ps - 1,
  };
  const poolVals = [];
  if (activatedMap) {
    for (let i = poolWin.startRow; i <= poolWin.endRow; i++)
      for (let j = poolWin.startCol; j <= poolWin.endCol; j++)
        if (activatedMap[i]?.[j] !== undefined) poolVals.push(activatedMap[i][j]);
  }

  // Stepper definition
  const steps = [
    { title: '1. Input Image & Filter Matrices', desc: 'Inspect input image grid and filter weights' },
    { title: '2. Convolution Operation', desc: 'Slide kernel filter over image sub-patches and calculate sum' },
    { title: '3. ReLU Non-Linear Activation', desc: 'Apply ReLU activation function max(0, x)' },
    { title: '4. Max Pooling Downsampling', desc: 'Select maximum feature value in window' },
    { title: '5. Flattening & Dense Logit', desc: 'Unroll 2D matrix into 1D vector and compute logit' },
    { title: '6. Sigmoid & Classification', desc: 'Compute probability σ(logit) & binary loss' },
    { title: '7. Backpropagation & Kernel Update', desc: 'Update dense parameters and filter weights' },
  ];

  const numField = (label, val, set, extra = {}) => (
    <Field label={label}>
      <input type="number" value={val} onChange={(e) => set(e.target.value)} className={`${inputCls} focus:border-cyan-500`} {...extra} />
    </Field>
  );

  const controls = (
    <>
      <Panel title="CNN Hyperparameters" badge="2D filter">
        <form onSubmit={handleTrain} className="space-y-3">
          <Field label="Input image (JSON 2D)">
            <textarea rows="3" wrap="off" value={imageStr} onChange={(e) => setImageStr(e.target.value)} className={`${inputCls} focus:border-cyan-500 resize-y overflow-x-auto`} />
          </Field>
          <Field label="Kernel filters (JSON array of 2D)">
            <textarea rows="2" wrap="off" value={kernelStr} onChange={(e) => setKernelStr(e.target.value)} className={`${inputCls} focus:border-cyan-500 resize-y overflow-x-auto`} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {numField('Conv stride', stride, setStride, { min: 1 })}
            {numField('Conv padding', padding, setPadding, { min: 0 })}
            {numField('Pool size', poolSize, setPoolSize, { min: 1 })}
            {numField('Pool stride', poolStride, setPoolStride, { min: 1 })}
            <Field label="Target">
              <select value={target} onChange={(e) => setTarget(e.target.value)} className={`${inputCls} focus:border-cyan-500`}>
                <option value={1}>1 (Pos)</option>
                <option value={0}>0 (Neg)</option>
              </select>
            </Field>
            {numField('Learning rate', learningRate, setLearningRate, { step: 0.001 })}
            {numField('Epochs', epochs, setEpochs, { min: 1 })}
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Train CNN</span>
          </button>
        </form>
      </Panel>

      <Collapsible title="Test inference" subtitle="POST /cnn/predict" defaultOpen={!!predictResult}>
        <textarea rows="2" wrap="off" value={predictImageStr} onChange={(e) => setPredictImageStr(e.target.value)} className={`${inputCls} focus:border-cyan-500 resize-y overflow-x-auto`} />
        <button
          onClick={handlePredict}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Run predict</span>
        </button>
        {predictResult && (
          <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-xs font-mono text-cyan-300">Prediction output recorded.</div>
        )}
      </Collapsible>
    </>
  );

  return (
    <div className="space-y-4 pb-12 min-w-0">
      {loading && <Loading message="Training CNN Model..." submessage="Performing 2D convolution, max pooling, dense logit computation, and kernel backpropagation..." />}

      <PageHeader
        icon={ImageIcon}
        accent="cyan"
        title="CNN Tutor"
        subtitle="Patch sliding, element-wise multiplication, max pooling & gradients"
      />

      <ErrorBanner message={errorMsg} onClose={() => setErrorMsg(null)} />

      <ModuleLayout controls={controls}>
        {/* Main visualization: image + feature map, with the stepper directly above (never overlapping) */}
        <Panel
          title="Convolution window"
          subtitle={`Kernel ${kh}×${kw} · stride ${activeStride} · padding ${activePad}`}
          badge={`Position ${safeIndex + 1} of ${validPatches.length}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono text-xs">
            <button
              onClick={() => setPatchIndex(Math.max(safeIndex - 1, 0))}
              disabled={safeIndex === 0}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <div className="text-slate-400 min-w-0 break-words text-center">
              Cell <strong className="text-amber-300">[{featureMapRow}][{featureMapCol}]</strong>
            </div>
            <button
              onClick={() => setPatchIndex(Math.min(safeIndex + 1, validPatches.length - 1))}
              disabled={safeIndex >= validPatches.length - 1}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center gap-1 font-bold"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Matrix
              title="Input image"
              subtitle={activePad > 0 ? `zero-padded (+${activePad})` : 'raw input'}
              data={paddedImage}
              padding={activePad}
              highlightPatch={activePatchPos}
              colorScheme="cyan"
            />
            <Matrix
              title="Feature map"
              subtitle={backendMap ? 'backend result · click a cell to jump' : 'no training yet · click a cell to jump'}
              data={backendMap || Array(outH).fill(Array(outW).fill(0))}
              highlightRow={featureMapRow}
              highlightCol={featureMapCol}
              colorScheme="indigo"
              onCellClick={(r, c) => {
                const idx = validPatches.findIndex((p) => p.row === r && p.col === c);
                if (idx >= 0) setPatchIndex(idx);
              }}
            />
          </div>
        </Panel>

        {/* Calculation inspector for the selected feature-map cell */}
        {patchCalc && (
          <Panel
            title={`Inspector: FeatureMap[${featureMapRow}][${featureMapCol}]`}
            subtitle={`Uses the ${kernelLabel}${trainResult ? ` · final epoch ${latestEpoch?.epoch ?? history.length}` : ''}`}
          >
            {/* Consistency diagnostics: recomputed arithmetic vs. the backend's feature map */}
            {!trainResult && (
              <CheckBanner status="info" title="Preview only: no backend result yet">
                Showing the arithmetic for the initial kernel. Train the model to compare it with the backend's feature map.
              </CheckBanner>
            )}
            {trainResult && !backendMap && (
              <CheckBanner status="info" title="Backend did not return a feature map">
                The calculation below is recomputed in the browser and could not be checked against the backend.
              </CheckBanner>
            )}
            {mapCheck?.status === 'ok' && (
              <CheckBanner status="ok" title={`Verified: all ${mapCheck.cmp.cells} feature-map cells reproduce`}>
                Recomputing the whole map from the padded image ({imgH}×{imgW}, padding {activePad}), stride {activeStride} and the {kernelLabel} matches the backend (max |difference| = {mapCheck.cmp.maxDiff.toExponential(2)}).
              </CheckBanner>
            )}
            {mapCheck?.status === 'warn' && (
              <CheckBanner status="warn" title="Mismatch: the displayed calculation does NOT reproduce the backend feature map">
                {!mapCheck.cmp.sameShape
                  ? `Shape differs: recomputed ${JSON.stringify(shapeOf(crossCorrelate(paddedImage, activeKernel, activeStride)))} vs backend ${JSON.stringify(shapeOf(backendMap))} (check padding/stride and whether the backend image is already padded). `
                  : `Largest cell difference = ${fmt(mapCheck.cmp.maxDiff, 6)}. `}
                Tested kernels: {candidateChecks.map((c) => `${c.key} → ${c.cmp ? (c.cmp.ok ? 'match' : 'no match') : 'n/a'}`).join('; ')}. The backend may add a bias or use a different convention, which this view does not model. Treat the numbers below as the browser's recomputation, not the backend's.
              </CheckBanner>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Matrix title="Active kernel" subtitle={`${kh}×${kw} · ${chosen.key === 'used' ? 'final-epoch kernel' : chosen.key === 'updated' ? 'updated kernel' : 'initial kernel'}${trainResult?.kernels?.length > 1 ? ` · filter 1 of ${trainResult.kernels.length}` : ''}`} data={activeKernel} colorScheme="amber" />
              <Matrix title="Patch ⊙ kernel" subtitle="element-wise products" data={patchCalc.prodGrid} colorScheme="amber" />
            </div>

            <FormulaCalcCard
              title="Cell calculation"
              whatIsHappening={`The ${kh}×${kw} kernel multiplies the highlighted image patch element by element (position (i,j) of the patch with position (i,j) of the kernel, no flipping), then sums the products.`}
              formula={patchCalc.formula}
              substitution={patchCalc.substitution}
              result={
                patchCalc.backendVal === null
                  ? `Recomputed = ${fmt(patchCalc.sumVal, 12)}`
                  : `Recomputed = ${fmt(patchCalc.sumVal, 12)}   |   Backend feature map = ${fmt(patchCalc.backendVal, 12)}   ${patchCalc.cellOk ? '✓ match' : '✗ MISMATCH'}`
              }
              whyItMatters="High values indicate strong pattern alignment between the filter and the local image region."
              color="cyan"
            />

            {trainResult && candidateChecks.length > 1 && (
              <Collapsible title="Kernel versions" subtitle="Initial vs. trained kernels">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {candidateChecks.map((c) => (
                    <Matrix key={c.key} title={c.key === 'initial' ? 'Initial kernel' : c.key === 'used' ? 'Used in final epoch' : 'After final update'} subtitle={c.cmp ? (c.cmp.ok ? 'reproduces backend map' : 'does not reproduce backend map') : undefined} data={c.k} colorScheme={c.key === 'initial' ? 'cyan' : 'amber'} />
                  ))}
                </div>
              </Collapsible>
            )}
          </Panel>
        )}

        {trainResult && (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Matrix title="Raw input image" data={trainResult.image} colorScheme="cyan" />
                  <Matrix title="Initial kernel filter" subtitle="before training" data={trainResult.kernels[0]} colorScheme="amber" />
                </div>
              )}

              {currentStep === 1 && patchCalc && (
                <ExplanationPanel
                  title="Convolved feature map"
                  formula={patchCalc.formula}
                  explanation="Each feature-map cell is the sum of an image patch multiplied element-wise by the kernel. Use the window controls above to slide the kernel; the selected cell's full calculation is in the inspector."
                  highlights={[`Selected: FeatureMap[${featureMapRow}][${featureMapCol}] = ${fmt(patchCalc.backendVal ?? patchCalc.sumVal, 6)} (${patchCalc.backendVal === null ? 'recomputed' : 'backend'})`]}
                />
              )}

              {currentStep === 2 && (
                <>
                  <p className="text-xs text-slate-300">ReLU is applied element-wise: max(0, x). Click a cell to see its calculation.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Matrix title="Raw feature map" data={rawMap} colorScheme="indigo" highlightRow={selectedReluCell.r} highlightCol={selectedReluCell.c} onCellClick={(r, c) => setSelectedReluCell({ r, c })} />
                    <Matrix title="Activated (ReLU)" data={activatedMap} colorScheme="emerald" highlightRow={selectedReluCell.r} highlightCol={selectedReluCell.c} onCellClick={(r, c) => setSelectedReluCell({ r, c })} />
                  </div>
                  {rawMap && activatedMap && !compareMatrices(rawMap.map((row) => row.map((v) => Math.max(0, v))), activatedMap).ok && (
                    <CheckBanner status="warn" title="Mismatch: max(0, raw) does not reproduce the backend's activated map" />
                  )}
                  {rawMap?.[selectedReluCell.r]?.[selectedReluCell.c] !== undefined && (
                    <div className="math-text scroll-box rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-300">
                      {`[${selectedReluCell.r}][${selectedReluCell.c}]: max(0, ${fmt(rawMap[selectedReluCell.r][selectedReluCell.c], 6)}) = ${fmt(activatedMap?.[selectedReluCell.r]?.[selectedReluCell.c], 6)}`}
                    </div>
                  )}
                </>
              )}

              {currentStep === 3 && (
                <>
                  <p className="text-xs text-slate-300">Max pooling over {ps}×{ps} windows (stride {pst}). Click a pooled cell to highlight its window.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Matrix title="Activated map" subtitle="selected window highlighted" data={activatedMap} colorScheme="emerald" highlightPatch={poolWin} />
                    <Matrix title="Max-pooled map" data={pooledMap} colorScheme="amber" highlightRow={selectedPoolCell.r} highlightCol={selectedPoolCell.c} onCellClick={(r, c) => setSelectedPoolCell({ r, c })} />
                  </div>
                  {poolVals.length > 0 && pooledMap?.[selectedPoolCell.r]?.[selectedPoolCell.c] !== undefined && !nearlyEqual(Math.max(...poolVals), pooledMap[selectedPoolCell.r][selectedPoolCell.c]) && (
                    <CheckBanner status="warn" title="Mismatch: the window maximum differs from the backend's pooled value">
                      The window shown uses pool size {ps} and stride {pst} (the values sent to the backend). Check whether the backend pools differently or applies padding.
                    </CheckBanner>
                  )}
                  {poolVals.length > 0 && pooledMap?.[selectedPoolCell.r]?.[selectedPoolCell.c] !== undefined && (
                    <div className="math-text scroll-box rounded-lg border border-amber-800/50 bg-amber-950/30 p-3 text-xs font-bold text-amber-300">
                      {`Pooled[${selectedPoolCell.r}][${selectedPoolCell.c}] = max(${poolVals.map((v) => fmt(v, 6)).join(', ')}) = ${fmt(pooledMap[selectedPoolCell.r][selectedPoolCell.c], 6)}`}
                    </div>
                  )}
                </>
              )}

              {currentStep === 4 && (
                <FormulaCalcCard
                  title="Flatten & dense logit"
                  whatIsHappening="The 2D pooled feature map is unrolled into a 1D vector and passed to the dense classification layer."
                  formula="z = FlattenedVector · DenseWeights + Bias"
                  substitution={`z = [${fmtVec(latestEpoch?.flattened)}] · W_dense + b_dense`}
                  result={`Dense logit z = ${fmt(latestEpoch?.logit)}`}
                  whyItMatters="Flattening enables spatial feature maps to interface with standard dense classification neurons."
                  color="cyan"
                />
              )}

              {currentStep === 5 && (
                <FormulaCalcCard
                  title="Sigmoid & loss"
                  whatIsHappening="Sigmoid transforms the dense logit z into a binary probability between 0 and 1."
                  formula="p = σ(z) = 1 / (1 + e^-z)   |   Loss = Binary Cross Entropy"
                  substitution={`p = 1 / (1 + e^-(${fmt(latestEpoch?.logit)}))`}
                  result={`p = ${fmt(latestEpoch?.probability)} | Loss = ${fmt(latestEpoch?.loss, 6)}`}
                  whyItMatters="The binary cross entropy loss provides the error scalar used to calculate kernel gradients during backpropagation."
                  color="emerald"
                />
              )}

              {currentStep === 6 && (
                <>
                  <FormulaCalcCard
                    title="Kernel update"
                    whatIsHappening="Gradients flow backward through dense, flatten, max pool, and ReLU operations to derive dL/dKernel."
                    formula="Kernel_new = Kernel_old - η · dL/dKernel"
                    substitution={`Kernel_new = Kernel_old - ${trainResult.learning_rate} · dL/dKernel`}
                    result="Updated filter weights learned to detect distinct visual patterns."
                    color="emerald"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Matrix title="Old kernel" subtitle="before final update" data={latestEpoch?.old_kernels?.[0]} colorScheme="rose" />
                    <Matrix title="New kernel" subtitle="after final update" data={latestEpoch?.new_kernels?.[0]} colorScheme="emerald" />
                  </div>
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
