export interface FullContractDetail{
  contractId: number;
  nomeLocador: string;
  nomeLocatario: string;
  locador: string;
  locatario: string;
  valorMensal: string;
  dataInicio: string;
  duracaoMeses: number;
  proximoVencimento: string;
  pagamentosRealizados: number;
  totalMultas: number;
  totalJuros: number;
  valorTotal: string;
  datasDePagamento: string[];
  ativo: boolean;
}
