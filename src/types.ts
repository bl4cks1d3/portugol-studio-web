
export type DataType = 'inteiro' | 'real' | 'literal' | 'logico';

export interface Variable {
  name: string;
  type: DataType;
  value: any;
  isArray?: boolean;
  dimensions?: number[];
}

export interface Example {
  id: string;
  title: string;
  category: string;
  code: string;
  description: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  expectedOutput?: string;
}

export interface InterpreterState {
  variables: Map<string, Variable>;
  output: string[];
  inputQueue: string[];
  isWaitingForInput: boolean;
  currentLine: number;
  error: string | null;
}
