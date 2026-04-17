
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
  debugLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, syntaxErrors = [], debugLine = null }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    if (e.key === 'Tab') {
      e.preventDefault();
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // Find the start of the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      // Get current indentation
      const indentationMatch = currentLine.match(/^\s*/);
      let indentation = indentationMatch ? indentationMatch[0] : '';
      
      // Check if we should increase indentation
      const trimmedLine = currentLine.trim().toLowerCase();
      
      // Keywords that open a block
      const opensBlock = 
        trimmedLine.endsWith('entao') || 
        trimmedLine.endsWith('faca') || 
        trimmedLine.startsWith('escolha') || 
        trimmedLine.startsWith('caso') || 
        trimmedLine.startsWith('senao') ||
        trimmedLine.startsWith('algoritmo') ||
        trimmedLine.startsWith('declare');

      if (opensBlock) {
        indentation += '  ';
      }

      // Insert newline + indentation
      const newValue = value.substring(0, start) + '\n' + indentation + value.substring(end);
      onChange(newValue);

      // Set cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indentation.length;
      }, 0);
    }
  };

  const fontSize = isMobile ? 12 : 14;
  const padding = isMobile ? 10 : 20;

  return (
    <div className="relative h-full font-mono text-sm bg-[#1e1e1e] rounded-lg border border-white/10 shadow-2xl flex overflow-hidden">
      {/* Line Numbers - Fixed horizontally, scrolls vertically with editor */}
      <div 
        className="text-right bg-[#1a1a1a] border-r border-white/5 text-gray-600 select-none min-w-[3rem] md:min-w-[3.5rem] z-20 overflow-hidden"
        style={{ 
          paddingTop: padding,
          paddingBottom: padding,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: fontSize,
          lineHeight: '1.5'
        }}
      >
        <div style={{ transform: `translateY(-${scrollTop}px)` }}>
          {code.split('\n').map((_, i) => {
            const error = getErrorForLine(i + 1);
            const isDebugLine = debugLine === i;
            return (
              <div 
                key={i} 
                className={`px-1 md:px-2 flex items-center justify-end gap-1 group relative h-[1.5em] ${isDebugLine ? 'bg-blue-500/20 text-blue-400' : ''}`}
              >
                {isDebugLine && (
                  <div className="absolute left-0 w-1 h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
                {error && (
                  <div 
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${error.severity === 'error' ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]'}`}
                    title={error.message}
                  />
                )}
                <span className={error ? (error.severity === 'error' ? 'text-red-400/50' : 'text-yellow-400/50') : ''}>
                  {i + 1}
                </span>
                
                {error && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded border border-white/10 whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl">
                    {error.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Editor Area - Scrollable */}
      <div className="flex-1 relative overflow-auto scrollbar-thin z-10" onScroll={handleScroll}>
        {/* Indent Guides Layer */}
        <div 
          className="absolute inset-0 pointer-events-none select-none z-0"
          style={{ 
            padding: padding,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: fontSize,
            lineHeight: '1.5'
          }}
        >
          {(() => {
            const lines = code.split('\n');
            const lineIndents = lines.map(l => l.trim().length === 0 ? -1 : (l.match(/^\s*/)?.[0].length || 0));
            
            return lines.map((_, i) => {
              const isDebugLine = debugLine === i;
              let indent = lineIndents[i];
              if (indent === -1) {
                let prev = 0;
                for (let k = i - 1; k >= 0; k--) { if (lineIndents[k] !== -1) { prev = lineIndents[k]; break; } }
                let next = 0;
                for (let k = i + 1; k < lineIndents.length; k++) { if (lineIndents[k] !== -1) { next = lineIndents[k]; break; } }
                indent = Math.min(prev, next);
              }
              const levels = Math.floor(indent / 2);
              return (
                <div key={i} className={`h-[1.5em] flex ${isDebugLine ? 'bg-blue-500/10' : ''}`}>
                  {Array.from({ length: levels }).map((_, j) => (
                    <div key={j} className="border-l border-white/[0.05] h-full" style={{ width: '2ch' }} />
                  ))}
                </div>
              );
            });
          })()}
        </div>

        <Editor
          value={code}
          onValueChange={handleValueChange}
          onKeyDown={handleKeyDown}
          highlight={(code) => Prism.highlight(code, Prism.languages.portugol, 'portugol')}
          padding={padding}
          className="min-h-full relative z-10"
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: fontSize,
            backgroundColor: 'transparent',
            color: '#d4d4d4',
            lineHeight: '1.5',
            minWidth: '100%',
            width: 'max-content'
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
