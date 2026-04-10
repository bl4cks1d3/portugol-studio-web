
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
  MoreVertical,
  Plus,
  X,
  Square,
  Upload,
  Edit3,
  FolderOpen,
  Info,
  Home as HomeIcon,
  Save,
  FileCode
} from 'lucide-react';
import { CodeEditor } from './components/Editor';
import { PortugolInterpreter } from './interpreter/Interpreter';
import { SyntaxAnalyzer, SyntaxError } from './interpreter/SyntaxAnalyzer';
import { CATEGORIZED_EXAMPLES, Example } from './constants';
import { cn } from './lib/utils';
import { Variable } from './types';
import LZString from 'lz-string';
import { PORTUGOL_DOCS } from './docs';

const Logo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={cn("flex items-center justify-center bg-orange-500 rounded-lg font-black text-white select-none", className)}>
    P
  </div>
);

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
  const [currentView, setCurrentView] = useState<'home' | 'editor' | 'help' | 'examples'>('home');
  
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["Tutorial de Estrutura"]);
  const [showErrors, setShowErrors] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tempTabTitle, setTempTabTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mobile/UI State
  const [bottomTab, setBottomTab] = useState<'console' | 'variables'>('console');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
    setCurrentView('editor');
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
    const startTime = performance.now();
    try {
      await interpreter.current.run(activeTab.code, debug);
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { 
        ...t, 
        isRunning: false,
        output: [...t.output, `\nPrograma finalizado (duração: ${duration} segundos)`]
      } : t));
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
      {/* Sidebar - Narrow Icon Bar */}
      <aside className="w-16 bg-[#161616] border-r border-white/5 flex flex-col items-center py-4 z-50">
        <div className="flex flex-col gap-4 flex-1">
          <button 
            onClick={() => setCurrentView('home')}
            className={cn("p-3 rounded-xl transition-all", currentView === 'home' ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:text-white hover:bg-white/5")}
            title="Início"
          >
            <HomeIcon className="w-6 h-6" />
          </button>

          <div className="h-[1px] bg-white/5 mx-2" />

          <button 
            onClick={() => { setCurrentView('editor'); handleRun(false); }}
            disabled={activeTab.isRunning}
            className={cn("p-3 rounded-xl transition-all", activeTab.isRunning ? "text-green-500" : "text-gray-500 hover:text-green-500 hover:bg-green-500/10 disabled:opacity-30")}
            title="Executar"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>

          <button 
            onClick={() => { setCurrentView('editor'); handleRun(true); }}
            disabled={activeTab.isRunning}
            className={cn("p-3 rounded-xl transition-all", activeTab.isRunning ? "text-blue-500" : "text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 disabled:opacity-30")}
            title="Depurar"
          >
            <Bug className="w-6 h-6" />
          </button>

          {isDebugMode && activeTab.isRunning && stepResolver && (
            <button 
              onClick={handleNextStep}
              className="p-3 rounded-xl text-blue-400 hover:bg-blue-400/10 transition-all animate-pulse"
              title="Próximo Passo"
            >
              <StepForward className="w-6 h-6" />
            </button>
          )}

          <button 
            onClick={handleStop}
            disabled={!activeTab.isRunning}
            className={cn("p-3 rounded-xl transition-all", !activeTab.isRunning ? "text-gray-500 opacity-30" : "text-red-500 hover:bg-red-500/10")}
            title="Parar"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>

          <div className="h-[1px] bg-white/5 mx-2" />

          <button 
            onClick={handleDownload}
            className="p-3 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
            title="Salvar"
          >
            <Save className="w-6 h-6" />
          </button>

          <button 
            onClick={handleUploadClick}
            className="p-3 rounded-xl text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
            title="Abrir Arquivo"
          >
            <FolderOpen className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setCurrentView('examples')}
            className={cn("p-3 rounded-xl transition-all", currentView === 'examples' ? "bg-yellow-500/20 text-yellow-500" : "text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/10")}
            title="Exemplos"
          >
            <FileCode className="w-6 h-6" />
          </button>

          <button 
            onClick={handleShare}
            className="p-3 rounded-xl text-gray-500 hover:text-teal-400 hover:bg-teal-400/10 transition-all"
            title="Compartilhar"
          >
            <Share2 className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setCurrentView('help')}
            className={cn("p-3 rounded-xl transition-all", currentView === 'help' ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-blue-400 hover:bg-blue-400/10")}
            title="Ajuda"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header with Logo and Tabs */}
        <header className="h-12 bg-[#1a1a1a] border-b border-white/5 flex items-center px-2 z-40">
          <div 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 px-3 border-r border-white/5 mr-2 cursor-pointer hover:bg-white/5 transition-colors h-full"
          >
            <Logo className="w-6 h-6" />
            <span className="text-xs font-bold text-white whitespace-nowrap hidden sm:block">Portugol Webstudio</span>
          </div>

          <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none no-scrollbar">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => { setActiveTabId(tab.id); setCurrentView('editor'); }}
                className={cn(
                  "flex items-center gap-2 px-4 h-9 rounded-t-lg text-[11px] font-medium transition-all cursor-pointer group relative",
                  activeTabId === tab.id && currentView === 'editor'
                    ? "bg-[#0f0f0f] text-white" 
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                )}
              >
                <BookOpen className="w-3.5 h-3.5 opacity-50" />
                <span className="truncate max-w-[100px]">{tab.title}</span>
                {tabs.length > 1 && (
                  <X 
                    className="w-3 h-3 opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity" 
                    onClick={(e) => closeTab(tab.id, e)}
                  />
                )}
                {activeTabId === tab.id && currentView === 'editor' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                )}
              </div>
            ))}
            <button 
              onClick={() => addTab()}
              className="p-2 text-gray-500 hover:text-white transition-colors"
              title="Novo Arquivo"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div 
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute inset-0 bg-[#1e252b] flex flex-col items-center justify-center p-6 overflow-y-auto"
              >
                <div className="flex flex-col items-center mb-12">
                  <Logo className="w-32 h-32 mb-4" />
                  <h1 className="text-4xl font-bold text-white tracking-tight">Portugol <span className="text-gray-400 font-light">Webstudio</span></h1>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl w-full">
                  {[
                    { icon: Plus, label: "Novo Arquivo", color: "text-teal-400", action: () => addTab() },
                    { icon: FolderOpen, label: "Abrir Arquivo", color: "text-yellow-500", action: handleUploadClick },
                    { icon: FileCode, label: "Abrir Exemplo", color: "text-orange-500", action: () => setCurrentView('examples') },
                    { icon: HelpCircle, label: "Ajuda", color: "text-blue-400", action: () => setCurrentView('help') },
                    { icon: Info, label: "feito por bl4cks1d3 2026", color: "text-blue-400", action: () => {}, badge: "INFO" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="bg-[#161b22] border border-white/5 p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-[#1c2128] hover:border-white/10 transition-all group relative"
                    >
                      {item.badge && (
                        <span className="absolute top-2 right-2 bg-yellow-500 text-[#0f0f0f] text-[8px] font-bold px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      <item.icon className={cn("w-8 h-8", item.color)} />
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {currentView === 'help' && (
              <motion.div 
                key="help"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 bg-[#0f0f0f] p-8 overflow-y-auto"
              >
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-blue-400" />
                    Entendendo a Sintaxe
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {PORTUGOL_DOCS.map((doc, i) => (
                      <div key={i} className="bg-[#161616] border border-white/5 p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-orange-500 mb-3">{doc.title}</h3>
                        <p className="text-sm text-gray-400 whitespace-pre-line leading-relaxed">{doc.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'examples' && (
              <motion.div 
                key="examples"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 bg-[#0f0f0f] p-8 overflow-y-auto"
              >
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <FileCode className="w-8 h-8 text-yellow-500" />
                    Exemplos de Algoritmos
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(CATEGORIZED_EXAMPLES).map(([category, items]) => (
                      <div key={category} className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden">
                        <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                          <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">{category}</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          {items.map((ex) => (
                            <button
                              key={ex.id}
                              onClick={() => {
                                addTab(ex.code, ex.title + '.portugol');
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-3 group"
                            >
                              <div className="w-8 h-8 rounded bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                                <Code2 className="w-4 h-4 text-orange-500" />
                              </div>
                              {ex.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {currentView === 'editor' && (
              <motion.div 
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col p-2 md:p-4 gap-2 md:gap-4"
              >
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

                <div className="h-56 md:h-64 flex flex-col md:flex-row gap-2 md:gap-4">
                  {/* Bottom Panel Tabs (Mobile Only) */}
                  {isMobile && isDebugMode && activeTab.isRunning && (
                    <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-white/5 shrink-0">
                      <button
                        onClick={() => setBottomTab('console')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold transition-all",
                          bottomTab === 'console' ? "bg-white/10 text-white" : "text-gray-500"
                        )}
                      >
                        <Terminal className="w-3 h-3" />
                        CONSOLE
                      </button>
                      <button
                        onClick={() => setBottomTab('variables')}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[10px] font-bold transition-all",
                          bottomTab === 'variables' ? "bg-blue-500/20 text-blue-400" : "text-gray-500"
                        )}
                      >
                        <Database className="w-3 h-3" />
                        VARIÁVEIS
                      </button>
                    </div>
                  )}

                  {/* Variables Panel (Debug Mode) */}
                  <AnimatePresence mode="wait">
                    {(!isMobile || bottomTab === 'variables') && isDebugMode && activeTab.isRunning && (
                      <motion.div
                        key="variables"
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
                  <AnimatePresence mode="wait">
                    {(!isMobile || bottomTab === 'console' || !isDebugMode || !activeTab.isRunning) && (
                      <motion.div 
                        key="console"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 bg-[#161616] rounded-lg border border-white/10 flex flex-col overflow-hidden shadow-xl"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>

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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".portugol,.txt"
        className="hidden"
      />
    </div>
  );
}
