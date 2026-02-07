import React from 'react';

const PredictionCard = ({ prediction, onReset }) => {
  if (!prediction) return null;

  const getRiskLevel = (score) => {
    if (score < 0.3) return { level: 'Low Risk', color: 'green', emoji: '✅' };
    if (score < 0.7) return { level: 'Medium Risk', color: 'yellow', emoji: '⚠️' };
    return { level: 'High Risk', color: 'red', emoji: '🚨' };
  };

  const getRecommendedAction = (score) => {
    if (score < 0.3) return 'Approve Transaction';
    if (score < 0.7) return 'Verify Transaction';
    return 'Block Transaction';
  };

  const riskInfo = getRiskLevel(prediction.fraud_score);
  const recommendedAction = getRecommendedAction(prediction.fraud_score);

  const getRiskColor = (color) => {
    switch (color) {
      case 'green': return 'text-emerald-400 border-emerald-500';
      case 'yellow': return 'text-amber-400 border-amber-500';
      case 'red': return 'text-rose-400 border-rose-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getRiskBgColor = (color) => {
    switch (color) {
      case 'green': return 'bg-emerald-900/20 border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.2)]';
      case 'yellow': return 'bg-amber-900/20 border-amber-500/40 shadow-[0_0_20px_rgba(251,191,36,0.2)]';
      case 'red': return 'bg-rose-900/20 border-rose-500/40 shadow-[0_0_20px_rgba(248,113,113,0.2)]';
      default: return 'bg-gray-900/20 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-xl border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg border-2 ${getRiskBgColor(riskInfo.color)} ${getRiskColor(riskInfo.color)}`}>
          <div className="text-center">
            <div className="text-4xl mb-2">{riskInfo.emoji}</div>
            <div className="text-sm font-medium mb-1">Fraud Risk Score</div>
            <div className="text-3xl font-bold">
              {(prediction.fraud_score * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border-2 ${getRiskBgColor(riskInfo.color)} ${getRiskColor(riskInfo.color)}`}>
          <div className="text-center">
            <div className="text-4xl mb-2">{riskInfo.emoji}</div>
            <div className="text-sm font-medium mb-1">Risk Level</div>
            <div className="text-2xl font-bold">
              {riskInfo.level}
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg border-2 ${getRiskBgColor(riskInfo.color)} ${getRiskColor(riskInfo.color)}`}>
          <div className="text-center">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-sm font-medium mb-1">Recommended Action</div>
            <div className="text-xl font-bold">
              {recommendedAction}
            </div>
          </div>
        </div>
      </div>

      {prediction.explanations && prediction.explanations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Factors</h3>
          <div className="space-y-3">
            {prediction.explanations.map((explanation, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="text-2xl">🔍</div>
                <div className="text-gray-300">{explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prediction.confidence && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Model Confidence</h3>
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-[#3b9eff] to-[#a855f7] h-4 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(59,158,255,0.5)]"
                style={{ width: `${prediction.confidence * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-gray-300">
              {(prediction.confidence * 100).toFixed(1)}% Confidence
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-gray-300">
            <strong>Transparency Notice:</strong> This system provides probabilistic fraud risk scores.
            Final decisions should always be verified by users or analysts.
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gradient-to-r from-[#3b9eff] to-[#a855f7] hover:from-[#2b8eef] hover:to-[#9333ea] text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_30px_rgba(59,158,255,0.5)]"
        >
          Analyze Another Transaction
        </button>
      </div>
    </div>
  );
};

export default PredictionCard;