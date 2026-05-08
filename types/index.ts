// Tipos globais para o projeto

export interface User {
  id: string;
  email: string;
  name?: string;
  is_admin?: boolean;
}

export interface Treino {
  id: string;
  nome: string;
  descricao?: string;
  exercicios: Exercicio[];
}

export interface Exercicio {
  id: string;
  nome: string;
  series: number;
  repeticoes: number;
  peso?: number;
}

export interface Alimento {
  id: string;
  nome: string;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
}