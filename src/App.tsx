
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
  Share2,
  Bug,
  StepForward,
  Database,
  Check,
  AlertTriangle,
  AlignLeft,
  Plus,
  X,
  Square,
  Upload,
  Edit3
} from 'lucide-react';
import { CodeEditor } from './components/Editor';
import { PortugolInterpreter } from './interpreter/Interpreter';
import { SyntaxAnalyzer, SyntaxError } from './interpreter/SyntaxAnalyzer';
import { CATEGORIZED_EXAMPLES, Example } from './constants';
import { cn } from './lib/utils';
import { Variable } from './types';
import LZString from 'lz-string';

const DEFAULT_CODE = `Algoritmo AreaQuadrado()
declare lado, area real;
escreva("Digite o valor do lado:");
leia(lado);
area <- lado * lado; // Calculando a área.
escreva("A área é:", area);
fimalgoritmo`;

const BLANK_TEMPLATE = `Algoritmo inicio()

fimalgoritmo`;

interface Tab {
  id: string;
  title: string;
  code: string;
  output: string[];
  syntaxErrors: SyntaxError[];
  isRunning: boolean;
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'algoritmo.portugol', code: DEFAULT_CODE, output: [], syntaxErrors: [], isRunning: false }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Tutorial de Estrutura"]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tempTabTitle, setTempTabTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debugging State
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [debugLine, setDebugLine] = useState<number | null>(null);
  const [debugVariables, setDebugVariables] = useState<Map<string, Variable>>(new Map());
  const [stepResolver, setStepResolver] = useState<{ resolve: () => void } | null>(null);

  useEffect(() => {
    const errors = SyntaxAnalyzer.analyze(activeTab.code);
    updateActiveTab({ syntaxErrors: errors });
  }, [activeTab.code, activeTabId]);

  const updateActiveTab = (updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, ...updates } : t));
  };

  const addTab = (code = BLANK_TEMPLATE, title = 'novo.portugol') => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTabs(prev => [...prev, { id: newId, title, code, output: [], syntaxErrors: [], isRunning: false }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

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
  const [shared, setShared] = useState(false);

  // Load shared code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('code');
    if (sharedCode) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(sharedCode);
        if (decompressed) {
          addTab(decompressed, 'compartilhado.portugol');
          // Clear URL without reloading
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.error('Erro ao carregar código compartilhado:', e);
      }
    }
  }, []);

  const onStep = (line: number, variables: Map<string, Variable>) => {
    setDebugLine(line);
    setDebugVariables(variables);
    return new Promise<void>((resolve) => {
      setStepResolver({ resolve });
    });
  };

  const interpreter = useRef(new PortugolInterpreter(
    (text) => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, output: [...t.output, text] } : t)),
    (prompt) => new Promise((resolve) => setInputRequest({ prompt, resolve })),
    onStep
  ));

  useEffect(() => {
    interpreter.current.setCallbacks(
      (text) => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, output: [...t.output, text] } : t)),
      (prompt) => new Promise((resolve) => setInputRequest({ prompt, resolve })),
      onStep
    );
  }, [activeTabId]);

  const handleRun = async (debug = false) => {
    setIsDebugMode(debug);
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, output: [], isRunning: true } : t));
    try {
      await interpreter.current.run(activeTab.code, debug);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isRunning: false } : t));
    } catch (error: any) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        isRunning: false, 
        output: [...t.output, `[ERRO] ${error.message}`] 
      } : t));
    } finally {
      setDebugLine(null);
      setDebugVariables(new Map());
      setStepResolver(null);
    }
  };

  const handleNextStep = () => {
    if (stepResolver) {
      stepResolver.resolve();
      setStepResolver(null);
    }
  };

  const handleStop = () => {
    interpreter.current.stop();
    if (stepResolver) stepResolver.resolve();
    setInputRequest(null);
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isRunning: false, output: [] } : t));
    setDebugLine(null);
    setDebugVariables(new Map());
    setStepResolver(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      addTab(content, file.name);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset for next upload
  };

  const startEditingTab = (id: string, title: string) => {
    setEditingTabId(id);
    setTempTabTitle(title);
  };

  const saveTabTitle = () => {
    if (editingTabId && tempTabTitle.trim()) {
      setTabs(prev => prev.map(t => t.id === editingTabId ? { ...t, title: tempTabTitle.trim() } : t));
    }
    setEditingTabId(null);
  };

  const handleDownload = () => {
    const blob = new Blob([activeTab.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab.title;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    const compressed = LZString.compressToEncodedURIComponent(activeTab.code);
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${compressed}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormat = () => {
    const formatted = CodeFormatter.format(activeTab.code);
    updateActiveTab({ code: formatted });
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
                          updateActiveTab({ code: ex.code, output: [], title: ex.title + '.portugol' });
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
            
            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin flex-1 max-w-[140px] xs:max-w-[200px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[800px]">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  onDoubleClick={() => startEditingTab(tab.id, tab.title)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-[10px] md:text-xs font-medium transition-all cursor-pointer border-b-2 group",
                    activeTabId === tab.id 
                      ? "bg-white/5 text-white border-orange-500" 
                      : "text-gray-500 hover:text-gray-300 border-transparent"
                  )}
                >
                  {editingTabId === tab.id ? (
                    <input
                      autoFocus
                      className="bg-black/40 border border-orange-500/50 rounded px-1 py-0.5 outline-none w-24 md:w-32"
                      value={tempTabTitle}
                      onChange={(e) => setTempTabTitle(e.target.value)}
                      onBlur={saveTabTitle}
                      onKeyDown={(e) => e.key === 'Enter' && saveTabTitle()}
                    />
                  ) : (
                    <>
                      <span className="truncate max-w-[80px] md:max-w-[120px]">{tab.title}</span>
                      <Edit3 
                        className="w-2.5 h-2.5 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" 
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTab(tab.id, tab.title);
                        }}
                      />
                    </>
                  )}
                  {tabs.length > 1 && (
                    <X 
                      className="w-3 h-3 hover:text-red-500 transition-colors" 
                      onClick={(e) => closeTab(tab.id, e)}
                    />
                  )}
                </div>
              ))}
              <button 
                onClick={() => addTab()}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title="Novo Arquivo"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
              onClick={handleUploadClick}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors"
              title="Fazer Upload (.portugol)"
            >
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".portugol,.txt"
              className="hidden"
            />
            <button 
              onClick={handleDownload}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors"
              title="Baixar Código"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button 
              onClick={handleShare}
              className="p-1.5 md:p-2 text-gray-500 hover:text-white transition-colors relative"
              title="Compartilhar Código"
            >
              {shared ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" /> : <Share2 className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <div className="h-4 w-[1px] bg-white/10 mx-0.5 md:mx-1" />
            
            {activeTab.isRunning ? (
              <div className="flex items-center gap-2">
                {isDebugMode && stepResolver && (
                  <button 
                    onClick={handleNextStep}
                    className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all bg-blue-500 text-white hover:bg-blue-400 active:scale-95 shadow-lg shadow-blue-500/10"
                  >
                    <StepForward className="w-3 h-3 md:w-3.5 md:h-3.5" />
                    <span>PRÓXIMO</span>
                  </button>
                )}
                <button 
                  onClick={handleStop}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all bg-red-500 text-white hover:bg-red-400 active:scale-95 shadow-lg shadow-red-500/10"
                >
                  <Square className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                  <span>ENCERRAR</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleRun(true)}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all bg-blue-600/30 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 active:scale-95"
                  title="Executar Passo a Passo"
                >
                  <Bug className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">DEPURAR</span>
                </button>
                <button 
                  onClick={() => handleRun(false)}
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold transition-all bg-green-500 text-white hover:bg-green-400 active:scale-95 shadow-lg shadow-green-500/10"
                >
                  <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
                  <span className="hidden sm:inline">EXECUTAR</span>
                  <span className="sm:hidden">RUN</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editor & Console Split */}
        <div className="flex-1 flex flex-col overflow-hidden p-2 md:p-4 gap-2 md:gap-4">
          <div className="flex-1 flex flex-col min-h-0 relative">
            <CodeEditor 
              code={activeTab.code} 
              onChange={(newCode) => updateActiveTab({ code: newCode })} 
              syntaxErrors={activeTab.syntaxErrors} 
              debugLine={debugLine}
            />
            
            {/* Syntax Errors Overlay */}
            <AnimatePresence>
              {activeTab.syntaxErrors.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    "absolute bottom-4 left-4 right-4 bg-[#1a1a1a]/95 border rounded-lg overflow-hidden backdrop-blur-md z-10 shadow-2xl transition-all duration-300",
                    activeTab.syntaxErrors.some(e => e.severity === 'error') ? "border-red-500/30" : "border-yellow-500/30",
                    !showErrors ? "h-10" : "max-h-48"
                  )}
                >
                  <div 
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer select-none border-b border-white/5",
                      activeTab.syntaxErrors.some(e => e.severity === 'error') ? "bg-red-500/5" : "bg-yellow-500/5"
                    )}
                    onClick={() => setShowErrors(!showErrors)}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn(
                        "w-3.5 h-3.5",
                        activeTab.syntaxErrors.some(e => e.severity === 'error') ? "text-red-500" : "text-yellow-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                        Problemas de Sintaxe ({activeTab.syntaxErrors.length})
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
                      {activeTab.syntaxErrors.map((err, i) => (
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
            {/* Variables Panel (Debug Mode) */}
            <AnimatePresence>
              {isDebugMode && activeTab.isRunning && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isMobile ? '100%' : '280px', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="bg-[#0a0a0a] rounded-lg border border-white/10 flex flex-col overflow-hidden shadow-xl"
                >
                  <div className="p-2 md:p-3 border-b border-white/5 flex items-center gap-2 bg-[#1a1a1a]">
                    <Database className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500">Variáveis</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                    {debugVariables.size === 0 ? (
                      <div className="text-[10px] text-gray-700 italic">Nenhuma variável declarada.</div>
                    ) : (
                      Array.from(debugVariables.values()).map((v: Variable) => (
                        <div key={v.name} className="bg-white/5 rounded p-2 border border-white/5">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-blue-400">{v.name}</span>
                            <span className="text-[8px] text-gray-600 uppercase">{v.type}</span>
                          </div>
                          <div className="text-xs font-mono text-gray-300 break-all">
                            {v.isArray ? JSON.stringify(v.value) : String(v.value)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Console */}
            <div className="flex-1 bg-[#161616] rounded-lg border border-white/10 flex flex-col overflow-hidden shadow-xl">
              <div className="p-2 md:p-3 border-b border-white/5 flex items-center gap-2 bg-[#1a1a1a]">
                <Terminal className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" />
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500">Console de Saída</span>
              </div>
              <div className="flex-1 p-3 md:p-4 font-mono text-xs md:text-sm overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                {activeTab.output.length === 0 && !activeTab.isRunning && (
                  <div className="text-gray-700 italic">Aguardando execução...</div>
                )}
                {activeTab.output.map((line, i) => (
                  <div key={i} className="text-green-400/90 leading-relaxed">
                    <span className="text-gray-600 mr-2">›</span>
                    {line}
                  </div>
                ))}
                {activeTab.isRunning && (
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
