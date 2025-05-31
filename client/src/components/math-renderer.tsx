import { MathJax, MathJaxContext } from "better-react-mathjax";

interface MathRendererProps {
  content: string;
}

const config = {
  loader: { load: ["input/asciimath"] },
  asciimath: { displaystyle: false }
};

export function MathRenderer({ content }: MathRendererProps) {
  // Split the content into parts based on backtick delimiters
  const parts = content.split(/(`.*?`)/g);

  return (
    <MathJaxContext config={config}>
      <span>
        {parts.map((part, index) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return <MathJax key={index}>{part}</MathJax>;
          } else {
            return <span key={index}>{part}</span>;
          }
        })}
      </span>
    </MathJaxContext>
  );
} 