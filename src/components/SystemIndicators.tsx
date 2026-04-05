import { Battery, Cloud, Zap } from 'lucide-react';

interface SystemIndicatorsProps {
  ramBoosted: boolean;
  cloudUsedGb: number;
}

export function SystemIndicators({ ramBoosted, cloudUsedGb }: SystemIndicatorsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2">
        <Battery className="w-4 h-4 text-secondary shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">Batterie</p>
          <p className="text-xs font-semibold text-secondary leading-tight">Optimisée</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2">
        <Cloud className="w-4 h-4 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">Cloud</p>
          <p className="text-xs font-semibold text-primary leading-tight truncate">
            {(10010 - cloudUsedGb).toFixed(1)} Go
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-3 py-2">
        <Zap className={`w-4 h-4 shrink-0 ${ramBoosted ? 'text-secondary' : 'text-muted-foreground'}`} />
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">RAM</p>
          <p className={`text-xs font-semibold leading-tight ${ramBoosted ? 'text-secondary' : 'text-muted-foreground'}`}>
            {ramBoosted ? '+10 Go' : 'Standard'}
          </p>
        </div>
      </div>
    </div>
  );
}
