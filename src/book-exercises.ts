
import { Example } from './constants';

export const BOOK_EXERCISES: { [category: string]: Example[] } = {
  "Cap 2: Estrutura Sequencial": [
    {
      id: "ex-2-1",
      title: "Ex 2.1: Peso em Libras",
      category: "Cap 2: Estrutura Sequencial",
      description: "Converte peso de Kg para Libras.",
      code: `Algoritmo PesoLibras()
declare pesoKg, pesoLb real;
escreva("Digite o peso em Kg:");
leia(pesoKg);
pesoLb <- pesoKg * 2.20462;
escreva("O peso em libras é:", pesoLb);
fimalgoritmo`
    },
    {
      id: "ex-2-2",
      title: "Ex 2.2: Celsius para Fahrenheit",
      category: "Cap 2: Estrutura Sequencial",
      description: "Converte temperatura de Celsius para Fahrenheit.",
      code: `Algoritmo ConverteTemp()
declare c, f real;
escreva("Temperatura em Celsius:");
leia(c);
f <- (9/5) * c + 32;
escreva("Em Fahrenheit:", f);
fimalgoritmo`
    },
    {
      id: "ex-2-4",
      title: "Ex 2.4: Hipotenusa",
      category: "Cap 2: Estrutura Sequencial",
      description: "Calcula a hipotenusa de um triângulo retângulo.",
      code: `Algoritmo Hipotenusa()
declare cat1, cat2, hip real;
escreva("Cateto 1:"); leia(cat1);
escreva("Cateto 2:"); leia(cat2);
hip <- raizquadrada(potencia(cat1, 2) + potencia(cat2, 2));
escreva("A hipotenusa é:", hip);
fimalgoritmo`
    },
    {
      id: "ex-2-6",
      title: "Ex 2.6: Idade em Dias",
      category: "Cap 2: Estrutura Sequencial",
      description: "Converte anos, meses e dias para total de dias.",
      code: `Algoritmo IdadeDias()
declare anos, meses, dias, total inteiro;
escreva("Anos:"); leia(anos);
escreva("Meses:"); leia(meses);
escreva("Dias:"); leia(dias);
total <- (anos * 365) + (meses * 30) + dias;
escreva("Total de dias:", total);
fimalgoritmo`
    },
    {
      id: "ex-2-7",
      title: "Ex 2.7: Inverter Número",
      category: "Cap 2: Estrutura Sequencial",
      description: "Inverte um número de 3 algarismos.",
      code: `Algoritmo Inverte()
declare num, d1, d2, d3, inv inteiro;
escreva("Digite um número de 3 dígitos:");
leia(num);
d1 <- num / 100;
d2 <- resto(num / 10, 10);
d3 <- resto(num, 10);
inv <- (d3 * 100) + (d2 * 10) + d1;
escreva("Invertido:", inv);
fimalgoritmo`
    },
    {
      id: "ex-2-11",
      title: "Ex 2.11: Volume Pirâmide",
      category: "Cap 2: Estrutura Sequencial",
      description: "Calcula o volume de uma pirâmide.",
      code: `Algoritmo VolumePiramide()
declare base, altura, volume real;
escreva("Área da base:"); leia(base);
escreva("Altura:"); leia(altura);
volume <- (1/3) * base * altura;
escreva("Volume:", volume);
fimalgoritmo`
    },
    {
      id: "ex-2-19",
      title: "Ex 2.19: Decompor Notas",
      category: "Cap 2: Estrutura Sequencial",
      description: "Decompõe um valor em notas de 100, 50, 10, 5 e 1.",
      code: `Algoritmo Notas()
declare valor, n100, n50, n10, n5, n1 inteiro;
escreva("Valor em Reais:"); leia(valor);
n100 <- valor / 100;
valor <- resto(valor, 100);
n50 <- valor / 50;
valor <- resto(valor, 50);
n10 <- valor / 10;
valor <- resto(valor, 10);
n5 <- valor / 5;
n1 <- resto(valor, 5);
escreva("Notas de 100:", n100);
escreva("Notas de 50:", n50);
escreva("Notas de 10:", n10);
escreva("Notas de 5:", n5);
escreva("Notas de 1:", n1);
fimalgoritmo`
    }
  ],
  "Cap 3: Estruturas Condicionais": [
    {
      id: "ex-3-1",
      title: "Ex 3.1: Maioridade",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica se é maior de idade.",
      code: `Algoritmo Maioridade()
declare idade inteiro;
escreva("Idade:"); leia(idade);
se (idade >= 18) entao
  escreva("Maior de idade");
senao
  escreva("Menor de idade");
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-3",
      title: "Ex 3.3: Faixa Etária",
      category: "Cap 3: Estruturas Condicionais",
      description: "Classifica em criança, adolescente ou adulto.",
      code: `Algoritmo FaixaEtaria()
declare idade inteiro;
escreva("Idade:"); leia(idade);
se (idade <= 12) entao
  escreva("Criança");
senao
  se (idade <= 18) entao
    escreva("Adolescente");
  senao
    escreva("Adulto");
  fimse
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-11",
      title: "Ex 3.11: Par ou Ímpar",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica se um número é par ou ímpar.",
      code: `Algoritmo ParImpar()
declare n inteiro;
escreva("Número:"); leia(n);
se (n % 2 == 0) entao
  escreva("O número é PAR");
senao
  escreva("O número é ÍMPAR");
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-13",
      title: "Ex 3.13: Divisível por 5 e 3",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica divisibilidade dupla usando E (&&).",
      code: `Algoritmo Divisivel5e3()
declare n inteiro;
escreva("Número:"); leia(n);
se (n % 5 == 0 && n % 3 == 0) entao
  escreva("Divisível por 5 e 3 ao mesmo tempo");
senao
  escreva("Não atende aos requisitos");
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-16",
      title: "Ex 3.16: Função por Partes",
      category: "Cap 3: Estruturas Condicionais",
      description: "Calcula Y baseado no valor de X (condições aninhadas).",
      code: `Algoritmo FuncaoX()
declare x, y real;
escreva("Valor de X:"); leia(x);
se (x < 1) entao
  y <- x;
senao
  se (x == 1) entao
    y <- 0;
  senao
    y <- potencia(x, 2);
  fimse
fimse
escreva("Y =", y);
fimalgoritmo`
    },
    {
      id: "ex-3-19",
      title: "Ex 3.19: Formar Triângulo",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica se 3 lados podem formar um triângulo.",
      code: `Algoritmo Triangulo()
declare a, b, c real;
escreva("Lado A:"); leia(a);
escreva("Lado B:"); leia(b);
escreva("Lado C:"); leia(c);
se (a < b + c && b < a + c && c < a + b) entao
  escreva("Formam um triângulo");
senao
  escreva("Não formam um triângulo");
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-28",
      title: "Ex 3.28: Classe Eleitoral",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica se o voto é obrigatório, facultativo ou proibido.",
      code: `Algoritmo Eleitor()
declare idade inteiro;
escreva("Idade:"); leia(idade);
se (idade < 16) entao
  escreva("Não-eleitor");
senao
  se (idade >= 18 && idade <= 65) entao
    escreva("Eleitor Obrigatório");
  senao
    escreva("Eleitor Facultativo");
  fimse
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-32",
      title: "Ex 3.32: Ano Bissexto",
      category: "Cap 3: Estruturas Condicionais",
      description: "Verifica se um ano é bissexto.",
      code: `Algoritmo Bissexto()
declare ano inteiro;
escreva("Ano:"); leia(ano);
se ((ano % 4 == 0 && ano % 100 != 0) || (ano % 400 == 0)) entao
  escreva("O ano é bissexto");
senao
  escreva("Não é bissexto");
fimse
fimalgoritmo`
    },
    {
      id: "ex-3-37",
      title: "Ex 3.37: Aumento Salarial",
      category: "Cap 3: Estruturas Condicionais",
      description: "Calcula aumento baseado em faixas salariais.",
      code: `Algoritmo Aumento()
declare salario, novo real;
escreva("Salário atual:"); leia(salario);
se (salario <= 900) entao
  novo <- salario * 1.20;
senao
  se (salario <= 1300) entao
    novo <- salario * 1.15;
  senao
    se (salario <= 1800) entao
      novo <- salario * 1.10;
    senao
      novo <- salario * 1.05;
    fimse
  fimse
fimse
escreva("Novo salário:", novo);
fimalgoritmo`
    }
  ],
  "Cap 4: Estruturas de Repetição": [
    {
      id: "ex-4-1",
      title: "Ex 4.1: Maior e Menor (Flag 0)",
      category: "Cap 4: Estruturas de Repetição",
      description: "Lê números até digitar 0 e mostra o maior/menor.",
      code: `Algoritmo MaiorMenor()
declare n, maior, menor inteiro;
escreva("Digite um número (0 para sair):");
leia(n);
maior <- n;
menor <- n;
enquanto (n != 0)
  se (n > maior) entao maior <- n; fimse
  se (n < menor) entao menor <- n; fimse
  escreva("Digite outro:");
  leia(n);
fimenquanto
escreva("Maior:", maior, "Menor:", menor);
fimalgoritmo`
    },
    {
      id: "ex-4-2",
      title: "Ex 4.2: Pares até N",
      category: "Cap 4: Estruturas de Repetição",
      description: "Imprime todos os pares de 1 a N.",
      code: `Algoritmo ParesAteN()
declare n, i inteiro;
escreva("Limite N:"); leia(n);
para (i <- 2; i <= n; i <- i + 2)
  escreva(i);
fimpara
fimalgoritmo`
    },
    {
      id: "ex-4-5",
      title: "Ex 4.5: Tabuada",
      category: "Cap 4: Estruturas de Repetição",
      description: "Gera a tabuada de um número N.",
      code: `Algoritmo Tabuada()
declare n, i inteiro;
escreva("Tabuada de:"); leia(n);
para (i <- 1; i <= 10; i <- i + 1)
  escreva(n, "x", i, "=", n * i);
fimpara
fimalgoritmo`
    },
    {
      id: "ex-4-19",
      title: "Ex 4.19: Fatorial",
      category: "Cap 4: Estruturas de Repetição",
      description: "Calcula o fatorial de um número N.",
      code: `Algoritmo Fatorial()
declare n, i, fat inteiro;
escreva("Número:"); leia(n);
fat <- 1;
para (i <- n; i >= 1; i <- i - 1)
  fat <- fat * i;
fimpara
escreva("Fatorial:", fat);
fimalgoritmo`
    },
    {
      id: "ex-4-23",
      title: "Ex 4.23: Número Primo",
      category: "Cap 4: Estruturas de Repetição",
      description: "Verifica se um número é primo.",
      code: `Algoritmo Primo()
declare n, i, div inteiro;
escreva("Número:"); leia(n);
div <- 0;
para (i <- 1; i <= n; i <- i + 1)
  se (n % i == 0) entao div <- div + 1; fimse
fimpara
se (div == 2) entao
  escreva("É primo");
senao
  escreva("Não é primo");
fimse
fimalgoritmo`
    },
    {
      id: "ex-4-40",
      title: "Ex 4.40: Quadrado por Ímpares",
      category: "Cap 4: Estruturas de Repetição",
      description: "Calcula o quadrado de N somando os N primeiros ímpares.",
      code: `Algoritmo QuadradoImpares()
declare n, i, soma, impar inteiro;
escreva("Número:"); leia(n);
soma <- 0;
impar <- 1;
para (i <- 1; i <= n; i <- i + 1)
  soma <- soma + impar;
  escreva("Somando:", impar);
  impar <- impar + 2;
fimpara
escreva("Resultado:", soma);
fimalgoritmo`
    },
    {
      id: "ex-4-111",
      title: "Ex 4.111: Fibonacci",
      category: "Cap 4: Estruturas de Repetição",
      description: "Gera os 30 primeiros termos de Fibonacci.",
      code: `Algoritmo Fibonacci()
declare a, b, c, i inteiro;
a <- 1; b <- 1;
escreva(a); escreva(b);
para (i <- 3; i <= 30; i <- i + 1)
  c <- a + b;
  escreva(c);
  a <- b;
  b <- c;
fimpara
fimalgoritmo`
    }
  ],
  "Cap 5: Vetores e Matrizes": [
    {
      id: "ex-5-1",
      title: "Ex 5.1: Busca em Vetor",
      category: "Cap 5: Vetores e Matrizes",
      description: "Busca um valor X em um vetor de 10 posições.",
      code: `Algoritmo Busca()
declare a[10], x real;
declare i inteiro;
para (i <- 0; i < 10; i <- i + 1)
  escreva("Valor", i, ":"); leia(a[i]);
fimpara
escreva("Buscar por:"); leia(x);
para (i <- 0; i < 10; i <- i + 1)
  se (a[i] == x) entao
    escreva("Encontrado na posição:", i);
  fimse
fimpara
fimalgoritmo`
    },
    {
      id: "ex-5-4",
      title: "Ex 5.4: Pares e Ímpares",
      category: "Cap 5: Vetores e Matrizes",
      description: "Separa e imprime pares e ímpares de um vetor.",
      code: `Algoritmo Separa()
declare v[10], i inteiro;
para (i <- 0; i < 10; i <- i + 1)
  leia(v[i]);
fimpara
escreva("Pares:");
para (i <- 0; i < 10; i <- i + 1)
  se (v[i] % 2 == 0) entao escreva(v[i]); fimse
fimpara
escreva("Ímpares:");
para (i <- 0; i < 10; i <- i + 1)
  se (v[i] % 2 != 0) entao escreva(v[i]); fimse
fimpara
fimalgoritmo`
    },
    {
      id: "ex-5-11",
      title: "Ex 5.11: Soma Diagonais",
      category: "Cap 5: Vetores e Matrizes",
      description: "Soma diagonal principal e secundária de matriz 10x10.",
      code: `Algoritmo Diagonais()
declare m[10][10], sp, ss real;
declare i, j inteiro;
// Preenchimento simplificado para exemplo
para (i <- 0; i < 10; i <- i + 1)
  para (j <- 0; j < 10; j <- j + 1)
    m[i][j] <- i + j; 
  fimpara
fimpara
sp <- 0; ss <- 0;
para (i <- 0; i < 10; i <- i + 1)
  sp <- sp + m[i][i];
  ss <- ss + m[i][9-i];
fimpara
escreva("Soma Principal:", sp);
escreva("Soma Secundária:", ss);
fimalgoritmo`
    }
  ]
};
