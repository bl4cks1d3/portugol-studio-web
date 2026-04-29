
export interface SyntaxError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export class SyntaxAnalyzer {
  private static readonly KEYWORDS: Set<string> = new Set([
    'algoritmo', 'fimalgoritmo', 'declare', 'inteiro', 'real', 'literal', 'logico',
    'escreva', 'leia', 'se', 'entao', 'senao', 'fimse', 'enquanto', 'fimenquanto',
    'para', 'fimpara', 'faca', 'escolha', 'caso', 'contrario', 'fimescolha', 'verdadeiro', 'falso',
    'resto', 'raizquadrada', 'potencia', 'abs', 'trunca', 'seno', 'sen', 'cosseno', 'tangente'
  ]);

  private static getIdentifiers(expr: string): string[] {
    // Remove string literals and then remove literal \n tokens
    const noStrings = expr.replace(/"[^"]*"|'[^']*'/g, ' ').replace(/\\n/g, ' ');
    // Match identifiers (words starting with letter/underscore)
    const matches = (noStrings.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []) as string[];
    return matches.filter(id => !SyntaxAnalyzer.KEYWORDS.has(id.toLowerCase()) && isNaN(Number(id)));
  }

  public static analyze(code: string): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const lines = code.split('\n');
    const stack: { type: string; line: number }[] = [];
    const declaredVariables = new Set<string>();

    let hasAlgoritmo = false;
    let hasFimalgoritmo = false;

    // First pass: Collect all declared variables
    lines.forEach((line) => {
      const lineWithoutComment = line.split('//')[0].trim();
      if (lineWithoutComment.toLowerCase().startsWith('declare')) {
        const match = lineWithoutComment.match(/declare\s+(.+)\s+(inteiro|real|literal|logico)/i);
        if (match) {
          const namesPart = match[1];
          const names = namesPart.split(',').map(n => n.trim().split('[')[0].trim());
          names.forEach(name => {
            if (name) declaredVariables.add(name.toLowerCase());
          });
        }
      }
    });

    let globalParenBalance = 0;
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const lineWithoutComment = line.split('//')[0].trim();
      if (!lineWithoutComment) return;

      const lowerLine = lineWithoutComment.toLowerCase();

      // Parentheses balance tracking (moved up to handle multi-line)
      let currentLineOpenParen = 0;
      let currentLineCloseParen = 0;
      let inQuotes = false;
      let quoteChar = '';
      
      for (let i = 0; i < lineWithoutComment.length; i++) {
        const char = lineWithoutComment[i];
        if ((char === '"' || char === "'") && (i === 0 || lineWithoutComment[i-1] !== '\\')) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
          }
        }
        if (!inQuotes) {
          if (char === '(') {
            currentLineOpenParen++;
            globalParenBalance++;
          }
          if (char === ')') {
            currentLineCloseParen++;
            globalParenBalance--;
          }
        }
      }

      // Basic structure checks
      if (lowerLine.startsWith('algoritmo')) {
        if (hasAlgoritmo) {
          errors.push({ line: lineNumber, message: "Múltiplas definições de 'Algoritmo'", severity: 'error' });
        }
        hasAlgoritmo = true;
      }

      if (lowerLine.startsWith('declare')) {
        const match = lineWithoutComment.match(/declare\s+(.+)\s+(inteiro|real|literal|logico)/i);
        if (!match) {
          errors.push({ line: lineNumber, message: "Declaração incorreta. Use: declare variavel tipo (inteiro, real, literal, logico)", severity: 'error' });
        }
      }

      if (lowerLine.startsWith('fimalgoritmo')) {
        hasFimalgoritmo = true;
      }

      // Block tracking
      if (lowerLine.startsWith('se ') || lowerLine.startsWith('se(')) {
        const match = lineWithoutComment.match(/se\s*\((.*)\)\s*entao/i);
        if (match) {
          const identifiers = this.getIdentifiers(match[1]);
          identifiers.forEach(id => {
            if (!declaredVariables.has(id.toLowerCase())) {
              errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
            }
          });
        } else if (!lowerLine.includes('entao')) {
          errors.push({ line: lineNumber, message: "Faltando 'entao' após a condição do 'se'", severity: 'error' });
        }
        stack.push({ type: 'se', line: lineNumber });
      } else if (lowerLine === 'senao' || lowerLine.startsWith('senao ')) {
        const last = stack[stack.length - 1];
        if (!last || last.type !== 'se') {
          errors.push({ line: lineNumber, message: "'senao' fora de um bloco 'se'", severity: 'error' });
        }
      } else if (lowerLine.startsWith('fimse')) {
        const last = stack.pop();
        if (!last || last.type !== 'se') {
          errors.push({ line: lineNumber, message: "'fimse' sem um 'se' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('enquanto')) {
        const match = lineWithoutComment.match(/enquanto\s*\((.*)\)/i);
        if (match) {
          const identifiers = this.getIdentifiers(match[1]);
          identifiers.forEach(id => {
            if (!declaredVariables.has(id.toLowerCase())) {
              errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
            }
          });
        }
        stack.push({ type: 'enquanto', line: lineNumber });
      } else if (lowerLine.startsWith('fimenquanto')) {
        const last = stack.pop();
        if (!last || last.type !== 'enquanto') {
          errors.push({ line: lineNumber, message: "'fimenquanto' sem um 'enquanto' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('para')) {
        stack.push({ type: 'para', line: lineNumber });
      } else if (lowerLine.startsWith('fimpara')) {
        const last = stack.pop();
        if (!last || last.type !== 'para') {
          errors.push({ line: lineNumber, message: "'fimpara' sem um 'para' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('escolha')) {
        const match = lineWithoutComment.match(/escolha\((.*)\)/i);
        if (match) {
          const identifiers = this.getIdentifiers(match[1]);
          identifiers.forEach(id => {
            if (!declaredVariables.has(id.toLowerCase())) {
              errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
            }
          });
        }
        stack.push({ type: 'escolha', line: lineNumber });
      } else if (lowerLine.startsWith('caso ')) {
        if (!lowerLine.startsWith('caso contrario:')) {
          const match = lineWithoutComment.match(/caso\s+(.*?):/i);
          if (match) {
            const identifiers = this.getIdentifiers(match[1]);
            identifiers.forEach(id => {
              if (!declaredVariables.has(id.toLowerCase())) {
                errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
              }
            });
          }
        }
      } else if (lowerLine.startsWith('fimescolha')) {
        const last = stack.pop();
        if (!last || last.type !== 'escolha') {
          errors.push({ line: lineNumber, message: "'fimescolha' sem um 'escolha' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      }

      // Variable usage checks
      if (lineWithoutComment.includes('<-')) {
        const parts = lineWithoutComment.split('<-');
        const targetPart = parts[0].trim();
        const target = targetPart.split('[')[0].trim();
        
        // Check target variable
        if (!declaredVariables.has(target.toLowerCase()) && 
            !['algoritmo', 'fimalgoritmo', 'se', 'enquanto', 'para', 'escolha'].some(k => target.toLowerCase().startsWith(k))) {
           
           const isParaVar = stack.some(s => s.type === 'para' && s.line === lineNumber);
           if (!isParaVar) {
             errors.push({ line: lineNumber, message: `Variável '${target}' não foi declarada`, severity: 'error' });
           }
        }

        // Check expression variables
        if (parts[1]) {
          const identifiers = this.getIdentifiers(parts[1]);
          identifiers.forEach(id => {
            if (!declaredVariables.has(id.toLowerCase())) {
              errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
            }
          });
        }
      }

      if (lowerLine.startsWith('leia(')) {
        const match = lineWithoutComment.match(/leia\((.*?)\)/i);
        if (match) {
          const varName = match[1].trim().split('[')[0].trim();
          if (varName && !declaredVariables.has(varName.toLowerCase())) {
            errors.push({ line: lineNumber, message: `Variável '${varName}' no 'leia' não foi declarada`, severity: 'error' });
          }
        }
      }

      if (lowerLine.startsWith('escreva(')) {
        const match = lineWithoutComment.match(/escreva\((.*)\)/i);
        if (match) {
          const content = match[1];
          const identifiers = this.getIdentifiers(content);
          identifiers.forEach(id => {
            if (!declaredVariables.has(id.toLowerCase())) {
              errors.push({ line: lineNumber, message: `Variável '${id}' não foi declarada`, severity: 'error' });
            }
          });
        }
      }

      // Semicolon check
      const needsSemicolon = lowerLine.startsWith('declare') || 
                            (lineWithoutComment.includes('<-') && !stack.some(s => s.type === 'para' && s.line === lineNumber)) ||
                            lowerLine.startsWith('escreva(') ||
                            lowerLine.startsWith('leia(');

      // Only warn about semicolon if parentheses are balanced (not in the middle of a command)
      if (needsSemicolon && !lineWithoutComment.endsWith(';') && globalParenBalance === 0) {
        errors.push({ line: lineNumber, message: "Faltando ';' ao final da instrução", severity: 'warning' });
      }
    });

    if (globalParenBalance !== 0) {
      errors.push({ line: lines.length, message: "Parênteses não balanceados no código", severity: 'error' });
    }

    if (!hasAlgoritmo) {
      errors.push({ line: 1, message: "O algoritmo deve começar com 'Algoritmo Nome()'", severity: 'error' });
    }
    if (!hasFimalgoritmo) {
      errors.push({ line: lines.length, message: "Faltando 'fimalgoritmo' ao final do código", severity: 'error' });
    }

    while (stack.length > 0) {
      const last = stack.pop()!;
      errors.push({ line: last.line, message: `Bloco '${last.type}' aberto na linha ${last.line} não foi fechado`, severity: 'error' });
    }

    return errors;
  }
}
