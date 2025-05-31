import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useEffect, useState } from "react";

interface MathRendererProps {
  content: string;
}

const config = {
  loader: { load: ["input/asciimath"] },
  asciimath: { displaystyle: false },
  startup: {
    typeset: true,
    ready: () => {
      console.log("MathJax is loaded and ready!");
    },
  },
  tex: {
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
  },
  options: {
    enableMenu: false,
    renderActions: {
      addMenu: [],
      checkLoading: [],
    },
    processing: { delay: 0 },
  },
};

export function MathRenderer({ content }: MathRendererProps) {
  const [key, setKey] = useState(0);
  const [processedContent, setProcessedContent] = useState<string[]>([]);

  useEffect(() => {
    // Process content whenever it changes
    const parts = content.split(/(`.*?`)/g);
    setProcessedContent(parts);
    // Force re-render of MathJax
    setKey(prev => prev + 1);
  }, [content]);

  return (
    <MathJaxContext config={config}>
      <span key={key} className="math-content">
        {processedContent.map((part, index) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <MathJax 
                key={`${index}-${key}`}
                dynamic
                hideUntilTypeset="first"
              >
                {part}
              </MathJax>
            );
          } else {
            return <span key={`${index}-${key}`}>{part}</span>;
          }
        })}
      </span>
    </MathJaxContext>
  );
}
