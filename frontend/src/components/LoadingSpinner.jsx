import { useState, useEffect } from 'react';
import { Loader2, Globe, Code2, Cpu, BarChart3 } from 'lucide-react';

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
      <div className="relative mb-8 text-primary">
        <Loader2 size={64} className="animate-spin" />
      </div>

      {/* Title */}
      <p className="text-lg font-bold text-foreground mb-2 tracking-tight">
        Analyzing for Dark Patterns
      </p>
      <p className="text-xs font-medium text-muted-foreground mb-8">This may take a few seconds...</p>

      {/* Pipeline steps */}
      <div className="relative space-y-0 w-64">
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = step.icon;
          const status = i < activeStep ? 'completed' : i === activeStep ? 'active' : 'pending';

          return (
            <div key={i} className="relative">
              <div className={`py-3 flex items-center gap-3 rounded-xl px-2 ${status === 'active' ? 'opacity-100' : 'opacity-60'}`}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      status === 'active' ? 'var(--primary)' :
                      status === 'completed' ? 'var(--muted)' :
                      'var(--muted)',
                    transition: 'background-color 0.4s ease',
                  }}
                >
                  <Icon
                    size={14}
                    style={{
                      color:
                        status === 'active' ? 'var(--primary-foreground)' :
                        status === 'completed' ? 'var(--primary)' :
                        'var(--muted-foreground)',
                      transition: 'color 0.4s ease',
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{
                    color:
                      status === 'active' ? 'var(--primary)' :
                      status === 'completed' ? 'var(--foreground)' :
                      'var(--muted-foreground)',
                    transition: 'color 0.4s ease',
                  }}>
                    {step.label}
                  </p>
                  <p className="text-xs font-medium" style={{
                    color: status === 'active' ? 'var(--primary)' : 'var(--muted-foreground)',
                    transition: 'color 0.4s ease',
                  }}>
                    {status === 'completed' ? 'Done' : step.sublabel}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className="ml-[19px] w-0.5 h-3"
                  style={{
                    backgroundColor:
                      i < activeStep ? 'var(--primary)' :
                      'var(--border)',
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
