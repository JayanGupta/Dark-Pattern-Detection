import { useState, useEffect } from 'react';
import { ShieldAlert, Globe, Code2, Cpu, BarChart3 } from 'lucide-react';

const PIPELINE_STEPS = [
  { label: 'Connecting', sublabel: 'Fetching page content...', icon: Globe, duration: 2000 },
  { label: 'Extracting', sublabel: 'Parsing text segments...', icon: Code2, duration: 2500 },
  { label: 'Classifying', sublabel: 'Running DistilBERT model...', icon: Cpu, duration: 3000 },
  { label: 'Scoring', sublabel: 'Computing severity scores...', icon: BarChart3, duration: 1500 },
];

export default function LoadingSpinner() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let stepIdx = 0;
    const advanceStep = () => {
      stepIdx++;
      if (stepIdx < PIPELINE_STEPS.length) {
        setActiveStep(stepIdx);
        setTimeout(advanceStep, PIPELINE_STEPS[stepIdx].duration);
      }
    };
    setTimeout(advanceStep, PIPELINE_STEPS[0].duration);
    return () => {};
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Central scanner animation */}
      <div className="relative w-28 h-28 mb-8">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/20"
          style={{ animation: 'rotate 8s linear infinite' }}
        />
        {/* Spinning ring 1 */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: 'rgba(99, 102, 241, 0.7)',
            borderRightColor: 'rgba(139, 92, 246, 0.3)',
            animation: 'rotate 1.2s linear infinite',
          }}
        />
        {/* Spinning ring 2 */}
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: 'rgba(168, 85, 247, 0.6)',
            borderLeftColor: 'rgba(139, 92, 246, 0.2)',
            animation: 'rotate 1.8s linear infinite reverse',
          }}
        />
        {/* Spinning ring 3 */}
        <div
          className="absolute inset-4 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: 'rgba(192, 132, 252, 0.5)',
            animation: 'rotate 2.5s linear infinite',
          }}
        />
        {/* Pulsing glow */}
        <div className="absolute inset-4 rounded-full bg-indigo-500/5 animate-pulse" />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldAlert size={26} className="text-indigo-400 animate-glow-pulse" />
        </div>
      </div>

      {/* Title */}
      <p className="text-lg font-semibold text-slate-200 mb-2 tracking-tight">
        Analyzing for Dark Patterns
      </p>
      <p className="text-xs text-slate-500 mb-8">This may take a few seconds...</p>

      {/* Pipeline steps */}
      <div className="relative space-y-0 w-64">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const status = i < activeStep ? 'completed' : i === activeStep ? 'active' : 'pending';

          return (
            <div key={i} className="relative">
              <div className={`pipeline-step ${status} py-3 flex items-center gap-3 rounded-xl px-2`}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      status === 'active' ? 'rgba(139, 92, 246, 0.15)' :
                      status === 'completed' ? 'rgba(34, 197, 94, 0.1)' :
                      'rgba(255, 255, 255, 0.03)',
                    transition: 'background-color 0.4s ease',
                  }}
                >
                  <Icon
                    size={14}
                    style={{
                      color:
                        status === 'active' ? '#a78bfa' :
                        status === 'completed' ? '#22c55e' :
                        '#475569',
                      transition: 'color 0.4s ease',
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{
                    color:
                      status === 'active' ? '#e2e8f0' :
                      status === 'completed' ? '#94a3b8' :
                      '#475569',
                    transition: 'color 0.4s ease',
                  }}>
                    {step.label}
                  </p>
                  <p className="text-[10px]" style={{
                    color:
                      status === 'active' ? '#8b5cf6' :
                      status === 'completed' ? '#64748b' :
                      '#334155',
                    transition: 'color 0.4s ease',
                  }}>
                    {status === 'completed' ? 'Done' : step.sublabel}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className="ml-[19px] w-0.5 h-2"
                  style={{
                    backgroundColor:
                      i < activeStep ? 'rgba(34, 197, 94, 0.3)' :
                      i === activeStep ? 'rgba(139, 92, 246, 0.3)' :
                      'rgba(255, 255, 255, 0.05)',
                    transition: 'background-color 0.4s ease',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
