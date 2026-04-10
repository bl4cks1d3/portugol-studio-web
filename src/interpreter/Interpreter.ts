
import { DataType, Variable, InterpreterState } from '../types';

export class PortugolInterpreter {
  private state: InterpreterState;
  private onOutput: (text: string) => void;
  private onInputRequired: (prompt: string) => Promise<string>;

  constructor(
    onOutput: (text: string) => void,
    onInputRequired: (prompt: string) => Promise<string>
  ) {
    this.onOutput = onOutput;
    this.onInputRequired = onInputRequired;
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

  public async run(code: string) {
    this.state = this.resetState();
    const lines = code.split('\n').map(l => l.trim());
    
    try {
      await this.executeBlock(lines);
    } catch (e: any) {
      this.state.error = e.message;
      this.onOutput(`\nERRO: ${e.message}`);
    }
  }

  private async executeBlock(lines: string[]) {
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) {
        i++;
        continue;
      }

      try {
        if (line.toLowerCase().startsWith('algoritmo')) {
          // Skip header
        } else if (line.toLowerCase().startsWith('fimalgoritmo')) {
          break;
        } else if (line.toLowerCase().startsWith('declare')) {
          this.handleDeclaration(line);
        } else if (line.includes('<-') || line.includes('++') || line.includes('--')) {
          this.handleAssignment(line);
        } else if (line.toLowerCase().startsWith('escreva')) {
          this.handleEscreva(line);
        } else if (line.toLowerCase().startsWith('leia')) {
          await this.handleLeia(line);
        } else if (line.toLowerCase().startsWith('se')) {
          const { nextIndex } = await this.handleSe(lines, i);
          i = nextIndex;
          continue;
        } else if (line.toLowerCase().startsWith('enquanto')) {
          const { nextIndex } = await this.handleEnquanto(lines, i);
          i = nextIndex;
          continue;
        } else if (line.toLowerCase().startsWith('para')) {
          const { nextIndex } = await this.handlePara(lines, i);
          i = nextIndex;
          continue;
        } else if (line.toLowerCase().startsWith('faca')) {
          const { nextIndex } = await this.handleFacaEnquanto(lines, i);
          i = nextIndex;
          continue;
        } else if (line.toLowerCase().startsWith('escolha')) {
          const { nextIndex } = await this.handleEscolha(lines, i);
          i = nextIndex;
          continue;
        }
      } catch (error: any) {
        throw new Error(`Erro na linha ${i + 1}: ${error.message}`);
      }
      
      i++;
    }
  }

  private async handlePara(lines: string[], startIndex: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    // para(i <- 1; i <= 100; i <- i + 1)
    const match = line.match(/para\s*\(([^;]+);([^;]+);([^)]+)\)/i);
    if (!match) throw new Error(`Sintaxe 'para' inválida na linha ${startIndex + 1}`);

    const init = match[1].trim();
    const condition = match[2].trim();
    const increment = match[3].replace(/;$/, '').trim();

    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimpara');

    // Execute init
    if (init.includes('<-')) this.handleAssignment(init);
    else if (init.toLowerCase().startsWith('declare')) this.handleDeclaration(init);

    while (this.evaluateExpression(condition)) {
      await this.executeBlock(block);
      // Execute increment
      this.handleAssignment(increment);
    }

    return { nextIndex: endIndex + 1 };
  }

  private async handleFacaEnquanto(lines: string[], startIndex: number): Promise<{ nextIndex: number }> {
    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'enquanto');
    
    // The line at endIndex is the 'enquanto(condition)' line
    const conditionLine = lines[endIndex];
    const condition = conditionLine.match(/enquanto\s*\((.*)\)/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'enquanto' de fechamento do 'faca' inválida na linha ${endIndex + 1}`);

    do {
      await this.executeBlock(block);
    } while (this.evaluateExpression(condition));

    return { nextIndex: endIndex + 1 };
  }

  private async handleEscolha(lines: string[], startIndex: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const match = line.match(/escolha\s*\((.+)\)/i);
    if (!match) throw new Error(`Sintaxe 'escolha' inválida na linha ${startIndex + 1}`);
    const value = this.evaluateExpression(match[1]);

    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimescolha');
    
    let found = false;
    for (let i = 0; i < block.length; i++) {
      const l = block[i].trim();
      const lLower = l.toLowerCase();
      if (lLower.startsWith('caso ')) {
        const casoMatch = l.match(/caso\s+(.*?):\s*(.*)/i);
        if (casoMatch) {
          const casoVal = this.evaluateExpression(casoMatch[1]);
          if (casoVal === value) {
            const sameLineCode = casoMatch[2].trim();
            if (sameLineCode) {
              await this.executeBlock([sameLineCode]);
            } else {
              const subBlock = this.getCaseBlock(block, i);
              await this.executeBlock(subBlock);
            }
            found = true;
            break;
          }
        }
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
            await this.executeBlock([sameLineCode]);
          } else {
            const subBlock = this.getCaseBlock(block, i);
            await this.executeBlock(subBlock);
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
      
      if (idx2 !== null) variable.value[idx1][idx2] = value;
      else variable.value[idx1] = value;
    } else {
      const variable = this.state.variables.get(target);
      if (!variable) throw new Error(`Variável não declarada: ${target}`);
      variable.value = value;
    }
  }

  private handleEscreva(line: string) {
    // escreva("A área é:", area);
    const content = line.match(/escreva\((.*)\);?/i)?.[1];
    if (!content) return;

    const parts = this.splitArgs(content);
    const output = parts.map(p => {
      if (p.startsWith('"') || p.startsWith("'")) {
        return p.slice(1, -1);
      }
      return this.evaluateExpression(p);
    }).join(' ');
    
    this.onOutput(output);
  }

  private async handleLeia(line: string) {
    const varName = line.match(/leia\((.*)\);?/i)?.[1].trim();
    if (!varName) return;

    const input = await this.onInputRequired(`Digite o valor para ${varName}:`);
    const variable = this.state.variables.get(varName);
    if (!variable) throw new Error(`Variável não declarada: ${varName}`);

    if (variable.type === 'inteiro') variable.value = parseInt(input);
    else if (variable.type === 'real') variable.value = parseFloat(input);
    else if (variable.type === 'logico') variable.value = input.toLowerCase() === 'verdadeiro' || input.toLowerCase() === 'v';
    else variable.value = input;
  }

  private async handleSe(lines: string[], startIndex: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const condition = line.match(/se\s*\((.*)\)\s*entao/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'se' inválida na linha ${startIndex + 1}`);

    const { block: thenBlock, elseBlock, endIndex } = this.findConditionalBlocks(lines, startIndex);
    
    const conditionResult = this.evaluateExpression(condition);
    if (conditionResult) {
      await this.executeBlock(thenBlock);
    } else if (elseBlock.length > 0) {
      await this.executeBlock(elseBlock);
    }

    return { nextIndex: endIndex + 1 };
  }

  private async handleEnquanto(lines: string[], startIndex: number): Promise<{ nextIndex: number }> {
    const line = lines[startIndex];
    const condition = line.match(/enquanto\s*\((.*)\)/i)?.[1];
    if (!condition) throw new Error(`Sintaxe 'enquanto' inválida na linha ${startIndex + 1}`);

    const { block, endIndex } = this.findLoopBlock(lines, startIndex, 'fimenquanto');
    
    while (this.evaluateExpression(condition)) {
      await this.executeBlock(block);
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

    // Handle Portugol specific operators and functions
    processed = processed
      .replace(/&&/g, '&&')
      .replace(/\|\|/g, '||')
      .replace(/!/g, '!')
      .replace(/%/g, '%')
      .replace(/resto\((.+?),\s*(.+?)\)/gi, '($1 % $2)')
      .replace(/raizquadrada\((.+?)\)/gi, 'Math.sqrt($1)')
      .replace(/potencia\((.+?),\s*(.+?)\)/gi, 'Math.pow($1, $2)')
      .replace(/seno\((.+?)\)/gi, 'Math.sin($1)')
      .replace(/sen\((.+?)\)/gi, 'Math.sin($1)')
      .replace(/cosseno\((.+?)\)/gi, 'Math.cos($1)')
      .replace(/tangente\((.+?)\)/gi, 'Math.tan($1)')
      .replace(/abs\((.+?)\)/gi, 'Math.abs($1)')
      .replace(/trunca\((.+?)\)/gi, 'Math.floor($1)');
    
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
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      if (char === ',' && !inQuotes) {
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
}
