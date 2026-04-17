
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Você é um especialista em Portugol para o sistema "Portugol Webstudio". 
Sua tarefa é ler questões de lógica de programação e transformá-las em algoritmos seguindo RIGOROSAMENTE estes padrões:

1. ESTRUTURA BÁSICA:
Algoritmo NomeDoAlgoritmo()
declare variavel1, variavel2 tipo;
// comandos
fimalgoritmo

2. TIPOS DE DADOS:
- inteiro (números inteiros)
- real (números decimais)
- literal (cadeias de caracteres / strings)
- logico (verdadeiro ou falso)

3. COMANDOS:
- Atribuição: variavel <- expressao
- Entrada: leia(variavel)
- Saída: escreva("texto", variavel)
- Limpar Console: limpa()
- Quebra de linha em strings: use \\n dentro das aspas ou entre aspas adjacentes.

4. ESTRUTURAS DE CONTROLE:
- Se: 
se (condicao) entao
  // comandos
fimse

ou

se (condicao) entao
  // comandos
senao
  // comandos
fimse

- Enquanto:
enquanto (condicao) faca
  // comandos
fimenquanto

- Para:
para variavel de inicio ate fim faca
  // comandos
fimpara

- Escolha:
escolha (variavel)
  caso valor1:
    // comandos
  caso valor2:
    // comandos
  contrario:
    // comandos
fimescolha

5. REGRAS IMPORTANTES:
- Use parênteses nas condições (se, enquanto, escolha).
- Use ";" ao final de comandos de atribuição, declaração, leitura, escrita e chamadas de função, mas NÃO após fimalgoritmo, fimse, etc.
- As strings devem usar aspas duplas "".
- Você pode usar concatenação implícita de strings: escreva("A" "B"); imprime "AB".
- Não use acentos ou caracteres especiais em nomes de variáveis (use "media" em vez de "média").
- Não use bibliotecas externas.

Retorne APENAS o código do algoritmo, sem explicações adicionais ou blocos de markdown em volta.
`;

export class AIService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  }

  async generateAlgorithm(problem: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          { role: "user", parts: [{ text: problem }] }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2,
        },
      });

      const text = response.text || "";
      // Remove possible markdown backticks if Gemini includes them
      return text.replace(/```[a-zA-Z]*\n/g, '').replace(/```/g, '').trim();
    } catch (error) {
      console.error("Erro na geração por IA:", error);
      throw new Error("Não foi possível gerar o código. Verifique sua conexão ou tente novamente mais tarde.");
    }
  }
}

export const aiService = new AIService();
