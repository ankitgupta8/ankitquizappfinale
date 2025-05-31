import { MathJaxContext, MathJax } from 'better-react-mathjax';

interface LatexRendererProps {
  content: string;
}

const config = {
  loader: { load: ["input/asciimath"] },
  asciimath: { displaystyle: true } // Use true for display math, false for inline
};

export function LatexRenderer({ content }: LatexRendererProps) {
  // AsciiMath uses backticks as delimiters by default.
  // We'll assume the content is already in AsciiMath format,
  // or simple text. MathJax component will handle the rendering.
  // If content is intended to be math, it should be wrapped in backticks.
  // For now, we'll just pass the content directly.
  // If specific logic is needed to differentiate math vs text,
  // this is where it would go.

  return (
    <MathJaxContext config={config}>
      <MathJax key={content} inline={!content.includes("\n")}>{content}</MathJax>
    </MathJaxContext>
  );
} 