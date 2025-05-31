import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  content: string;
  errorColor?: string;
  displayMode?: boolean;
}

export function LatexRenderer({ 
  content, 
  errorColor = '#cc0000',
  displayMode = false 
}: LatexRendererProps) {
  // More robust regex that handles nested delimiters and escaped characters
  const latexPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:[^$\n]|\\.)*\$)/g;
  
  const parts = content.split(latexPattern);
  
  const renderLatexPart = (part: string, index: number) => {
    try {
      // Block math patterns
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2).trim();
        if (latex.length === 0) return <span key={index}>$$$$</span>;
        return (
          <BlockMath 
            key={index} 
            math={latex}
            errorColor={errorColor}
            renderError={(error) => (
              <span style={{ color: errorColor, fontFamily: 'monospace' }}>
                LaTeX Error: {error.message}
              </span>
            )}
          />
        );
      }
      
      // Alternative block math syntax \[ ... \]
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const latex = part.slice(2, -2).trim();
        if (latex.length === 0) return <span key={index}>{part}</span>;
        return (
          <BlockMath 
            key={index} 
            math={latex}
            errorColor={errorColor}
            renderError={(error) => (
              <span style={{ color: errorColor, fontFamily: 'monospace' }}>
                LaTeX Error: {error.message}
              </span>
            )}
          />
        );
      }
      
      // Inline math patterns
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const latex = part.slice(1, -1).trim();
        if (latex.length === 0) return <span key={index}>$$</span>;
        
        // Check for common problematic patterns
        if (latex.includes('$$')) {
          return <span key={index}>{part}</span>; // Don't render nested $$
        }
        
        return (
          <InlineMath 
            key={index} 
            math={latex}
            errorColor={errorColor}
            renderError={(error) => (
              <span style={{ color: errorColor, fontFamily: 'monospace' }}>
                LaTeX Error: {error.message}
              </span>
            )}
          />
        );
      }
      
      // Alternative inline math syntax \( ... \)
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const latex = part.slice(2, -2).trim();
        if (latex.length === 0) return <span key={index}>{part}</span>;
        return (
          <InlineMath 
            key={index} 
            math={latex}
            errorColor={errorColor}
            renderError={(error) => (
              <span style={{ color: errorColor, fontFamily: 'monospace' }}>
                LaTeX Error: {error.message}
              </span>
            )}
          />
        );
      }
      
      // Regular text - preserve whitespace and line breaks
      return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      
    } catch (error) {
      // Fallback error handling
      console.warn('LaTeX rendering error:', error);
      return (
        <span 
          key={index} 
          style={{ 
            color: errorColor, 
            fontFamily: 'monospace',
            backgroundColor: '#ffeeee',
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          LaTeX Error: {part}
        </span>
      );
    }
  };

  // Handle edge cases
  if (!content || typeof content !== 'string') {
    return <span></span>;
  }

  // Clean up the content - remove null/undefined parts
  const cleanParts = parts.filter(part => part != null);
  
  if (cleanParts.length === 0) {
    return <span></span>;
  }

  return (
    <span>
      {cleanParts.map(renderLatexPart)}
    </span>
  );
}

// Utility function to validate LaTeX before rendering
export function isValidLatex(latex: string): boolean {
  try {
    // Basic validation checks
    if (!latex || typeof latex !== 'string') return false;
    
    // Check for balanced braces
    let braceCount = 0;
    let inCommand = false;
    
    for (let i = 0; i < latex.length; i++) {
      const char = latex[i];
      const prevChar = i > 0 ? latex[i - 1] : '';
      
      if (char === '\\' && prevChar !== '\\') {
        inCommand = true;
        continue;
      }
      
      if (inCommand && /[a-zA-Z]/.test(char)) {
        continue;
      }
      
      inCommand = false;
      
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      
      if (braceCount < 0) return false; // More closing than opening braces
    }
    
    return braceCount === 0; // Balanced braces
  } catch {
    return false;
  }
}

// Enhanced version with preprocessing
export function LatexRendererWithPreprocessing({ 
  content, 
  errorColor = '#cc0000' 
}: LatexRendererProps) {
  // Preprocess content to handle common issues
  const preprocessedContent = content
    // Fix common spacing issues around math delimiters
    .replace(/\s*\$\$\s*/g, '$$')
    .replace(/\s*\$\s*/g, '$')
    // Handle escaped dollar signs
    .replace(/\\\$/g, '\\text{$}')
    // Fix common newline issues in block math
    .replace(/\$\$\s*\n\s*/g, '$$')
    .replace(/\s*\n\s*\$\$/g, '$$');

  return (
    <LatexRenderer 
      content={preprocessedContent} 
      errorColor={errorColor}
    />
  );
}
