import { useState } from 'react';
import {
  Settings as SettingsIcon, Star, Info, MessageCircle, Music, Shield, ChevronRight, X,
  Volume2, Bass, Gauge, FileText, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

const APP_VERSION = '2.5.0';

export function Settings({ open, onClose }: SettingsProps) {
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [bassBoost, setBassBoost] = useState(() => Number(localStorage.getItem('lomba_bass') || 50));
  const [treble, setTreble] = useState(() => Number(localStorage.getItem('lomba_treble') || 50));
  const [loudness, setLoudness] = useState(() => localStorage.getItem('lomba_loudness') === '1');

  if (!open) return null;

  const saveBass = (v: number[]) => { setBassBoost(v[0]); localStorage.setItem('lomba_bass', String(v[0])); };
  const saveTreble = (v: number[]) => { setTreble(v[0]); localStorage.setItem('lomba_treble', String(v[0])); };
  const toggleLoudness = (v: boolean) => { setLoudness(v); localStorage.setItem('lomba_loudness', v ? '1' : '0'); };

  const menuItems = [
    {
      icon: <Star className="w-5 h-5 text-yellow-500" />,
      label: 'Noter l\'application',
      sub: 'Donnez votre avis ⭐',
      action: () => window.open('https://lomba-drive.lovable.app', '_blank'),
    },
    {
      icon: <Music className="w-5 h-5 text-primary" />,
      label: 'Égaliseur & Bass Boost',
      sub: 'Optimisez votre son',
      action: () => setShowEqualizer(true),
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-green-500" />,
      label: 'Besoin d\'aide',
      sub: 'Contactez-nous sur WhatsApp',
      action: () => window.open('https://wa.me/221782193606', '_blank'),
    },
    {
      icon: <Info className="w-5 h-5 text-blue-400" />,
      label: 'À propos',
      sub: 'Info de l\'application',
      action: () => setShowAbout(true),
    },
    {
      icon: <FileText className="w-5 h-5 text-muted-foreground" />,
      label: 'Politique de confidentialité',
      sub: 'Vos données sont protégées',
      action: () => setShowPrivacy(true),
    },
  ];

  // Sub-panels
  if (showEqualizer) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" /> Égaliseur
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowEqualizer(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-primary" /> Bass Boost
                  </span>
                  <span className="text-xs text-muted-foreground">{bassBoost}%</span>
                </div>
                <Slider value={[bassBoost]} onValueChange={saveBass} max={100} step={1} className="[&>span>span]:bg-primary" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-secondary" /> Aigus (Treble)
                  </span>
                  <span className="text-xs text-muted-foreground">{treble}%</span>
                </div>
                <Slider value={[treble]} onValueChange={saveTreble} max={100} step={1} className="[&>span>span]:bg-secondary" />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-yellow-500" /> Loudness
                </span>
                <Switch checked={loudness} onCheckedChange={toggleLoudness} />
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground">
            Les réglages sont sauvegardés automatiquement.
          </p>
        </div>
      </div>
    );
  }

  if (showAbout) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">À propos</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowAbout(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4 text-center">
              <img src="/lomba-icon-512.png" alt="Lomba Drive" className="w-20 h-20 mx-auto rounded-2xl" />
              <h3 className="text-xl font-bold">Lomba Drive</h3>
              <p className="text-sm text-muted-foreground">
                Application de stockage cloud virtuel avec 10 010 Go d'espace sécurisé, 
                lecteur multimédia intégré et boost de RAM virtuelle.
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Version</p>
                  <p className="font-semibold">{APP_VERSION}</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Stockage</p>
                  <p className="font-semibold">10 010 Go</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">RAM Virtuelle</p>
                  <p className="font-semibold">10 Go</p>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Sécurité</p>
                  <p className="font-semibold">AES-256</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2">
                © 2026 Lomba Drive. Tous droits réservés.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showPrivacy) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
        <div className="max-w-lg mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Politique de confidentialité</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowPrivacy(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">Protection de vos données</p>
              <p>
                Lomba Drive s'engage à protéger la vie privée de ses utilisateurs. 
                Vos fichiers sont stockés de manière sécurisée et chiffrée sur nos serveurs cloud.
              </p>
              <p className="font-semibold text-foreground">Données collectées</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Adresse email (pour l'authentification)</li>
                <li>Localisation approximative (pour la sécurité du compte)</li>
                <li>Fichiers que vous choisissez de stocker</li>
              </ul>
              <p className="font-semibold text-foreground">Utilisation des données</p>
              <p>
                Vos données ne sont jamais vendues ni partagées avec des tiers. 
                Elles sont utilisées uniquement pour fournir le service Lomba Drive.
              </p>
              <p className="font-semibold text-foreground">Sécurité</p>
              <p>
                Tous les transferts sont chiffrés via TLS/SSL. Les fichiers sont stockés 
                avec un chiffrement AES-256 au repos.
              </p>
              <p className="font-semibold text-foreground">Contact</p>
              <p>
                Pour toute question, contactez-nous sur WhatsApp : +221 78 219 36 06
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" /> Paramètres
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <Card
              key={i}
              className="bg-card border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={item.action}
            >
              <CardContent className="p-4 flex items-center gap-3">
                {item.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">
            Lomba Drive v{APP_VERSION}
          </p>
        </div>
      </div>
    </div>
  );
}
