
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CodeFormatter } from './interpreter/CodeFormatter';
import { 
  Play, 
  Terminal, 
  BookOpen, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  HelpCircle,
  Code2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  AlignLeft
} from 'lucide-react';
import { CodeEditor } from './components/Editor';
import { PortugolInterpreter } from './interpreter/Interpreter';
import { SyntaxAnalyzer, SyntaxError } from './interpreter/SyntaxAnalyzer';
import { CATEGORIZED_EXAMPLES, Example } from './constants';
import { cn } from './lib/utils';

const DEFAULT_CODE = `Algoritmo AreaQuadrado()
declare lado, area real;
escreva("Digite o valor do lado:");
leia(lado);
area <- lado * lado; // Calculando a área.
escreva("A área é:", area);
fimalgoritmo`;

export default function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Tutorial de Estrutura"]);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);

  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const errors = SyntaxAnalyzer.analyze(code);
    setSyntaxErrors(errors);
  }, [code]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);
  const [inputRequest, setInputRequest] = useState<{ prompt: string; resolve: (val: string) => void } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  const interpreter = useRef(new PortugolInterpreter(
    (text) => setOutput(prev => [...prev, text]),
    (prompt) => new Promise((resolve) => setInputRequest({ prompt, resolve }))
  ));

  const handleRun = async () => {
    setOutput([]);
    setIsRunning(true);
    try {
      await interpreter.current.run(code);
    } catch (error: any) {
      setOutput(prev => [...prev, `[ERRO] ${error.message}`]);
    }
    setIsRunning(false);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'algoritmo.portugol';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    const formatted = CodeFormatter.format(code);
    setCode(formatted);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRequest) {
      inputRequest.resolve(inputValue);
      setInputRequest(null);
      setInputValue('');
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-gray-200 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarOpen ? (isMobile ? 280 : 320) : 0,
          x: (isMobile && !sidebarOpen) ? -280 : 0
        }}
        className={cn(
          "bg-[#161616] border-r border-white/5 flex flex-col overflow-hidden z-50",
          isMobile ? "fixed inset-y-0 left-0 shadow-2xl" : "relative"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">Portugol Studio</h1>
          </div>
          {isMobile && (
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-500 hover:text-white"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/5">
          {Object.entries(CATEGORIZED_EXAMPLES).map(([category, items]) => (
            <div key={category} className="mb-1">
              <button 
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center gap-2 px-6 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors group"
              >
                {expandedCategories.includes(category) ? (
                  <ChevronDown className="w-4 h-4 text-orange-500" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {category}
              </button>
              
              <AnimatePresence>
                {expandedCategories.includes(category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {items.map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => {
                          setCode(ex.code);
                          if (isMobile) setSidebarOpen(false);
                        }}
                        className="w-full text-left pl-12 pr-6 py-2 text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                      >
                        <Code2 className="w-3.5 h-3.5 opacity-50" />
                        {ex.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/5 bg-[#1a1a1a] text-center">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">
            Ambiente de Aprendizado
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Toolbar */}
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#0f0f0f]">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="text-[10px] md:text-xs font-mono text-gray-500 truncate max-w-[80px] md:max-w-none">editor.portugol</div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <button 
              onClick={handleFormat}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors"
              title="Formatar Código"
            >
              <AlignLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button 
              onClick={handleCopy}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors relative"
              title="Copiar Código"
            >
              {copied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button 
              onClick={handleDownload}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors"
              title="Baixar Código"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-0.5 md:mx-1" />
            <button 
              onClick={handleRun}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all shadow-lg shadow-green-500/10",
                isRunning ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-400 active:scale-95"
              )}
            >
              <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
              <span className="hidden sm:inline">EXECUTAR</span>
              <span className="sm:hidden">RUN</span>
            </button>
          </div>
        </div>

        {/* Editor & Console Split */}
        <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4 gap-2 md:gap-4">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <CodeEditor code={code} onChange={setCode} syntaxErrors={syntaxErrors} />
            
            {/* Syntax Errors Overlay */}
            <AnimatePresence>
              {syntaxErrors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "absolute bottom-4 left-4 right-4 bg-[#1a1a1a]/95 border rounded-lg overflow-hidden backdrop-blur-md z-10 shadow-2xl transition-all duration-300",
                    syntaxErrors.some(e => e.severity === 'error') ? "border-red-500/30" : "border-yellow-500/30",
                    !showErrors ? "h-10" : "max-h-48"
                  )}
                >
                  <div 
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer select-none border-b border-white/5",
                      syntaxErrors.some(e => e.severity === 'error') ? "bg-red-500/5" : "bg-yellow-500/5"
                    )}
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "w-3.5 h-3.5",
                        syntaxErrors.some(e => e.severity === 'error') ? "text-red-500" : "text-yellow-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                        Problemas de Sintaxe ({syntaxErrors.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 font-mono hidden sm:inline">
                        {showErrors ? "Clique para recolher" : "Clique para expandir"}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-gray-500 transition-transform",
                        !showErrors && "rotate-180"
                      )} />
                    </div>
                  </div>
                  
                  {showErrors && (
                    <div className="p-3 space-y-2 overflow-y-auto max-h-36 scrollbar-thin scrollbar-thumb-white/10">
                      {syntaxErrors.map((err, i) => (
                        <div key={i} className="text-xs text-gray-300 flex gap-3 items-start group">
                          <span className={cn(
                            "font-mono font-bold px-1.5 py-0.5 rounded min-w-[65px] text-center text-[10px]",
                            err.severity === 'error' ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                          )}>
                            Linha {err.line}
                          </span>
                          <span className="flex-1 leading-relaxed text-gray-400">{err.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-48 md:h-64 flex flex-col md:flex-row gap-2 md:gap-4">
            {/* Console */}
            <div className="flex-1 bg-[#161616] rounded-lg border border-white/10 flex flex-col overflow-hidden shadow-xl">
              <div className="p-2 md:p-3 border-b border-white/5 flex items-center gap-2 bg-[#1a1a1a]">
                <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500">Console de Saída</span>
              </div>
              <div className="flex-1 p-3 md:p-4 font-mono text-xs md:text-sm overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                {output.length === 0 && !isRunning && (
                  <div className="text-gray-700 italic">Aguardando execução...</div>
                )}
                {output.map((line, i) => (
                  <div key={i} className="text-green-400/90 leading-relaxed">
                    <span className="text-gray-600 mr-2">›</span>
                    {line}
                  </div>
                ))}
                {isRunning && (
                  <motion.div 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-4 bg-green-500 inline-block align-middle ml-1"
                  />
                )}
              </div>
            </div>

            {/* Input Area */}
            <AnimatePresence>
              {inputRequest && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="w-full md:w-80 bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 shadow-2xl shadow-orange-500/5 flex flex-col justify-center"
                >
                  <div className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Entrada Necessária
                  </div>
                  <div className="text-sm text-gray-300 mb-3">{inputRequest.prompt}</div>
                  <form onSubmit={handleInputSubmit} className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
                      placeholder="Digite aqui..."
                    />
                    <button 
                      type="submit"
                      className="bg-orange-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-orange-400 transition-colors"
                    >
                      OK
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
