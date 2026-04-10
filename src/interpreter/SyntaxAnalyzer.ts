
export interface SyntaxError {
  line: number;
  message: string;
  severity: 'error' | 'warning';
}

export class SyntaxAnalyzer {
  public static analyze(code: string): SyntaxError[] {
    const errors: SyntaxError[] = [];
    const lines = code.split('\n');
    const stack: { type: string; line: number }[] = [];

    let hasAlgoritmo = false;
    let hasFimalgoritmo = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const lineNumber = index + 1;

      if (!trimmedLine || trimmedLine.startsWith('//')) return;

      const lowerLine = trimmedLine.toLowerCase();

      // Basic structure checks
      if (lowerLine.startsWith('algoritmo')) {
        if (hasAlgoritmo) {
          errors.push({ line: lineNumber, message: "Múltiplas definições de 'Algoritmo'", severity: 'error' });
        }
        hasAlgoritmo = true;
      }

      if (lowerLine.startsWith('fimalgoritmo')) {
        hasFimalgoritmo = true;
      }

      // Block tracking
      if (lowerLine.startsWith('se ') || lowerLine.startsWith('se(')) {
        if (!lowerLine.includes('entao')) {
          errors.push({ line: lineNumber, message: "Faltando 'entao' após a condição do 'se'", severity: 'error' });
        }
        stack.push({ type: 'se', line: lineNumber });
      } else if (lowerLine === 'fimse') {
        const last = stack.pop();
        if (!last || last.type !== 'se') {
          errors.push({ line: lineNumber, message: "'fimse' sem um 'se' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('enquanto')) {
        stack.push({ type: 'enquanto', line: lineNumber });
      } else if (lowerLine === 'fimenquanto') {
        const last = stack.pop();
        if (!last || last.type !== 'enquanto') {
          errors.push({ line: lineNumber, message: "'fimenquanto' sem um 'enquanto' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('para')) {
        stack.push({ type: 'para', line: lineNumber });
      } else if (lowerLine === 'fimpara') {
        const last = stack.pop();
        if (!last || last.type !== 'para') {
          errors.push({ line: lineNumber, message: "'fimpara' sem um 'para' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      } else if (lowerLine.startsWith('escolha')) {
        stack.push({ type: 'escolha', line: lineNumber });
      } else if (lowerLine === 'fimescolha') {
        const last = stack.pop();
        if (!last || last.type !== 'escolha') {
          errors.push({ line: lineNumber, message: "'fimescolha' sem um 'escolha' correspondente", severity: 'error' });
          if (last) stack.push(last);
        }
      }

      // Semicolon check for declarations and assignments
      if (lowerLine.startsWith('declare') && !trimmedLine.endsWith(';')) {
        errors.push({ line: lineNumber, message: "Faltando ';' ao final da declaração", severity: 'warning' });
      }
      
      // Assignment check
      if (trimmedLine.includes('<-') && !trimmedLine.endsWith(';') && !stack.some(s => s.type === 'para')) {
        // Para header doesn't need semicolon at the end of the line
      }

      // Parentheses balance
      const openParen = (trimmedLine.match(/\(/g) || []).length;
      const closeParen = (trimmedLine.match(/\)/g) || []).length;
      if (openParen !== closeParen) {
        errors.push({ line: lineNumber, message: "Parênteses não balanceados", severity: 'error' });
      }
    });

    if (!hasAlgoritmo) {
      errors.push({ line: 1, message: "O algoritmo deve começar com 'Algoritmo Nome()'", severity: 'error' });
    }
    if (!hasFimalgoritmo) {
      errors.push({ line: lines.length, message: "Faltando 'fimalgoritmo' ao final do código", severity: 'error' });
    }

    while (stack.length > 0) {
      const last = stack.pop()!;
      errors.push({ line: last.line, message: `Bloco '${last.type}' não foi fechado corretamente`, severity: 'error' });
    }

    return errors;
  }
}
