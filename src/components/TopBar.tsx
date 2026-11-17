import { Calendar, Home, ShieldAlert, Trophy, Users } from 'lucide-react';
import type { PublicUser } from '../types/league';

export type AppSection =
  | 'inicio'
  | 'partidos'
  | 'equipos'
  | 'tablas'
  | 'disciplina'
  | 'dt-panel'
  | 'admin-panel';

interface TopBarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  user: PublicUser | null;
  onOpenAuth: () => void;
}

const PUBLIC_NAV: Array<{ id: AppSection; label: string; icon: typeof Home }> = [
  { id: 'inicio', label: 'Inicio', icon: Home },
  { id: 'partidos', label: 'Partidos', icon: Calendar },
  { id: 'equipos', label: 'Equipos', icon: Users },
  { id: 'tablas', label: 'Tablas', icon: Trophy },
  { id: 'disciplina', label: 'Tarjetas', icon: ShieldAlert },
];

export function TopBar({ activeSection, onNavigate, user, onOpenAuth }: TopBarProps) {
  const handlePrimaryAction = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onNavigate(user.role === 'admin' ? 'admin-panel' : 'dt-panel');
  };

  const primaryLabel = !user
    ? 'Acceso'
    : user.role === 'admin'
      ? 'Panel Admin'
      : 'Panel DT';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#0A0A0A] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between gap-3 md:gap-8 px-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('inicio')}
            className="font-display text-xl md:text-2xl font-bold tracking-wide text-[#F5F5F4] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer touch-manipulation"
          >
            Liga San Juan del Sur
          </button>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium h-full"
          >
            {PUBLIC_NAV.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`relative h-full inline-flex items-center transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'text-[#D4AF37] font-semibold'
                      : 'text-zinc-400 hover:text-[#F5F5F4]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D4AF37]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className={`min-h-[38px] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer touch-manipulation ${
                activeSection === 'dt-panel' || activeSection === 'admin-panel'
                  ? 'bg-[#E5C453] text-[#0A0A0A]'
                  : 'bg-[#D4AF37] text-[#0A0A0A] hover:bg-[#E5C453]'
              }`}
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Thumb Navigation Bar */}
      <nav
        aria-label="Navegación móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.08] bg-[#0A0A0A]/98 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] grid grid-cols-5 items-center"
      >
        {PUBLIC_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] py-1.5 transition-colors cursor-pointer touch-manipulation ${
                isActive ? 'text-[#D4AF37]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 inset-x-3 h-[2px] bg-[#D4AF37]"
                />
              )}
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.75} />
              <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
