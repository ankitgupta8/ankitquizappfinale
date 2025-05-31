import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexRendererProps {
  content: string;
  errorColor?: string;
  displayMode?: boolean;
  debug?: boolean;
}

// Common LaTeX error patterns and their fixes
const LATEX_FIXES = {
  // Fix common fraction issues
  'fracDeltaxx': '\\frac{\\Delta x}{x}',
  'fracDeltax': '\\frac{\\Delta x}{}',  // Missing denominator
  'times100': '\\times 100',
  'Delta': '\\Delta',
  'deltax': '\\delta x',
  'Deltax': '\\Delta x',
  
  // Fix missing spaces and operators
  'x100': 'x \\times 100',
  '*100': '\\times 100',
  '×100': '\\times 100',
  
  // Fix incomplete fractions
  'frac{': '\\frac{',
  'frac{}': '\\frac{1}{1}',  // Placeholder for empty fractions
  
  // Fix missing backslashes
  'frac': '\\frac',
  'sqrt': '\\sqrt',
  'sum': '\\sum',
  'int': '\\int',
  'lim': '\\lim',
  
  // Fix common Greek letters
  'alpha': '\\alpha',
  'beta': '\\beta',
  'gamma': '\\gamma',
  'delta': '\\delta',
  'epsilon': '\\epsilon',
  'theta': '\\theta',
  'lambda': '\\lambda',
  'mu': '\\mu',
  'pi': '\\pi',
  'sigma': '\\sigma',
  'phi': '\\phi',
  'psi': '\\psi',
  'omega': '\\omega',
};

function fixCommonLatexErrors(latex: string): string {
  if (!latex || typeof latex !== 'string') return latex;
  
  let fixed = latex;
  
  // Apply common fixes
  Object.entries(LATEX_FIXES).forEach(([error, fix]) => {
    // Use word boundaries to avoid partial replacements
    const regex = new RegExp(`\\b${error.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    fixed = fixed.replace(regex, fix);
  });
  
  // Fix fraction patterns specifically
  fixed = fixed.replace(/frac([A-Za-z]+)([A-Za-z]+)/g, '\\frac{$1}{$2}');
  fixed = fixed.replace(/frac\{([^}]*)\}([A-Za-z]+)/g, '\\frac{$1}{$2}');
  fixed = fixed.replace(/frac([A-Za-z]+)\{([^}]*)\}/g, '\\frac{$1}{$2}');
  
  // Fix incomplete fractions
  fixed = fixed.replace(/\\frac\{([^}]*)\}(?!\{)/g, '\\frac{$1}{1}');
  fixed = fixed.replace(/\\frac(?!\{)/g, '\\frac{1}{1}');
  
  // Fix missing braces around complex expressions
  fixed = fixed.replace(/\^([a-zA-Z0-9]+[+\-*/][a-zA-Z0-9]+)/g, '^{$1}');
  fixed = fixed.replace(/_([a-zA-Z0-9]+[+\-*/][a-zA-Z0-9]+)/g, '_{$1}');
  
  // Fix multiplication symbols
  fixed = fixed.replace(/\*|×/g, '\\times');
  fixed = fixed.replace(/\btimes(\d)/g, '\\times $1');
  
  return fixed;
}

function validateLatexSyntax(latex: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!latex) return { isValid: true, errors: [] };
  
  // Check for balanced braces
  let braceCount = 0;
  let inEscape = false;
  
  for (let i = 0; i < latex.length; i++) {
    const char = latex[i];
    const prevChar = i > 0 ? latex[i - 1] : '';
    
    if (prevChar === '\\') {
      inEscape = false;
      continue;
    }
    
    if (char === '\\') {
      inEscape = true;
      continue;
    }
    
    if (!inEscape) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      
      if (braceCount < 0) {
        errors.push(`Unmatched closing brace at position ${i}`);
        break;
      }
    }
    
    inEscape = false;
  }
  
  if (braceCount > 0) {
    errors.push(`${braceCount} unmatched opening brace(s)`);
  }
  
  // Check for incomplete commands
  const incompleteCommands = latex.match(/\\[a-zA-Z]+(?!\{|\s|$)/g);
  if (incompleteCommands) {
    errors.push(`Potentially incomplete commands: ${incompleteCommands.join(', ')}`);
  }
  
  // Check for empty fractions
  const emptyFractions = latex.match(/\\frac\{\s*\}\s*\{/g);
  if (emptyFractions) {
    errors.push('Empty fraction numerator found');
  }
  
  const emptyDenominators = latex.match(/\\frac\{[^}]*\}\s*\{\s*\}/g);
  if (emptyDenominators) {
    errors.push('Empty fraction denominator found');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function LatexRenderer({ 
  content, 
  errorColor = '#cc0000',
  displayMode = false,
  debug = false 
}: LatexRendererProps) {
  const latexPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:[^$\n]|\\.)*\$)/g;
  const parts = content.split(latexPattern);
  
  const renderLatexPart = (part: string, index: number) => {
    try {
      // Determine if this is a LaTeX part
      const isLatex = /^(\$|\\\[|\\\()/.test(part);
      
      if (!isLatex) {
        return <span key={index} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      }
      
      let latex = '';
      let isBlock = false;
      
      // Extract LaTeX content
      if (part.startsWith('$$') && part.endsWith('$$')) {
        latex = part.slice(2, -2).trim();
        isBlock = true;
      } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
        latex = part.slice(2, -2).trim();
        isBlock = true;
      } else if (part.startsWith('$') && part.endsWith('$')) {
        latex = part.slice(1, -1).trim();
        isBlock = false;
      } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
        latex = part.slice(2, -2).trim();
        isBlock = false;
      }
      
      if (!latex) {
        return <span key={index}>{part}</span>;
      }
      
      // Apply fixes
      const fixedLatex = fixCommonLatexErrors(latex);
      
      // Validate syntax
      const validation = validateLatexSyntax(fixedLatex);
      
      if (debug && !validation.isValid) {
        console.warn(`LaTeX validation errors for "${latex}":`, validation.errors);
      }
      
      // Render with error handling
      const MathComponent = isBlock ? BlockMath : InlineMath;
      
      return (
        <MathComponent
          key={index}
          math={fixedLatex}
          errorColor={errorColor}
          renderError={(error) => (
            <span 
              style={{ 
                color: errorColor, 
                fontFamily: 'monospace',
                backgroundColor: '#ffeeee',
                padding: '2px 4px',
                borderRadius: '3px',
                border: `1px solid ${errorColor}`,
                display: 'inline-block',
                margin: '2px'
              }}
              title={`Original: ${latex}\nFixed: ${fixedLatex}\nError: ${error.message}`}
            >
              ⚠️ LaTeX Error: {debug ? `${latex} → ${error.message}` : 'Invalid math'}
            </span>
          )}
        />
      );
      
    } catch (error) {
      console.error('LaTeX rendering error:', error);
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
          ⚠️ Math Error: {part}
        </span>
      );
    }
  };

  if (!content || typeof content !== 'string') {
    return <span></span>;
  }

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

// Utility function to test and fix LaTeX strings
export function testLatexString(latex: string): {
  original: string;
  fixed: string;
  isValid: boolean;
  errors: string[];
  preview: string;
} {
  const fixed = fixCommonLatexErrors(latex);
  const validation = validateLatexSyntax(fixed);
  
  return {
    original: latex,
    fixed,
    isValid: validation.isValid,
    errors: validation.errors,
    preview: validation.isValid ? `Renders as: $${fixed}$` : 'Will not render'
  };
}

// Example usage component
export function LatexTestComponent() {
  const problematicLatex = [
    'fracDeltaxx times100',
    'frac{Delta x}{x} times 100',
    'sqrt{x^2 + y^2',  // Missing closing brace
    'frac{a}{b times c',  // Missing closing brace
    'alpha + beta + gamma',  // Missing backslashes
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>LaTeX Error Testing</h2>
      {problematicLatex.map((latex, index) => {
        const test = testLatexString(latex);
        return (
          <div key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <div><strong>Original:</strong> {test.original}</div>
            <div><strong>Fixed:</strong> {test.fixed}</div>
            <div><strong>Valid:</strong> {test.isValid ? '✅' : '❌'}</div>
            {test.errors.length > 0 && (
              <div><strong>Errors:</strong> {test.errors.join(', ')}</div>
            )}
            <div><strong>Rendered:</strong></div>
            <LatexRenderer content={`$${test.original}$`} debug={true} />
          </div>
        );
      })}
    </div>
  );
}
