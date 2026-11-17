import { Lock, Shield, UserCheck, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { loginRequest, setStoredToken } from '../lib/api';
import type { PublicUser } from '../types/league';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: PublicUser) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Administrador de Liga',
    sublabel: 'Control total de torneos, actas, puntos y auditoría',
    email: 'admin@ligasjds.ni',
    pass: 'AdminSJDS2026!',
    role: 'admin' as const,
  },
  {
    label: 'DT · Tiburones de San Juan (Liga Demo)',
    sublabel: 'Gestión exclusiva de Tiburones de San Juan en Liga Demo',
    email: 'dt.tiburones@ligasjds.ni',
    pass: 'Tiburones2026!',
    role: 'dt' as const,
  },
  {
    label: 'DT · Auxiliadora FC',
    sublabel: 'Gestión exclusiva de la plantilla y escudo de Auxiliadora FC',
    email: 'dt.equipo1@ligasjds.ni',
    pass: 'Equipo1SJDS!',
    role: 'dt' as const,
  },
  {
    label: 'DT · CEBADILLA FC',
    sublabel: 'Gestión exclusiva de la plantilla y escudo de CEBADILLA FC',
    email: 'dt.equipo2@ligasjds.ni',
    pass: 'Equipo2SJDS!',
    role: 'dt' as const,
  },
];

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const performLogin = async (targetEmail: string, targetPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await loginRequest(targetEmail, targetPass);
      setStoredToken(token);
      onSuccess(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void performLogin(email, password);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-xl border border-white/[0.12] bg-[#111114] text-[#F5F5F4] pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.08] bg-[#111114] px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-[#D4AF37] font-medium">Acceso privado por rol</p>
            <h2 id="auth-modal-title" className="font-display text-xl sm:text-2xl font-bold tracking-wide">
              Panel de DT y Administración
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de acceso"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-md border border-white/[0.1] bg-[#0D0D10] text-zinc-300 hover:text-white hover:border-white/25 transition-colors shrink-0 cursor-pointer touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Correo autorizado
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ligasjds.ni"
                className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3.5 py-2 text-sm text-[#F5F5F4] placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[42px] rounded-md border border-white/[0.12] bg-[#0D0D10] px-3.5 py-2 text-sm text-[#F5F5F4] placeholder:text-zinc-500 focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-rose-500/40 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-md bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#0A0A0A] hover:bg-[#E5C453] disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'Verificando...' : 'Iniciar sesión'}</span>
            </button>
          </form>

          {/* One-click Demo Accounts */}
          <div className="border-t border-white/[0.08] pt-5 space-y-3">
            <div>
              <p className="text-xs font-semibold text-zinc-200">
                Acceso rápido de demostración
              </p>
              <p className="text-xs text-zinc-400">
                Prueba los límites reales de cada rol validados por el servidor.
              </p>
            </div>

            <div className="divide-y divide-white/[0.07] rounded-lg border border-white/[0.08] bg-[#0D0D10] overflow-hidden">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={loading}
                  onClick={() => void performLogin(acc.email, acc.pass)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {acc.role === 'admin' ? (
                      <Shield className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#F5F5F4]">{acc.label}</div>
                      <div className="text-[11px] text-zinc-400 leading-snug">{acc.sublabel}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#D4AF37] shrink-0">Entrar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
