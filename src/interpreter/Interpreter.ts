
import { DataType, Variable, InterpreterState } from '../types';

export class PortugolInterpreter {
  private state: InterpreterState;
  private onOutput: (text: string) => void;
  private onClearOutput: () => void;
  private onInputRequired: (prompt: string) => Promise<string>;
  private onStep?: (line: number, variables: Map<string, Variable>) => Promise<void>;
  private lastEscrevaContent: string | null = null;
  private stopExecution: boolean = false;
  private isDebugging: boolean = false;

  constructor(
    onOutput: (text: string) => void,
    onClearOutput: () => void,
    onInputRequired: (prompt: string) => Promise<string>,
    onStep?: (line: number, variables: Map<string, Variable>) => Promise<void>
  ) {
    this.onOutput = onOutput;
    this.onClearOutput = onClearOutput;
    this.onInputRequired = onInputRequired;
    this.onStep = onStep;
    this.state = this.resetState();
  }

  private resetState(): InterpreterState {
    return {
      variables: new Map(),
      output: [],
      inputQueue: [],
      isWaitingForInput: false,
      currentLine: 0,
      error: null,
    };
  }

  public setCallbacks(
    onOutput: (text: string) => void, 
    onClearOutput: () => void,
    onInputRequired: (prompt: string) => Promise<string>,
    onStep?: (line: number, variables: Map<string, Variable>) => Promise<void>
  ) {
    this.onOutput = onOutput;
    this.onClearOutput = onClearOutput;
    this.onInputRequired = onInputRequired;
    this.onStep = onStep;
  }

  public async run(code: string, debug: boolean = false) {
    this.state = this.resetState();
    this.lastEscrevaContent = null;
    this.stopExecution = false;
    this.isDebugging = debug;
    const lines = code.split('\n');
    
    try {
      await this.executeBlock(lines, 0);
    } catch (e: any) {
      this.state.error = e.message;
      this.onOutput(`\nERRO: ${e.message}`);
    }
  }

  public stop() {
    this.stopExecution = true;
  }

  private async executeBlock(lines: string[], offset: number = 0) {
    let i = 0;
    while (i < lines.length) {
      if (this.stopExecution) throw new Error("Execução interrompida pelo usuário.");
      
      const absoluteLine = offset + i;
      let line = lines[i].trim();
      
      if (!line || line.startsWith('//')) {
        i++;
        continue;
      }

      // Handle multi-line statements by joining lines until parentheses are balanced
      let fullLine = line;
      let j = i;
      let balance = this.countParenBalance(fullLine);
      
      // If we have an open parenthesis, keep adding lines until it's closed or we hit a block keyword
      while (balance > 0 && j + 1 < lines.length) {
        j++;
        const nextLine = lines[j].trim();
        if (!nextLine || nextLine.startsWith('//')) continue;
        
        // Stop if we hit a keyword that definitely starts a new block
        const lowerNext = nextLine.toLowerCase();
        if (lowerNext.startsWith('se ') || lowerNext.startsWith('enquanto') || 
            lowerNext.startsWith('para') || lowerNext.startsWith('fimalgoritmo') ||
            lowerNext.startsWith('fimse') || lowerNext.startsWith('fimenquanto') ||
            lowerNext.startsWith('fimpara')) {
          break;
        }

        fullLine += " " + nextLine;
        balance = this.countParenBalance(fullLine);
      }
      
      i = j; // Advance main loop index
      const command = fullLine;

      // Debug step
      if (this.isDebugging && this.onStep) {
        this.state.currentLine = absoluteLine;
        await this.onStep(absoluteLine, new Map(this.state.variables));
      }

      try {
        const lowerLine = command.toLowerCase();
        if (lowerLine.startsWith('algoritmo')) {
          // Skip header
        } else if (lowerLine.startsWith('fimalgoritmo')) {
          break;
        } else if (lowerLine.startsWith('declare')) {
          this.handleDeclaration(command);
        } else if (lowerLine.startsWith('escreva')) {
          this.handleEscreva(command);
        } else if (lowerLine.startsWith('leia')) {
          await this.handleLeia(command);
        } else if (lowerLine.startsWith('se')) {
          const { nextIndex } = await this.handleSe(lines, i, offset); // handleSe/loops still use lines/i for block finding
          i = nextIndex;
          continue;
        } else if (lowerLine.startsWith('enquanto')) {
          const { nextIndex } = await this.handleEnquanto(lines, i, offset);
          i = nextIndex;
          continue;
        } else if (lowerLine.startsWith('para')) {
          const { nextIndex } = await this.handlePara(lines, i, offset);
          i = nextIndex;
          continue;
        } else if (lowerLine.startsWith('faca')) {
          const { nextIndex } = await this.handleFacaEnquanto(lines, i, offset);
          i = nextIndex;
          continue;
        } else if (lowerLine.startsWith('escolha')) {
          const { nextIndex } = await this.handleEscolha(lines, i, offset);
          i = nextIndex;
          continue;
        } else if (command.includes('<-') || command.includes('++') || command.includes('--')) {
          this.handleAssignment(command);
        }
      } catch (error: any) {
        throw new Error(`Erro na linha ${absoluteLine + 1}: ${error.message}`);
      }
      
      i++;
    }
  }

  private countParenBalance(text: string): number {
    let balance = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ((char === '"' || char === "'") && (i === 0 || text[i-1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
        }
      }
      
      if (!inQuotes) {
        if (char === '(') balance++;
        if (char === ')') balance--;
      }
    }
    return balance;
  }

  private async handlePara(lines: string[], startIndex: number, offset: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex].trim();
    
    // Standard syntax: para (i <- 1; i <= 10; i <- i + 1)
    const parenMatch = line.match(/para\s*\((.*)\)/i);
    if (parenMatch) {
      const header = parenMatch[1];
      const parts = header.split(';');
      if (parts.length === 3) {
        const init = parts[0].trim();
        const condition = parts[1].trim();
        const increment = parts[2].trim();
        return this.runParaLoop(init, condition, increment, lines, startIndex, offset);
      }
    }

    // Alternative syntax: para i <- 1 ate 10 passo 1 faca
    const altRegex = /para\s+(\w+)\s*<-\s*([^ ]+)\s+ate\s+([^ ]+)(?:\s+passo\s+([^ ]+))?/i;
    const altMatch = line.match(altRegex);
    if (altMatch) {
      const varName = altMatch[1];
      const startVal = altMatch[2];
      const endVal = altMatch[3];
      const step = altMatch[4] || "1";
      
      const init = `${varName} <- ${startVal}`;
      const condition = `${varName} <= ${endVal}`;
      const increment = `${varName} <- ${varName} + ${step}`;
      
      return this.runParaLoop(init, condition, increment, lines, startIndex, offset);
    }

    throw new Error(`Sintaxe 'para' inválida na linha ${offset + startIndex + 1}. Use o formato: para (i <- 1; i <= 10; i <- i + 1)`);
  }

  private async runParaLoop(init: string, condition: string, increment: string, lines: string[], startIndex: number, offset: number) {
    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimpara');

    // Execute init
    if (init.includes('<-')) this.handleAssignment(init);
    else if (init.toLowerCase().startsWith('declare')) this.handleDeclaration(init);

    let safetyCounter = 0;
    const MAX_ITERATIONS = 10000;

    while (this.evaluateExpression(condition)) {
      if (this.stopExecution) throw new Error("Execução interrompida pelo usuário.");
      if (safetyCounter++ > MAX_ITERATIONS) {
        throw new Error("Loop infinito detectado ou limite de execuções excedido.");
      }
      await this.executeBlock(block, offset + startIndex + 1);
      // Execute increment
      if (increment.includes('<-') || increment.includes('++') || increment.includes('--')) {
        this.handleAssignment(increment);
      } else {
        // Fallback for simple increments like "i + 1"
        const varName = init.split('<-')[0].trim();
        const newVal = this.evaluateExpression(increment);
        const variable = this.state.variables.get(varName);
        if (variable) {
          variable.value = this.enforceType(newVal, variable.type);
        }
      }
    }

    return { nextIndex: endIndex + 1 };
  }

  private async handleFacaEnquanto(lines: string[], startIndex: number, offset: number): Promise<{ nextIndex: number }> {
    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'enquanto');
    
    // The line at endIndex is the 'enquanto(condition)' line
    const conditionLine = lines[endIndex];
    const condition = conditionLine.match(/enquanto\s*\((.*)\)/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'enquanto' de fechamento do 'faca' inválida na linha ${offset + endIndex + 1}`);

    do {
      if (this.stopExecution) throw new Error("Execução interrompida pelo usuário.");
      await this.executeBlock(block, offset + startIndex + 1);
    } while (this.evaluateExpression(condition));

    return { nextIndex: endIndex + 1 };
  }

  private async handleEscolha(lines: string[], startIndex: number, offset: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const match = line.match(/escolha\s*\((.+)\)/i);
    if (!match) throw new Error(`Sintaxe 'escolha' inválida na linha ${offset + startIndex + 1}`);
    const value = this.evaluateExpression(match[1]);

    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimescolha');
    
    let found = false;
    for (let i = 0; i < block.length; i++) {
      const l = block[i].trim();
      const lLower = l.toLowerCase();
      if (lLower.startsWith('caso ') && !lLower.startsWith('caso contrario:')) {
        const casoMatch = l.match(/caso\s+(.*?):\s*(.*)/i);
        if (casoMatch) {
          const casoVal = this.evaluateExpression(casoMatch[1]);
          if (String(casoVal) === String(value)) {
            const sameLineCode = casoMatch[2].trim();
            if (sameLineCode) {
              await this.executeBlock([sameLineCode], offset + startIndex + 1 + i);
            } else {
              const subBlock = this.getCaseBlock(block, i);
              await this.executeBlock(subBlock, offset + startIndex + 1 + i + 1);
            }
            found = true;
            break;
          }
        }
      } else if (lLower.startsWith('caso contrario:')) {
        // Skip for now, will handle after the loop if not found
      }
    }

    if (!found) {
      for (let i = 0; i < block.length; i++) {
        const l = block[i].trim();
        const lLower = l.toLowerCase();
        if (lLower.startsWith('caso contrario:')) {
          const match = l.match(/caso contrario:\s*(.*)/i);
          const sameLineCode = match?.[1]?.trim();
          if (sameLineCode) {
            await this.executeBlock([sameLineCode], offset + startIndex + 1 + i);
          } else {
            const subBlock = this.getCaseBlock(block, i);
            await this.executeBlock(subBlock, offset + startIndex + 1 + i + 1);
          }
          break;
        }
      }
    }

    return { nextIndex: endIndex + 1 };
  }

  private getCaseBlock(block: string[], startIndex: number): string[] {
    const subBlock: string[] = [];
    for (let i = startIndex + 1; i < block.length; i++) {
      const l = block[i].trim().toLowerCase();
      if (l.startsWith('caso ') || l.startsWith('caso contrario:')) break;
      subBlock.push(block[i]);
    }
    return subBlock;
  }

  private handleDeclaration(line: string) {
    // declare N1, N2, NF real; or declare notas[10] real; or declare m[5][5] inteiro;
    const match = line.match(/declare\s+(.+)\s+(inteiro|real|literal|logico);?/i);
    if (!match) throw new Error(`Sintaxe de declaração inválida: ${line}`);
    
    const namesWithSizes = match[1].split(',').map(n => n.trim());
    const type = match[2].toLowerCase() as DataType;
    
    namesWithSizes.forEach(item => {
      const arrayMatch = item.match(/(.+?)\[(\d+)\](?:\[(\d+)\])?/);
      if (arrayMatch) {
        const name = arrayMatch[1];
        const size1 = parseInt(arrayMatch[2]);
        const size2 = arrayMatch[3] ? parseInt(arrayMatch[3]) : null;
        
        let value: any;
        if (size2) {
          value = Array(size1).fill(null).map(() => Array(size2).fill(this.getDefaultValue(type)));
        } else {
          value = Array(size1).fill(this.getDefaultValue(type));
        }

        this.state.variables.set(name, { name, type, value, isArray: true });
      } else {
        this.state.variables.set(item, { name: item, type, value: this.getDefaultValue(type) });
      }
    });
  }

  private getDefaultValue(type: DataType) {
    if (type === 'inteiro' || type === 'real') return 0;
    if (type === 'literal') return "";
    return false;
  }

  private handleAssignment(line: string) {
    // area <- lado * lado; or notas[0] <- 10; or i++; or i--;
    if (line.includes('++')) {
      const varName = line.replace('++', '').replace(';', '').trim();
      const variable = this.state.variables.get(varName);
      if (variable) variable.value++;
      return;
    }
    if (line.includes('--')) {
      const varName = line.replace('--', '').replace(';', '').trim();
      const variable = this.state.variables.get(varName);
      if (variable) variable.value--;
      return;
    }

    const parts = line.split('<-');
    if (parts.length < 2) return; // Not an assignment
    
    const target = parts[0].trim();
    const expression = parts[1].replace(';', '').trim();
    
    const value = this.evaluateExpression(expression);

    const arrayMatch = target.match(/(.+?)\[(.+?)\](?:\[(.+?)\])?/);
    if (arrayMatch) {
      const name = arrayMatch[1];
      const idx1 = this.evaluateExpression(arrayMatch[2]);
      const idx2 = arrayMatch[3] ? this.evaluateExpression(arrayMatch[3]) : null;
      
      const variable = this.state.variables.get(name);
      if (!variable) throw new Error(`Variável não declarada: ${name}`);
      
      const finalValue = this.enforceType(value, variable.type);

      if (idx2 !== null) variable.value[idx1][idx2] = finalValue;
      else variable.value[idx1] = finalValue;
    } else {
      const variable = this.state.variables.get(target);
      if (!variable) throw new Error(`Variável não declarada: ${target}`);
      variable.value = this.enforceType(value, variable.type);
    }
  }

  private handleEscreva(line: string) {
    // escreva("A área é:", area);
    const contentMatch = line.match(/escreva\((.*)\);?/i);
    if (!contentMatch) return;
    
    let content = contentMatch[1];
    
    // Support "Line 1"\n "Line 2" by transforming it into "Line 1" "\n" "Line 2"
    // This allows the existing concatenation logic to merge them into "Line 1\nLine 2"
    content = content
      .replace(/("\s*)\\n(\s*")/g, '" "\\n" "')
      .replace(/('\s*)\\n(\s*')/g, "' '\\n' '");

    const parts = this.splitArgs(content);
    const output = parts.map(p => {
      // Handle implicit string concatenation (e.g. "A" "B" -> "AB")
      const concatenated = p.replace(/"\s*"/g, '').replace(/'\s*'/g, '');
      
      if (concatenated.startsWith('"') || concatenated.startsWith("'")) {
        return concatenated.slice(1, -1).replace(/\\n/g, '\n');
      }
      return this.evaluateExpression(concatenated);
    }).join(' ');
    
    this.onOutput(output);
    this.lastEscrevaContent = output;
  }

  private async handleLeia(line: string) {
    const varNameRaw = line.match(/leia\((.*)\);?/i)?.[1].trim();
    if (!varNameRaw) return;

    const prompt = this.lastEscrevaContent || `Digite o valor para ${varNameRaw}:`;
    
    // Temporarily disable debugging during input to avoid double pausing
    const wasDebugging = this.isDebugging;
    this.isDebugging = false;
    
    const input = await this.onInputRequired(prompt);
    
    this.isDebugging = wasDebugging;
    this.lastEscrevaContent = null;

    const arrayMatch = varNameRaw.match(/(.+?)\[(.+?)\](?:\[(.+?)\])?/);
    
    if (arrayMatch) {
      const name = arrayMatch[1];
      const idx1 = this.evaluateExpression(arrayMatch[2]);
      const idx2 = arrayMatch[3] ? this.evaluateExpression(arrayMatch[3]) : null;
      
      const variable = this.state.variables.get(name);
      if (!variable) throw new Error(`Variável não declarada: ${name}`);
      
      const finalValue = this.enforceType(input, variable.type);

      if (idx2 !== null) variable.value[idx1][idx2] = finalValue;
      else variable.value[idx1] = finalValue;
    } else {
      const variable = this.state.variables.get(varNameRaw);
      if (!variable) throw new Error(`Variável não declarada: ${varNameRaw}`);

      variable.value = this.enforceType(input, variable.type);
    }
  }

  private async handleSe(lines: string[], startIndex: number, offset: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const condition = line.match(/se\s*\((.*)\)\s*entao/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'se' inválida na linha ${offset + startIndex + 1}`);

    const { block: thenBlock, elseBlock, endIndex } = this.findConditionalBlocks(lines, startIndex);
    
    const conditionResult = this.evaluateExpression(condition);
    if (conditionResult) {
      await this.executeBlock(thenBlock, offset + startIndex + 1);
    } else if (elseBlock.length > 0) {
      // Find where 'senao' starts to give correct offset
      let senaoOffset = 0;
      let depth = 1;
      for (let j = startIndex + 1; j < endIndex; j++) {
        const l = lines[j].trim().toLowerCase();
        if (l.startsWith('se ') || l.startsWith('se(')) depth++;
        else if (l === 'fimse') depth--;
        if (l === 'senao' && depth === 1) {
          senaoOffset = j - startIndex;
          break;
        }
      }
      await this.executeBlock(elseBlock, offset + startIndex + 1 + senaoOffset);
    }

    return { nextIndex: endIndex + 1 };
  }

  private async handleEnquanto(lines: string[], startIndex: number, offset: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const condition = line.match(/enquanto\s*\((.*)\)/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'enquanto' inválida na linha ${offset + startIndex + 1}`);

    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimenquanto');
    
    while (this.evaluateExpression(condition)) {
      if (this.stopExecution) throw new Error("Execução interrompida pelo usuário.");
      await this.executeBlock(block, offset + startIndex + 1);
    }

    return { nextIndex: endIndex + 1 };
  }

  private evaluateExpression(expr: string): any {
    // Replace variables with values, handling arrays/matrices
    let processed = expr;
    
    // Sort keys by length descending to avoid partial matches (e.g., 'a' matching in 'area')
    const sortedNames = Array.from(this.state.variables.keys()).sort((a, b) => b.length - a.length);

    sortedNames.forEach(name => {
      const variable = this.state.variables.get(name)!;
      
      // Handle array access: name[index] or name[i][j]
      const arrayRegex = new RegExp(`${name}\\[([^\\]]+)\\](?:\\[([^\\]]+)\\])?`, 'g');
      processed = processed.replace(arrayRegex, (match, idx1, idx2) => {
        const i1 = this.evaluateExpression(idx1);
        if (idx2) {
          const i2 = this.evaluateExpression(idx2);
          return variable.value[i1][i2];
        }
        return variable.value[i1];
      });

      // Handle simple variable access
      const varRegex = new RegExp(`\\b${name}\\b`, 'g');
      const val = typeof variable.value === 'string' ? `"${variable.value}"` : variable.value;
      processed = processed.replace(varRegex, val);
    });

    // Handle Portugol specific operators and functions with a loop to support nesting
    processed = processed
      .replace(/\s+e\s+/gi, ' && ')
      .replace(/\s+ou\s+/gi, ' || ')
      .replace(/\s+nao\s+/gi, ' ! ')
      .replace(/<>/g, '!=')
      .replace(/([^<>!=])=([^<>!=])/g, '$1 == $2') // Replace single = with == if not part of comparison
      .replace(/&&/g, '&&')
      .replace(/\|\|/g, '||')
      .replace(/!/g, '!')
      .replace(/%/g, '%');

    let previous;
    do {
      previous = processed;
      processed = processed
        .replace(/resto\((.+?),\s*(.+?)\)/gi, '($1 % $2)')
        .replace(/raizquadrada\((.+?)\)/gi, 'Math.sqrt($1)')
        .replace(/potencia\((.+?),\s*(.+?)\)/gi, 'Math.pow($1, $2)')
        .replace(/seno\((.+?)\)/gi, 'Math.sin($1)')
        .replace(/sen\((.+?)\)/gi, 'Math.sin($1)')
        .replace(/cosseno\((.+?)\)/gi, 'Math.cos($1)')
        .replace(/tangente\((.+?)\)/gi, 'Math.tan($1)')
        .replace(/abs\((.+?)\)/gi, 'Math.abs($1)')
        .replace(/trunca\((.+?)\)/gi, 'Math.trunc($1)');
    } while (processed !== previous);
    
    try {
      // Basic JS eval for math/logic
      // eslint-disable-next-line no-eval
      return eval(processed);
    } catch (e) {
      throw new Error(`Erro ao avaliar expressão: ${expr}`);
    }
  }

  private splitArgs(content: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let parenDepth = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      if (!inQuotes) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
      }
      
      if (char === ',' && !inQuotes && parenDepth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    args.push(current.trim());
    return args;
  }

  private findConditionalBlocks(lines: string[], start: number) {
    let depth = 1;
    let i = start + 1;
    const thenBlock: string[] = [];
    const elseBlock: string[] = [];
    let currentBlock = thenBlock;

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim().toLowerCase();
      if (line.startsWith('se ') || line.startsWith('se(')) depth++;
      else if (line === 'fimse') {
        depth--;
        if (depth === 0) break;
      }
      
      if (line === 'senao' && depth === 1) {
        currentBlock = elseBlock;
        i++;
        continue;
      }
      currentBlock.push(lines[i]);
      i++;
    }
    return { block: thenBlock, elseBlock, endIndex: i };
  }

  private findLoopBlock(lines: string[], start: number, endKeyword: string) {
    let depth = 1;
    let i = start + 1;
    const block: string[] = [];
    const startKeyword = lines[start].trim().split(/[ (]/)[0].toLowerCase();

    while (i < lines.length && depth > 0) {
      const line = lines[i].trim().toLowerCase();
      if (line.startsWith(startKeyword + ' ') || line.startsWith(startKeyword + '(')) depth++;
      else if (line === endKeyword) {
        depth--;
        if (depth === 0) break;
      }
      block.push(lines[i]);
      i++;
    }
    return { block, endIndex: i };
  }

  private enforceType(value: any, type: DataType): any {
    if (type === 'inteiro') {
      const num = Number(value);
      return isNaN(num) ? 0 : Math.trunc(num);
    }
    if (type === 'real') {
      const num = Number(typeof value === 'string' ? value.replace(',', '.') : value);
      return isNaN(num) ? 0 : num;
    }
    if (type === 'logico') {
      if (typeof value === 'boolean') return value;
      const s = String(value).toLowerCase();
      return s === 'verdadeiro' || s === 'v' || s === 'true';
    }
    if (type === 'literal') {
      return String(value);
    }
    return value;
  }
}
