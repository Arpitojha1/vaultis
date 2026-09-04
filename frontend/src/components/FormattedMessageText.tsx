import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface FormattedMessageTextProps {
  text: string;
}

/**
 * Parses message text and renders any "[FILTERED - NOT DISCLOSED: ...]"
 * or "[FILTERED - NOT DISCLOSED]" blocks as visually distinct, eye-catching
 * legal redaction tags with security locks and clearance warnings.
 */
export const FormattedMessageText: React.FC<FormattedMessageTextProps> = ({ text }) => {
  // Regex matches [FILTERED - NOT DISCLOSED: description] or [FILTERED - NOT DISCLOSED]
  const pattern = /(\[FILTERED - NOT DISCLOSED(?::\s*[^\]]+)?\])/g;
  const parts = text.split(pattern);

  return (
    <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans space-y-1 text-slate-900 dark:text-slate-200">
      {parts.map((part, index) => {
        if (!part) return null;

        if (part.startsWith('[FILTERED - NOT DISCLOSED') && part.endsWith(']')) {
          // Extract details if present
          const content = part.slice(1, -1); // remove [ and ]
          const colonIndex = content.indexOf(':');
          const description = colonIndex !== -1 ? content.slice(colonIndex + 1).trim() : null;

          return (
            <span
              key={index}
              className="inline-flex flex-wrap items-center gap-1.5 px-2 py-0.5 mx-1 my-0.5 rounded-md bg-rose-100/90 border border-rose-300 text-rose-950 dark:bg-rose-900/40 dark:border-rose-800/50 dark:text-rose-200 font-mono text-[11px] font-bold shadow-2xs select-none transition-all hover:bg-rose-200/90 dark:hover:bg-rose-900/60"
              title="Protected by Vaultis RBAC Gateway under court seal / Rule 16 Protective Order"
            >
              <span className="flex items-center space-x-1 text-rose-700 dark:text-rose-400">
                <Lock className="w-3 h-3 text-rose-600 dark:text-rose-500 shrink-0" />
                <span className="bg-rose-700 text-white dark:bg-rose-600 dark:text-white text-[9px] font-extrabold px-1 py-0.2 rounded uppercase tracking-wider">
                  FILTERED - NOT DISCLOSED
                </span>
              </span>
              {description && (
                <span className="text-slate-900 dark:text-slate-300 font-sans font-semibold text-[11px] underline decoration-rose-300 dark:decoration-rose-700 decoration-1 underline-offset-2">
                  {description}
                </span>
              )}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};
