
import Prism from 'prismjs';

Prism.languages.portugol = {
  'comment': /\/\/.*|\/\*[\s\S]*?\*\//,
  'string': {
    pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'keyword': /\b(?:Algoritmo|fimalgoritmo|declare|escreva|leia|se|entao|senao|fimse|enquanto|fimenquanto|para|fimpara|faca|escolha|caso|caso contrario|fimescolha|retorna|real|inteiro|literal|logico|seno|sen|cosseno|tangente|abs|trunca|potencia|raizquadrada|resto)\b/i,
  'boolean': /\b(?:verdadeiro|falso|V|F|T)\b/i,
  'number': /\b\d+(?:\.\d+)?\b/,
  'operator': /<-|==|!=|<=|>=|<|>|\+|\-|\*|\/|\\|&&|\|\||!/,
  'punctuation': /[()\[\],;]/
};
