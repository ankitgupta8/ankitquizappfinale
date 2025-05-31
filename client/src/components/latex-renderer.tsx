import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  content: string;
}

export function LatexRenderer({ content }: LatexRendererProps) {
  // Split the content into parts based on LaTeX delimiters
  const parts = content.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display mode LaTeX (centered, block-level)
          const latex = part.slice(2, -2);
          return <BlockMath key={index} math={latex} />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          // Inline mode LaTeX
          const latex = part.slice(1, -1);
          return <InlineMath key={index} math={latex} />;
        } else {
          // Regular text
          return <span key={index}>{part}</span>;
        }
      })}
    </span>
  );
} 