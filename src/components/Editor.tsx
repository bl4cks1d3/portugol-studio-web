
import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import '../lib/portugol-prism';
import 'prismjs/themes/prism-tomorrow.css';

const KEYWORDS = [
  'Algoritmo', 'fimalgoritmo', 'declare', 'inteiro', 'real', 'literal', 'logico',
  'escreva', 'leia', 'se', 'entao', 'senao', 'fimse', 'enquanto', 'fimenquanto',
  'para', 'fimpara', 'faca', 'escolha', 'caso', 'caso contrario', 'fimescolha',
  'verdadeiro', 'falso', 'resto', 'raizquadrada', 'potencia', 'abs', 'trunca',
  'seno', 'sen', 'cosseno', 'tangente'
];

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleValueChange = (newCode: string) => {
    onChange(newCode);
    
    // Simple autocomplete logic
    const lines = newCode.split('\n');
    // This is a very basic implementation, ideally we'd use a more robust editor for this
  };

  return (
    <div className="relative h-full font-mono text-sm overflow-auto bg-[#1e1e1e] rounded-lg border border-white/10 shadow-2xl flex">
      {/* Line Numbers */}
      <div className="py-[20px] px-2 md:px-3 text-right bg-[#1a1a1a] border-r border-white/5 text-gray-600 select-none min-w-[2.5rem] md:min-w-[3rem]">
        {code.split('\n').map((_, i) => (
          <div key={i} className="leading-[1.5] text-[10px] md:text-xs">{i + 1}</div>
        ))}
      </div>
      
      <div className="flex-1 relative">
        <Editor
          value={code}
          onValueChange={handleValueChange}
          highlight={(code) => Prism.highlight(code, Prism.languages.portugol, 'portugol')}
          padding={isMobile ? 10 : 20}
          className="min-h-full"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: isMobile ? 12 : 14,
            backgroundColor: 'transparent',
            color: '#d4d4d4',
            lineHeight: '1.5',
          }}
        />
        
        {/* Keywords Helper */}
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-2 max-w-xs opacity-20 hover:opacity-100 transition-opacity pointer-events-none">
          {KEYWORDS.slice(0, 8).map(k => (
            <span key={k} className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-gray-500 border border-white/5">{k}</span>
          ))}
        </div>
      </div>
    </div>
  );
};
