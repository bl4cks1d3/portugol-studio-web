
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Check
} from 'lucide-react';
import { CodeEditor } from './components/Editor';
import { PortugolInterpreter } from './interpreter/Interpreter';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Entrada e Saída"]);
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
    <div className="flex h-screen bg-[#0f0f0f] text-gray-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        className="bg-[#161616] border-r border-white/5 flex flex-col overflow-hidden"
      >
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white">Portugol Studio</h1>
          </div>
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
                        onClick={() => setCode(ex.code)}
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
        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f0f]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="text-xs font-mono text-gray-500">editor.portugol</div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-white transition-colors relative"
              title="Copiar Código"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Baixar Código"
            >
              <Download className="w-5 h-5" />
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <button 
              onClick={handleRun}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-green-500/10",
                isRunning ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-400 active:scale-95"
              )}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              EXECUTAR
            </button>
            <button className="p-2 text-gray-500 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor & Console Split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
          <div className="flex-1 flex flex-col min-h-0">
            <CodeEditor code={code} onChange={setCode} />
          </div>

          <div className="w-full md:w-80 flex flex-col gap-4">
            {/* Console */}
            <div className="flex-1 bg-[#161616] rounded-lg border border-white/10 flex flex-col overflow-hidden shadow-xl">
              <div className="p-3 border-b border-white/5 flex items-center gap-2 bg-[#1a1a1a]">
                <Terminal className="w-4 h-4 text-gray-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Console de Saída</span>
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
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
                  className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 shadow-2xl shadow-orange-500/5"
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
