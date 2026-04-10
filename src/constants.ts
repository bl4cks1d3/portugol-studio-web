
export interface Example {
  id: string;
  title: string;
  category: string;
  code: string;
  description: string;
  order?: number;
}

export const CATEGORIZED_EXAMPLES: { [category: string]: Example[] } = {
  "Entrada e Saída": [
    {
      id: "ola-mundo",
      title: "Olá Mundo",
      category: "Entrada e Saída",
      description: "O primeiro programa em qualquer linguagem.",
      code: `Algoritmo OlaMundo()
escreva("Olá Mundo!");
fimalgoritmo`
    },
    {
      id: "numero-digitado",
      title: "Número Digitado",
      category: "Entrada e Saída",
      description: "Lê um número e o exibe de volta.",
      code: `Algoritmo NumeroDigitado()
declare n inteiro;
escreva("Digite um número:");
leia(n);
escreva("Você digitou o número:", n);
fimalgoritmo`
    },
    {
      id: "seu-nome",
      title: "Seu Nome",
      category: "Entrada e Saída",
      description: "Lê um nome e exibe uma saudação.",
      code: `Algoritmo Saudacao()
declare nome literal;
escreva("Qual o seu nome?");
leia(nome);
escreva("Olá", nome, ", seja bem-vindo!");
fimalgoritmo`
    }
  ],
  "Operações Aritméticas": [
    {
      id: "operacoes-simples",
      title: "Operações Simples",
      category: "Operações Aritméticas",
      description: "Soma, subtração, multiplicação e divisão.",
      code: `Algoritmo Operacoes()
declare a, b real;
a <- 10;
b <- 3;
escreva("A =", a, "e B =", b);
escreva("Soma:", a + b);
escreva("Subtração:", a - b);
escreva("Multiplicação:", a * b);
escreva("Divisão:", a / b);
fimalgoritmo`
    },
    {
      id: "prioridades",
      title: "Prioridades",
      category: "Operações Aritméticas",
      description: "Demonstra a ordem de precedência dos operadores.",
      code: `Algoritmo Prioridades()
declare res real;
res <- (2 + 3) * 4;
escreva("(2 + 3) * 4 =", res);
res <- 2 + 3 * 4;
escreva("2 + 3 * 4 =", res);
fimalgoritmo`
    },
    {
      id: "divisoes-inteiras",
      title: "Divisões Inteiras",
      category: "Operações Aritméticas",
      description: "Uso do operador de resto.",
      code: `Algoritmo RestoDivisao()
declare a, b, r inteiro;
a <- 10;
b <- 3;
r <- resto(a, b);
escreva("O resto da divisão de", a, "por", b, "é:", r);
fimalgoritmo`
    },
    {
      id: "potencia-raiz",
      title: "Potencia e Raiz",
      category: "Operações Aritméticas",
      description: "Cálculos de potência e raiz quadrada.",
      code: `Algoritmo PotenciaRaiz()
declare base, exp, num real;
base <- 2;
exp <- 3;
num <- 16;
escreva(base, "elevado a", exp, "é:", potencia(base, exp));
escreva("A raiz quadrada de", num, "é:", raizquadrada(num));
fimalgoritmo`
    }
  ],
  "Algoritmos Sequenciais": [
    {
      id: "troca-variaveis",
      title: "Troca Variáveis",
      category: "Algoritmos Sequenciais",
      description: "Troca o valor de duas variáveis usando uma auxiliar.",
      code: `Algoritmo Troca()
declare a, b, aux inteiro;
escreva("Digite o valor de A:");
leia(a);
escreva("Digite o valor de B:");
leia(b);
aux <- a;
a <- b;
b <- aux;
escreva("Valores trocados: A =", a, "B =", b);
fimalgoritmo`
    },
    {
      id: "maioridade-penal",
      title: "Maioridade Penal",
      category: "Algoritmos Sequenciais",
      description: "Verifica se o usuário atingiu a maioridade penal.",
      code: `Algoritmo Maioridade()
declare idade inteiro;
escreva("Digite sua idade:");
leia(idade);
se (idade >= 18) entao
  escreva("Você já atingiu a maioridade penal.");
senao
  escreva("Você ainda não atingiu a maioridade penal.");
fimse
fimalgoritmo`
    },
    {
      id: "altura-media",
      title: "Altura média",
      category: "Algoritmos Sequenciais",
      description: "Calcula a média de altura de 3 pessoas.",
      code: `Algoritmo AlturaMedia()
declare h1, h2, h3, media real;
escreva("Altura da pessoa 1:");
leia(h1);
escreva("Altura da pessoa 2:");
leia(h2);
escreva("Altura da pessoa 3:");
leia(h3);
media <- (h1 + h2 + h3) / 3;
escreva("A média das alturas é:", media);
fimalgoritmo`
    }
  ],
  "Desvios Condicionais": [
    {
      id: "vogal",
      title: "Vogal",
      category: "Desvios Condicionais",
      description: "Verifica se uma letra é vogal.",
      code: `Algoritmo EhVogal()
declare letra literal;
escreva("Digite uma letra minúscula:");
leia(letra);
se (letra == "a" || letra == "e" || letra == "i" || letra == "o" || letra == "u") entao
  escreva("É uma vogal.");
senao
  escreva("Não é uma vogal.");
fimse
fimalgoritmo`
    },
    {
      id: "medias",
      title: "Médias",
      category: "Desvios Condicionais",
      description: "Calcula média e diz se foi aprovado.",
      code: `Algoritmo Medias()
declare n1, n2, media real;
escreva("Nota 1:");
leia(n1);
escreva("Nota 2:");
leia(n2);
media <- (n1 + n2) / 2;
escreva("Média:", media);
se (media >= 7) entao
  escreva("Aprovado!");
senao
  se (media >= 5) entao
    escreva("Recuperação.");
  senao
    escreva("Reprovado.");
  fimse
fimse
fimalgoritmo`
    },
    {
      id: "escolha-caso",
      title: "Escolha-Caso (Dias)",
      category: "Desvios Condicionais",
      description: "Exemplo de uso da estrutura escolha para dias da semana.",
      code: `Algoritmo ExemploEscolha()
declare dia inteiro;
escreva("Digite o dia da semana (1-7):");
leia(dia);
escolha(dia)
  caso 1: escreva("Domingo");
  caso 2: escreva("Segunda-feira");
  caso 3: escreva("Terça-feira");
  caso 4: escreva("Quarta-feira");
  caso 5: escreva("Quinta-feira");
  caso 6: escreva("Sexta-feira");
  caso 7: escreva("Sábado");
  caso contrario: escreva("Dia inválido!");
fimescolha
fimalgoritmo`
    },
    {
      id: "escolha-calculadora",
      title: "Escolha-Caso (Calculadora)",
      category: "Desvios Condicionais",
      description: "Uma calculadora simples usando escolha-caso.",
      code: `Algoritmo Calculadora()
declare n1, n2 real;
declare op literal;
escreva("Digite o primeiro número:");
leia(n1);
escreva("Digite o segundo número:");
leia(n2);
escreva("Digite a operação (+, -, *, /):");
leia(op);

escolha(op)
  caso "+": escreva("Resultado:", n1 + n2);
  caso "-": escreva("Resultado:", n1 - n2);
  caso "*": escreva("Resultado:", n1 * n2);
  caso "/": 
    se (n2 != 0) entao
      escreva("Resultado:", n1 / n2);
    senao
      escreva("Erro: Divisão por zero!");
    fimse
  caso contrario: escreva("Operação inválida!");
fimescolha
fimalgoritmo`
    }
  ],
  "Laços de Repetição": [
    {
      id: "contagem-regressiva",
      title: "Contagem Regressiva",
      category: "Laços de Repetição",
      description: "Contagem de 10 até 0.",
      code: `Algoritmo Regressiva()
declare i inteiro;
para (i <- 10; i >= 0; i <- i - 1)
  escreva(i);
fimpara
escreva("FOGO!");
fimalgoritmo`
    },
    {
      id: "tabuada",
      title: "Tabuada",
      category: "Laços de Repetição",
      description: "Mostra a tabuada de um número.",
      code: `Algoritmo Tabuada()
declare n, i inteiro;
escreva("Tabuada de qual número?");
leia(n);
para (i <- 1; i <= 10; i <- i + 1)
  escreva(n, "x", i, "=", n * i);
fimpara
fimalgoritmo`
    },
    {
      id: "fatorial",
      title: "Fatorial",
      category: "Laços de Repetição",
      description: "Calcula o fatorial de um número.",
      code: `Algoritmo Fatorial()
declare n, i, fat inteiro;
escreva("Calcular fatorial de:");
leia(n);
fat <- 1;
para (i <- n; i > 1; i <- i - 1)
  fat <- fat * i;
fimpara
escreva("Fatorial de", n, "é:", fat);
fimalgoritmo`
    },
    {
      id: "imprime-100",
      title: "Imprime até 100 (Enquanto)",
      category: "Laços de Repetição",
      description: "Exemplo do livro: imprimir números de 1 a 100 usando enquanto.",
      code: `Algoritmo ImprimeAte100()
declare i inteiro;
i <- 1;
enquanto(i <= 100)
  escreva(i);
  i <- i + 1;
fimenquanto
fimalgoritmo`
    },
    {
      id: "soma-ate-n",
      title: "Soma até N (Para)",
      category: "Laços de Repetição",
      description: "Soma todos os números de 1 até N usando para.",
      code: `Algoritmo SomaAteN()
declare n, i, soma inteiro;
escreva("Somar até qual número?");
leia(n);
soma <- 0;
para (i <- 1; i <= n; i <- i + 1)
  soma <- soma + i;
fimpara
escreva("A soma total é:", soma);
fimalgoritmo`
    },
    {
      id: "pares-para",
      title: "Números Pares (Para)",
      category: "Laços de Repetição",
      description: "Imprime números pares entre 1 e 20 usando para.",
      code: `Algoritmo ParesPara()
declare i inteiro;
para (i <- 2; i <= 20; i <- i + 2)
  escreva(i);
fimpara
fimalgoritmo`
    }
  ],
  "Tutoriais: Funções": [
    {
      id: "tutorial-resto",
      title: "Função: resto()",
      category: "Tutoriais: Funções",
      description: "Retorna o resto da divisão entre dois números inteiros.",
      code: `Algoritmo TutorialResto()
declare a, b, r inteiro;
a <- 10;
b <- 3;
// resto(10, 3) resulta em 1, pois 10 = 3 * 3 + 1
r <- resto(a, b);
escreva("O resto de 10 dividido por 3 é:", r);
fimalgoritmo`
    },
    {
      id: "tutorial-potencia",
      title: "Função: potencia()",
      category: "Tutoriais: Funções",
      description: "Eleva uma base a um determinado expoente.",
      code: `Algoritmo TutorialPotencia()
declare base, exp, res real;
base <- 2;
exp <- 3;
// potencia(2, 3) é o mesmo que 2 * 2 * 2
res <- potencia(base, exp);
escreva("2 elevado a 3 é:", res);
fimalgoritmo`
    },
    {
      id: "tutorial-raiz",
      title: "Função: raizquadrada()",
      category: "Tutoriais: Funções",
      description: "Calcula a raiz quadrada de um número positivo.",
      code: `Algoritmo TutorialRaiz()
declare n, res real;
n <- 25;
res <- raizquadrada(n);
escreva("A raiz quadrada de 25 é:", res);
fimalgoritmo`
    },
    {
      id: "tutorial-trunca",
      title: "Função: trunca()",
      category: "Tutoriais: Funções",
      description: "Remove as casas decimais de um número, arredondando para baixo.",
      code: `Algoritmo TutorialTrunca()
declare n, res real;
n <- 9.75;
// trunca(9.75) resulta em 9
res <- trunca(n);
escreva("O valor 9.75 truncado é:", res);
fimalgoritmo`
    },
    {
      id: "tutorial-seno",
      title: "Função: seno() / sen()",
      category: "Tutoriais: Funções",
      description: "Calcula o seno de um ângulo (em radianos).",
      code: `Algoritmo TutorialSeno()
declare angulo, s real;
angulo <- 1.5708; // Aproximadamente 90 graus em radianos
s <- seno(angulo);
escreva("O seno de 90 graus (em radianos) é:", s);
// Também pode usar sen()
s <- sen(0);
escreva("O seno de 0 é:", s);
fimalgoritmo`
    },
    {
      id: "tutorial-completo",
      title: "Exemplo Completo",
      category: "Tutoriais: Funções",
      description: "Uso de várias funções matemáticas em um único algoritmo.",
      code: `Algoritmo ExemploMatematico()
declare x, y real;
x <- -5.8;
escreva("Valor original:", x);
escreva("Valor absoluto (abs):", abs(x));
escreva("Valor truncado (trunca):", trunca(x));
escreva("2 elevado a 10:", potencia(2, 10));
escreva("Raiz de 144:", raizquadrada(144));
escreva("Resto de 15 por 4:", resto(15, 4));
fimalgoritmo`
    }
  ],
  "Vetores e Matrizes": [
    {
      id: "exibe-vetor",
      title: "Preenche e Exibe Vetor",
      category: "Vetores e Matrizes",
      description: "Lê 5 números e os exibe.",
      code: `Algoritmo ExemploVetor()
declare v[5], i inteiro;
para (i <- 0; i < 5; i <- i + 1)
  escreva("Digite o valor para a posição", i, ":");
  leia(v[i]);
fimpara
escreva("Vetor preenchido:");
para (i <- 0; i < 5; i <- i + 1)
  escreva(v[i]);
fimpara
fimalgoritmo`
    }
  ],
  "Exercícios de Fixação": [
    {
      id: "fixacao-3-1",
      title: "Exercício 3.1: Maioridade",
      category: "Exercícios de Fixação",
      description: "Escreva um algoritmo que leia a idade de uma pessoa em anos (inteiro) e escreva se está na maioridade.",
      code: `Algoritmo Maioridade()
declare idade inteiro;
escreva("Digite sua idade:");
leia(idade);
se (idade >= 18) entao
  escreva("Você está na maioridade.");
senao
  escreva("Você não está na maioridade.");
fimse
fimalgoritmo`
    },
    {
      id: "fixacao-4-1",
      title: "Exercício 4.1: Números entre 50 e 100",
      category: "Exercícios de Fixação",
      description: "Imprimir todos os números inteiros entre 50 e 100.",
      code: `Algoritmo Entre50e100()
declare i inteiro;
para (i <- 50; i <= 100; i <- i + 1)
  escreva(i);
fimpara
fimalgoritmo`
    }
  ]
};

export const INITIAL_QUESTIONS = [];
