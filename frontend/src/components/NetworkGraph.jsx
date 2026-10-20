import React, { useState } from 'react';
import FormulaCalcCard from './FormulaCalcCard';
import { Panel } from './Layout';
import { fmt } from '../utils/format';

export default function NetworkGraph({ inputs, hiddenNeurons, outputNeurons, forwardData, hiddenActivation = "relu" }) {
  const inputList = Array.isArray(inputs) ? inputs : [1.0, 2.0];
  const hiddenCount = hiddenNeurons || 3;
  const outputCount = outputNeurons || 1;

  // Selected node state for focused inspector
  const [selectedNode, setSelectedNode] = useState({ layer: 'hidden', index: 0 });

  // Extract layer histories
  const hiddenLayerHistory = forwardData?.layers?.[0] || null;
  const hiddenOutputs = hiddenLayerHistory?.outputs || Array(hiddenCount).fill(null);
  const hiddenSums = hiddenLayerHistory?.weighted_sums || Array(hiddenCount).fill(null);
  const hiddenWeights = hiddenLayerHistory?.weights || null;
  const hiddenBiases = hiddenLayerHistory?.biases || null;

  const outputLayerHistory = forwardData?.layers?.[1] || null;
  const finalOutputs = forwardData?.final_output || Array(outputCount).fill(null);
  const outputSums = outputLayerHistory?.weighted_sums || Array(outputCount).fill(null);
  const outputWeights = outputLayerHistory?.weights || null;
  const outputBiases = outputLayerHistory?.biases || null;

  // Compute exact numerical substitution string for a selected hidden neuron j
  const getHiddenCalcDetails = (jIdx) => {
    if (!hiddenWeights || !hiddenBiases || !inputList) return null;
    const wCol = hiddenWeights.map(row => row[jIdx]);
    const biasVal = hiddenBiases[jIdx];
    const zVal = hiddenSums[jIdx];
    const aVal = hiddenOutputs[jIdx];

    const terms = inputList.map((x, iIdx) => {
      const w = wCol[iIdx];
      return `(${fmt(x)} × ${fmt(w)})`;
    });

    const substitutionStr = `z_${jIdx + 1} = ${terms.join(' + ')} + ${fmt(biasVal)}`;
    const resultStr = `z_${jIdx + 1} = ${fmt(zVal)},   a_${jIdx + 1} = ${hiddenActivation}(${fmt(zVal)}) = ${fmt(aVal)}`;

    return {
      title: `Hidden Neuron h_${jIdx + 1} Detailed Calculation`,
      whatIsHappening: `Neuron h_${jIdx + 1} computes the dot product of input vector x with its weight vector column W[:, ${jIdx + 1}], adds bias b_${jIdx + 1}, then applies activation ${hiddenActivation}.`,
      formula: `z_${jIdx + 1} = (∑_{i} x_i · W_{i, ${jIdx + 1}}) + b_${jIdx + 1}`,
      substitution: substitutionStr,
      result: resultStr,
      whyItMatters: `This single scalar activation a_${jIdx + 1} represents the extracted feature representation sent to the output layer.`
    };
  };

  // Compute numerical calculation string for selected output neuron k
  const getOutputCalcDetails = (kIdx) => {
    if (!outputWeights || !outputBiases || !hiddenOutputs) return null;
    const wCol = outputWeights.map(row => row[kIdx]);
    const biasVal = outputBiases[kIdx];
    const zVal = outputSums[kIdx];
    const yVal = finalOutputs[kIdx];

    const terms = hiddenOutputs.map((h, hIdx) => {
      const w = wCol[hIdx];
      const hStr = h !== null && h !== undefined ? fmt(h) : `h_${hIdx + 1}`;
      return `(${hStr} × ${fmt(w)})`;
    });

    const substitutionStr = `z_y = ${terms.join(' + ')} + ${fmt(biasVal)}`;
    const resultStr = `z_y = ${fmt(zVal)},   ŷ = act(${fmt(zVal)}) = ${fmt(yVal)}`;

    return {
      title: `Output Neuron ŷ_${kIdx + 1} Detailed Calculation`,
      whatIsHappening: `Output neuron ŷ_${kIdx + 1} receives activated hidden vector a, computes weighted sum z_y = a · W_out + b_out, then applies the final layer activation.`,
      formula: `z_y = (∑_{j} a_j · W_{j, output}) + b_out`,
      substitution: substitutionStr,
      result: resultStr,
      whyItMatters: `This final numerical scalar ŷ is the network's prediction for the current input vector.`
    };
  };

  const hiddenCalc = selectedNode.layer === 'hidden' ? getHiddenCalcDetails(selectedNode.index) : null;
  const outputCalc = selectedNode.layer === 'output' ? getOutputCalcDetails(selectedNode.index) : null;
  const activeCalc = hiddenCalc || outputCalc;

  const legend = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono">
      <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />Input (x)</span>
      <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />Hidden (h)</span>
      <span className="flex items-center gap-1 text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />Output (ŷ)</span>
    </div>
  );

  const layerTag = (text, cls) => (
    <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-1 rounded-md border text-center ${cls}`}>{text}</span>
  );

  const nodeBadge = (text, cls) => (
    <div className={`w-8 h-8 shrink-0 rounded-full font-mono text-xs font-bold flex items-center justify-center border ${cls}`}>{text}</div>
  );

  return (
    <div className="space-y-4 min-w-0">
      <Panel title="Network" subtitle="Select a neuron to inspect its calculation" actions={legend}>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-start min-h-[200px]">
          {/* Input */}
          <div className="flex flex-col items-center gap-3 min-w-0">
            {layerTag('Input', 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20')}
            <div className="space-y-2 w-full max-w-[9rem]">
              {inputList.map((val, idx) => (
                <div key={`in-${idx}`} className="bg-slate-950 border border-cyan-500/40 rounded-xl p-2 flex items-center justify-between gap-2 min-w-0">
                  {nodeBadge(<>x<sub>{idx + 1}</sub></>, 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30')}
                  <span className="font-mono text-xs font-bold text-white min-w-0 break-all text-right" title={String(val)}>
                    {typeof val === 'number' ? fmt(val) : val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden */}
          <div className="flex flex-col items-center gap-3 min-w-0">
            {layerTag('Hidden', 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20')}
            <div className="space-y-2 w-full max-w-[11rem]">
              {Array.from({ length: hiddenCount }).map((_, idx) => {
                const isSelected = selectedNode.layer === 'hidden' && selectedNode.index === idx;
                const outVal = hiddenOutputs[idx];
                const zVal = hiddenSums[idx];
                return (
                  <button
                    type="button"
                    key={`hid-${idx}`}
                    onClick={() => setSelectedNode({ layer: 'hidden', index: idx })}
                    className={`w-full text-left rounded-xl p-2 flex items-center justify-between gap-2 min-w-0 transition-colors border ${
                      isSelected ? 'bg-indigo-950 border-indigo-400 ring-2 ring-indigo-500/40' : 'bg-slate-950 border-indigo-500/30 hover:border-indigo-400/80'
                    }`}
                  >
                    {nodeBadge(<>h<sub>{idx + 1}</sub></>, 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30')}
                    <div className="text-right font-mono text-[10px] min-w-0">
                      <div className="text-slate-400 break-all">z = {fmt(zVal === null || zVal === undefined ? null : Number(zVal), 3).replace('N/A', '-')}</div>
                      <div className="text-indigo-300 font-bold break-all">a = {fmt(outVal === null || outVal === undefined ? null : Number(outVal), 3).replace('N/A', '-')}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col items-center gap-3 min-w-0">
            {layerTag('Output', 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')}
            <div className="space-y-2 w-full max-w-[9rem]">
              {Array.from({ length: outputCount }).map((_, idx) => {
                const isSelected = selectedNode.layer === 'output' && selectedNode.index === idx;
                const outVal = finalOutputs[idx];
                return (
                  <button
                    type="button"
                    key={`out-${idx}`}
                    onClick={() => setSelectedNode({ layer: 'output', index: idx })}
                    className={`w-full rounded-xl p-2 flex items-center justify-between gap-2 min-w-0 transition-colors border ${
                      isSelected ? 'bg-emerald-950 border-emerald-400 ring-2 ring-emerald-500/40' : 'bg-slate-950 border-emerald-500/30 hover:border-emerald-400/80'
                    }`}
                  >
                    {nodeBadge(<>ŷ<sub>{idx + 1}</sub></>, 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30')}
                    <span className="font-mono text-xs font-bold text-emerald-300 min-w-0 break-all text-right">
                      {outVal === null || outVal === undefined ? '-' : fmt(Number(outVal))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      {/* Dedicated inspector for the selected neuron */}
      {activeCalc ? (
        <FormulaCalcCard
          title={activeCalc.title}
          whatIsHappening={activeCalc.whatIsHappening}
          formula={activeCalc.formula}
          substitution={activeCalc.substitution}
          result={activeCalc.result}
          whyItMatters={activeCalc.whyItMatters}
          badgeText={selectedNode.layer === 'hidden' ? `Neuron h_${selectedNode.index + 1}` : `Output ŷ_${selectedNode.index + 1}`}
          color={selectedNode.layer === 'hidden' ? 'indigo' : 'emerald'}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500 font-mono">
          Train the network to see the selected neuron's calculation here.
        </div>
      )}
    </div>
  );
}
