import { Fragment, type ReactNode } from 'react';

/**
 * Renders editor text with two light conventions:
 *   *words*  → gold italic serif accent
 *   new line → <br>
 * plus optional {tokens} replaced by React nodes (e.g. {count}).
 */
export function Rich({ text, tokens = {} }: { text: string; tokens?: Record<string, ReactNode> }) {
  const lines = (text || '').split(/\r?\n/);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line.split(/(\*[^*]+\*|\{\w+\})/g).map((part, j) => {
            if (!part) return null;
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
              return <span key={j} className="serif">{part.slice(1, -1)}</span>;
            const tok = part.match(/^\{(\w+)\}$/);
            if (tok && tok[1] in tokens) return <Fragment key={j}>{tokens[tok[1]]}</Fragment>;
            return <Fragment key={j}>{part}</Fragment>;
          })}
        </Fragment>
      ))}
    </>
  );
}

/** Plain-text version for alt text / aria labels. */
export const plain = (text: string) => (text || '').replace(/\*/g, '').replace(/\s*\n\s*/g, ' ');
