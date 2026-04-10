
export class CodeFormatter {
  public static format(code: string): string {
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2;

    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      const lower = trimmed.toLowerCase();

      // Keywords that decrease indent BEFORE the line is printed
      const decreasesBefore = 
        lower.startsWith('fimse') || 
        lower.startsWith('fimenquanto') || 
        lower.startsWith('fimpara') || 
        lower.startsWith('fimescolha') ||
        lower.startsWith('senao') ||
        lower.startsWith('fimalgoritmo');

      // 'caso' is special: it should be at the same level as other cases, 
      // but indented relative to 'escolha'.
      const isCaso = lower.startsWith('caso ');

      if (decreasesBefore) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // If it's a 'caso', we temporarily decrease indent for the line itself 
      // if it's not the first thing after 'escolha', but actually it's easier 
      // to just manage it with the opening/closing logic.
      
      const formattedLine = ' '.repeat(indentLevel * indentSize) + trimmed;

      // Keywords that increase indent AFTER the line is printed
      const increasesAfter = 
        lower.endsWith('entao') || 
        lower.endsWith('faca') || 
        lower.startsWith('escolha') || 
        lower.startsWith('senao') ||
        lower.startsWith('algoritmo');

      if (increasesAfter) {
        indentLevel++;
      }

      return formattedLine;
    }).join('\n');
  }
}
