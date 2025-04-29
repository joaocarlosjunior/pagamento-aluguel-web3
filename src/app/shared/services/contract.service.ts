import { Injectable } from '@angular/core';
import { ethers, EthersError, isCallException, isError } from 'ethers';
import { environment } from '../../../environments/environment';
import { ContratoAluguel } from '../../core/models/ContratoAluguel';
import { InfoContratoSimples } from '../../core/models/Response/InfoContratoSimples';
import { FullContractDetail } from './../../core/models/Response/FullContractDetail';
import { EthereumService } from './ethereum.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private readonly CONTRACT_ADDRESS = environment.contractAddress;
  private readonly ABI = environment.contractABI;
  private contractInstance!: ethers.Contract | null;

  constructor(private _ethereumService: EthereumService) {
    this.getSmartContract();
  }

  private async getSmartContract(): Promise<ethers.Contract> {
    try {
      const signer = this._ethereumService.getSigner();

      if (!signer) {
        throw new Error('Signer não disponível. Conecte sua carteira.');
      }

      this.contractInstance = new ethers.Contract(
        this.CONTRACT_ADDRESS,
        this.ABI,
        signer
      );

      return this.contractInstance;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Não foi possível inicializar o contrato');
    }
  }

  public async createContratoAluguel(
    dadosNovoContrato: ContratoAluguel
  ): Promise<ethers.ContractTransactionReceipt> {
    try {
      if (!ethers.isAddress(dadosNovoContrato.locatario)) {
        throw new Error('Endereço do locatário inválido');
      }

      if (dadosNovoContrato.duracaoMeses <= 0) {
        throw new Error('A duração deve ser de pelo menos 1 mês');
      }

      const contract = await this.getSmartContract();

      const valorWei = ethers.parseEther(dadosNovoContrato.valorMensal);

      // Envia a transação
      const tx = await contract['criarContrato'](
        dadosNovoContrato.locatario,
        valorWei,
        dadosNovoContrato.duracaoMeses,
        dadosNovoContrato.nomeLocatario,
        dadosNovoContrato.nomeLocador
      );

      // Espera a confirmação da transação
      const receipt = await tx.wait();

      return receipt;
    } catch (error) {

      if (isError(error, 'CALL_EXCEPTION')) {
        const regex = /execution reverted: "([^"]*)"/;
        const messageError = error.message.match(regex);
        if (messageError && messageError[1]) {
          throw new Error(messageError[1]);
        }
        throw new Error('Erro ao realizar pagamento');
      }

      // Tratamento especial para erros de rejeição de transação
      if (isError(error, 'ACTION_REJECTED')) {
        throw new Error('Transação rejeitada pelo usuário');
      }

      if (isError(error, 'INSUFFICIENT_FUNDS')) {
        throw new Error('Saldo insuficiente para realizar cadastro do contrato');
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Falha ao criar contrato');
    }
  }

  public async getContratosLocador(
    address: string
  ): Promise<InfoContratoSimples[]> {
    if (!ethers.isAddress(address)) {
      throw new Error('Endereço do locador inválido');
    }

    try {
      const contract = await this.getSmartContract();

      const response = await contract['getContratosPorLocador'](address);

      const [ids, datasVencimento, ativos, valoresMensal] = Array.isArray(
        response
      )
        ? response
        : [response[0], response[1], response[2], response[3]];

      return this.processarContratosResponse({
        ids: Array.isArray(ids) ? ids : [ids],
        datasVencimento: Array.isArray(datasVencimento)
          ? datasVencimento
          : [datasVencimento],
        ativos: Array.isArray(ativos) ? ativos : [ativos],
        valoresMensal: Array.isArray(valoresMensal)
          ? valoresMensal
          : [valoresMensal],
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao buscar contratos');
    }
  }

  public async getContratosLocatario(
    address: string
  ): Promise<InfoContratoSimples[]> {
    if (!ethers.isAddress(address)) {
      throw new Error('Endereço do locatário inválido');
    }

    try {
      const contract = await this.getSmartContract();

      const response = await contract['getContratosPorLocatario'](address);

      const [ids, datasVencimento, ativos, valoresMensal] = Array.isArray(
        response
      )
        ? response
        : [response[0], response[1], response[2], response[3]];

      return this.processarContratosResponse({
        ids: Array.isArray(ids) ? ids : [ids],
        datasVencimento: Array.isArray(datasVencimento)
          ? datasVencimento
          : [datasVencimento],
        ativos: Array.isArray(ativos) ? ativos : [ativos],
        valoresMensal: Array.isArray(valoresMensal)
          ? valoresMensal
          : [valoresMensal],
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao buscar contratos');
    }
  }

  public async getFullContractDetails(
    contractId: number
  ): Promise<FullContractDetail> {
    try {
      const contract = await this.getSmartContract();

      // A resposta vem como um array com dois elementos: o tuple e o valorTotal
      const response = await contract['getDetalhesContrato'](contractId);

      // Extrai os dados do tuple (primeiro elemento) e o valorTotal (segundo elemento)
      const [
        nomeLocador,
        nomeLocatario,
        locador,
        locatario,
        valorMensal,
        dataInicio,
        duracaoMeses,
        proximoVencimento,
        pagamentosRealizados,
        datasDePagamento, // Este parece ser um array uint256[]
        totalMultas,
        totalJuros,
        ativo,
      ] = response[0];

      const valorTotal = response[1]; // valorTotal vem separado

      // Retorna o objeto mapeado
      return {
        contractId,
        nomeLocador,
        nomeLocatario,
        locador,
        locatario,
        valorMensal: ethers.formatEther(valorMensal),
        dataInicio: this.formatDate(dataInicio),
        duracaoMeses: Number(duracaoMeses),
        proximoVencimento: this.formatDate(proximoVencimento),
        pagamentosRealizados: Number(pagamentosRealizados),
        datasDePagamento: Array.isArray(datasDePagamento)
          ? datasDePagamento.map((data) => this.formatDate(data))
          : [],
        totalMultas: Number(ethers.formatEther(totalMultas)),
        totalJuros: Number(ethers.formatEther(totalJuros)),
        valorTotal: ethers.formatEther(valorTotal),
        ativo: ativo,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao buscar contrato');
    }
  }

  public async makePayment(idContract: number, to: string, value: string) {
    try {
      if (!ethers.isAddress(to)) {
        throw new Error('Endereço do locador inválido');
      }

      const contract = await this.getSmartContract();

      const valueWei = ethers.parseEther(value);

      const tx = await contract['pagarAluguel'](idContract, {
        value: valueWei,
      });

      const receipt = tx.wait();
    } catch (error) {

      if (isError(error, 'CALL_EXCEPTION')) {
        const regex = /execution reverted: "([^"]*)"/;
        const messageError = error.message.match(regex);
        if (messageError && messageError[1]) {
          throw new Error(messageError[1]);
        }
        throw new Error('Erro ao realizar pagamento');
      }

      if (isError(error, 'ACTION_REJECTED')) {
        throw new Error('Transação rejeitada pelo usuário');
      }

      if (isError(error, 'INSUFFICIENT_FUNDS')) {
        throw new Error('Saldo insuficiente para realizar o pagamento');
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Falha ao realizar pagamento');
    }
  }

  private processarContratosResponse(response: {
    ids: bigint[];
    datasVencimento: bigint[];
    ativos: boolean[];
    valoresMensal: bigint[];
  }): InfoContratoSimples[] {
    return response.ids.map((id, index) => ({
      id: Number(id),
      dataVencimento: this.formatDate(response.datasVencimento[index]),
      ativo: response.ativos[index],
      valorMensal:
        response.valoresMensal[index] != null
          ? ethers.formatEther(response.valoresMensal[index])
          : '0',
    }));
  }

  private formatDate(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleDateString('pt-BR');
  }

  private clearContract(): void {
    this.contractInstance = null;
  }
}
