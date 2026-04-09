import React from 'react';

const TERM_REGEX = /(Cortex Cloud|Cortex Operations|Cortex XSIAM|Cortex XSOAR|Cortex XDR|Cortex|XDR|XSOAR|XSIAM)/gi;
const TERM_CLASS = 'text-[#6BD348]';

type AccentTermsProps = {
  text: string;
  className?: string;
};

export function AccentTerms({ text, className }: AccentTermsProps) {
  const parts = text.split(TERM_REGEX);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.match(TERM_REGEX)) {
          return (
            <span key={`${part}-${index}`} className={TERM_CLASS}>
              {part}
            </span>
          );
        }

        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
      })}
    </span>
  );
}
