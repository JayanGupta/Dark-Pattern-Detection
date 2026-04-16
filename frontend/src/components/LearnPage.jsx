import { ShieldAlert, Clock, EyeOff, Users, RotateCcw, AlertTriangle, DollarSign, MousePointerClick, ShieldCheck, CheckSquare, Search } from 'lucide-react';

export default function LearnPage() {
  const categories = [
    {
      name: "Urgency / Scarcity",
      icon: Clock,
      color: "var(--chart-1)",
      desc: "Creating fake time limits or low stock warnings to pressure you into buying immediately.",
      example: '"Only 2 items left in stock!" or a ticking countdown timer for a sale that resets daily.',
      image: "/images/dp_urgency.png",
      delay: 0.1
    },
    {
      name: "Hidden Costs",
      icon: DollarSign,
      color: "var(--primary)",
      desc: "Adding unexpected fees, handling charges, or mandatory extras at the very last step of checkout.",
      example: "A $40 concert ticket becoming $65 after 'service fees' are added right before payment.",
      image: "/images/dp_hidden_costs.png",
      delay: 0.15
    },
    {
      name: "Misdirection",
      icon: EyeOff,
      color: "var(--chart-2)",
      desc: "Using design elements to draw your attention away from what you actually want to do.",
      example: "Making a 'Cancel Subscription' button small and gray, while 'Keep Subscription' is huge and brightly colored.",
      image: "/images/dp_misdirection.png",
      delay: 0.2
    },
    {
      name: "Social Proof",
      icon: Users,
      color: "var(--chart-3)",
      desc: "Using fake or misleading notifications about other users' activity to create FOMO (Fear Of Missing Out).",
      example: '"50 people are looking at this hotel right now!" (When in reality, it is just a random number).',
      delay: 0.25
    },
    {
      name: "Forced Continuity",
      icon: RotateCcw,
      color: "var(--chart-4)",
      desc: "Making it extremely easy to sign up for a free trial, but nearly impossible to cancel.",
      example: "Having to call a customer service number during specific hours just to cancel a digital subscription.",
      delay: 0.3
    },
    {
      name: "Confirm-shaming",
      icon: AlertTriangle,
      color: "var(--chart-5)",
      desc: "Guilt-tripping you into opting into something (like a newsletter) by making the decline option sound bad.",
      example: "A popup asking you to subscribe for a discount, with the 'No' button saying 'No thanks, I hate saving money.'",
      delay: 0.35
    },
    {
      name: "Disguised Ads",
      icon: MousePointerClick,
      color: "var(--accent)",
      desc: "Advertisements that are intentionally designed to look like organic content or system navigation.",
      example: "A large 'Download Now' button that actually installs malware instead of the software you wanted.",
      delay: 0.4
    }
  ];

  const safetyTips = [
    { icon: Search, title: "Read Before Clicking", desc: "Don't just click the biggest, brightest button. Read the text carefully." },
    { icon: CheckSquare, title: "Check Checkboxes", desc: "Look out for pre-checked boxes signing you up for newsletters or extras." },
    { icon: Clock, title: "Ignore Fake Urgency", desc: "Take your time. Most 'limited time' offers are fake or will return soon." },
    { icon: DollarSign, title: "Review Total Cost", desc: "Always check the final price at checkout before entering payment details." },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-5">
          <ShieldAlert size={14} />
          Educational Guide
        </div>
        <h2 className="text-4xl font-extrabold text-foreground mb-4 tracking-tight">
          What are <span className="text-primary italic font-serif">Dark Patterns?</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed font-medium">
          Dark patterns are manipulative design tactics used in websites and apps to trick you into doing things you didn't mean to, like buying extra items or signing up for recurring subscriptions.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className={`bg-card text-card-foreground border border-border shadow-sm rounded-xl overflow-hidden ${cat.image ? "md:col-span-2 flex flex-col md:flex-row" : "flex flex-col"}`}>
              
              {/* Image Section (if available) */}
              {cat.image && (
                <div className="w-full md:w-1/2 min-h-[200px] md:min-h-full bg-muted relative overflow-hidden border-b md:border-b-0 md:border-r border-border">
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-transparent to-card z-10 opacity-60"></div>
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover opacity-80" />
                </div>
              )}

              {/* Content Section */}
              <div className={`p-6 flex-1 flex flex-col justify-center`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-muted border border-border" style={{ color: cat.color }}>
                    <Icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{cat.name}</h3>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-medium">
                  {cat.desc}
                </p>
                
                <div className="mt-auto pt-4 border-t border-border bg-muted/30 -mx-6 -mb-6 p-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Real World Example</p>
                  <p className="text-sm text-foreground font-mono italic">
                    {cat.example}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Tips */}
      <div className="relative rounded-3xl p-[1px] overflow-hidden mb-12">
        <div className="relative bg-card rounded-3xl p-8 md:p-12 border border-border shadow-sm">
          <div className="text-center mb-10">
            <ShieldCheck size={40} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">How to Stay Safe</h3>
            <p className="text-sm text-muted-foreground font-medium">Practical tips to protect yourself from manipulative designs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {safetyTips.map((tip, idx) => {
              const TipIcon = tip.icon;
              return (
                <div key={idx} className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors">
                  <div className="mt-0.5 shrink-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <TipIcon size={18} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">{tip.title}</h4>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
