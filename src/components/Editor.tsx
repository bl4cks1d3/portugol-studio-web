
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

import { SyntaxError } from '../interpreter/SyntaxAnalyzer';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  syntaxErrors?: SyntaxError[];
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, syntaxErrors = [] }) => {
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
  };

  const getErrorForLine = (lineNum: number) => {
    return syntaxErrors.find(e => e.line === lineNum);
  };

  return (
    <div className="relative h-full font-mono text-sm overflow-auto bg-[#1e1e1e] rounded-lg border border-white/10 shadow-2xl flex">
      {/* Line Numbers */}
      <div className="py-[20px] px-1 md:px-2 text-right bg-[#1a1a1a] border-r border-white/5 text-gray-600 select-none min-w-[3rem] md:min-w-[3.5rem]">
        {code.split('\n').map((_, i) => {
          const error = getErrorForLine(i + 1);
          return (
            <div key={i} className="leading-[1.5] text-[10px] md:text-xs flex items-center justify-end gap-1 group relative">
              {error && (
                <div 
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${error.severity === 'error' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]'}`}
                  title={error.message}
                />
              )}
              <span className={error ? (error.severity === 'error' ? 'text-red-400/50' : 'text-yellow-400/50') : ''}>
                {i + 1}
              </span>
              
              {/* Tooltip on hover */}
              {error && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded border border-white/10 whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
                  {error.message}
                </div>
              )}
            </div>
          );
        })}
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
