import { MathJax } from 'better-react-mathjax';

interface LatexRendererProps {
  content: string;
}

export function LatexRenderer({ content }: LatexRendererProps) {
  return (
    <MathJax key={content} inline={!content.includes("\n") && !content.startsWith("`") && !content.endsWith("`")}>{content}</MathJax>
  );
} 