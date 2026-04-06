import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface MatriculePopupProps {
  matricule: string;
  onDone: () => void;
}

export const MatriculePopup = ({ matricule, onDone }: MatriculePopupProps) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3 shadow-2xl max-w-xs mx-4">
        <Shield className="w-12 h-12 text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Votre numéro de matricule</p>
        <p className="text-3xl font-bold text-primary tracking-wider">{matricule}</p>
        <p className="text-xs text-muted-foreground">Conservez ce numéro précieusement</p>
      </div>
    </div>
  );
};
