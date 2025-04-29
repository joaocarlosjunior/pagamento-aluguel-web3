// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract AluguelImobiliario {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Estruturas de dados
    struct Pessoa {
        address endereco;
        uint256[] contratosComoLocador;
        uint256[] contratosComoLocatario;
        uint256 quantidadeContratosAtivos;
    }

    struct ContratoAluguel {
        Pessoa locador;
        Pessoa locatario;
        uint256 valorMensal;
        uint256 dataInicio;
        uint256 duracaoMeses;
        uint256 proximoVencimento;
        uint256 pagamentosRealizados;
        uint256[] datasDePagamento;
        uint256 totalMultas;
        uint256 totalJuros;
        uint256 valorTotal;
        bool ativo;
    }

    // Mapeamentos e arrays
    mapping(address => Pessoa) private pessoas;
    ContratoAluguel[] private contratos;

    // Parâmetros ajustáveis
    uint256 public multaAtrasoPercentual = 1000; // 10%
    uint256 public jurosMensaisPercentual = 100; // 1%
    uint256 public indiceCorrecao = 34; // 0.34%
    uint256 public constant DIAS_NO_MES = 30;
    uint256 public constant DENOMINADOR_PERCENTUAL = 10000;

    // Eventos
    event ContratoCriado(uint256 idContrato, address locador, address locatario);
    event PagamentoEfetuado(uint256 idContrato, uint256 valorBase, uint256 multa, uint256 correcao, uint256 juros, uint256 totalPago);
    event ContratoFinalizado(uint256 idContrato);
    event IndiceAtualizado(uint256 novoIndice);
    event PessoaCadastrada(address endereco);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Somente o proprietario pode executar");
        _;
    }

    // Funções de cadastro
    function cadastrarPessoa(address _endereco) internal returns(Pessoa memory) {
        if (!verificaPessoaCadastrada(_endereco)) {
            Pessoa memory novaPessoa = Pessoa({
                endereco: _endereco,
                contratosComoLocador: new uint256[](0),
                contratosComoLocatario: new uint256[](0),
                quantidadeContratosAtivos: 0
            });
            pessoas[_endereco] = novaPessoa;
            emit PessoaCadastrada(_endereco);
            return novaPessoa;
        }
        return pessoas[_endereco];
    }

    function verificaPessoaCadastrada(address _endereco) public view returns (bool) {
        return pessoas[_endereco].endereco != address(0);
    }

    // Funções principais
    function criarContrato(
        address _locatario,
        uint256 _valorMensal,
        uint256 _duracaoMeses
    ) external {
        require(_locatario != address(0), "Locatario invalido");
        require(_valorMensal > 0, "Valor mensal deve ser positivo");
        require(_duracaoMeses > 0, "Duracao deve ser de pelo menos 1 mes");

        // Cadastra ou recupera as pessoas
        Pessoa memory locador = cadastrarPessoa(msg.sender);
        Pessoa memory locatario = cadastrarPessoa(_locatario);

        uint256 idContrato = contratos.length;
        uint256 dataInicio = block.timestamp;
        uint256 proximoVencimento = dataInicio + 30 days;

        // Cria o novo contrato
        contratos.push(ContratoAluguel({
            locador: locador,
            locatario: locatario,
            valorMensal: _valorMensal,
            dataInicio: dataInicio,
            duracaoMeses: _duracaoMeses,
            proximoVencimento: proximoVencimento,
            pagamentosRealizados: 0,
            datasDePagamento: new uint256[](0),
            totalMultas: 0,
            totalJuros: 0,
            valorTotal: 0,
            ativo: true
        }));

        // Atualiza os registros das pessoas
        pessoas[msg.sender].contratosComoLocador.push(idContrato);
        pessoas[_locatario].contratosComoLocatario.push(idContrato);
        pessoas[msg.sender].quantidadeContratosAtivos++;
        pessoas[_locatario].quantidadeContratosAtivos++;

        emit ContratoCriado(idContrato, msg.sender, _locatario);
    }

    function pagarAluguel(uint256 _idContrato) external payable {
        require(_idContrato < contratos.length, "Contrato nao existe");
        ContratoAluguel storage contrato = contratos[_idContrato];

        require(contrato.ativo, "Contrato nao esta ativo");
        require(msg.sender == contrato.locatario.endereco, "Somente o locatario pode pagar");

        (uint256 valorBase, uint256 valorMulta, uint256 valorCorrecao, uint256 valorJuros, uint256 valorTotal) =
            calcularValorDevido(_idContrato);

        require(msg.value >= valorTotal, "Valor insuficiente");

        // Atualiza o contrato
        contrato.pagamentosRealizados++;
        contrato.proximoVencimento += DIAS_NO_MES * 1 days;
        contrato.datasDePagamento.push(block.timestamp);
        contrato.totalMultas += valorMulta;
        contrato.totalJuros += valorJuros;

        // Transfere o valor
        payable(contrato.locador.endereco).transfer(valorTotal);

        // Devolve troco se necessário
        if (msg.value > valorTotal) {
            payable(msg.sender).transfer(msg.value - valorTotal);
        }

        emit PagamentoEfetuado(_idContrato, valorBase, valorMulta, valorCorrecao, valorJuros, valorTotal);

        // Finaliza contrato se necessário
        if (contrato.pagamentosRealizados >= contrato.duracaoMeses) {
            contrato.ativo = false;
            pessoas[contrato.locador.endereco].quantidadeContratosAtivos--;
            pessoas[contrato.locatario.endereco].quantidadeContratosAtivos--;
            emit ContratoFinalizado(_idContrato);
        }
    }

    // Funções de consulta
    function calcularValorDevido(uint256 _idContrato) public view returns (
        uint256 valorBase,
        uint256 valorMulta,
        uint256 valorCorrecao,
        uint256 valorJuros,
        uint256 valorTotal
    ) {
        require(_idContrato < contratos.length, "Contrato nao existe");
        ContratoAluguel storage contrato = contratos[_idContrato];

        valorBase = contrato.valorMensal;

        if (block.timestamp <= contrato.proximoVencimento) {
            return (valorBase, 0, 0, 0, valorBase);
        }

        uint256 diasAtraso = (block.timestamp - contrato.proximoVencimento) / 1 days;
        uint256 multaDiaria = (valorBase * multaAtrasoPercentual) / (DENOMINADOR_PERCENTUAL * DIAS_NO_MES);
        valorMulta = multaDiaria * diasAtraso;

        uint256 valorComMulta = valorBase + valorMulta;
        valorCorrecao = (valorComMulta * indiceCorrecao) / DENOMINADOR_PERCENTUAL;

        uint256 valorCorrigido = valorComMulta + valorCorrecao;
        uint256 jurosDiarios = (valorCorrigido * jurosMensaisPercentual) / (DENOMINADOR_PERCENTUAL * DIAS_NO_MES);
        valorJuros = jurosDiarios * diasAtraso;

        valorTotal = valorBase + valorMulta + valorCorrecao + valorJuros;
    }

    function getContratosPorLocador(address _endereco) public view returns (
        uint256[] memory ids,
        uint256[] memory datasVencimento,
        uint256[] memory valoresMensal
    ) {
        require(verificaPessoaCadastrada(_endereco), "Locador nao cadastrado");

        uint256[] memory todosIds = pessoas[_endereco].contratosComoLocador;
        uint256 ativosCount = pessoas[_endereco].quantidadeContratosAtivos;
        ids = new uint256[](ativosCount);
        datasVencimento = new uint256[](ativosCount);
        valoresMensal = new uint256[](ativosCount);

        for (uint256 i = 0; i < todosIds.length; i++) {
                ids[i] = todosIds[i];
                datasVencimento[i] = contratos[todosIds[i]].proximoVencimento;
                valoresMensal[i] = contratos[todosIds[i]].valorMensal;
        }

        return (ids, datasVencimento, valoresMensal);
    }

    function getDetalhesContrato(uint256 _idContrato) public view returns (
        address locador,
        address locatario,
        uint256 valorMensal,
        uint256 dataInicio,
        uint256 duracaoMeses,
        uint256 proximoVencimento,
        uint256 pagamentosRealizados,
        uint256 totalMultas,
        uint256 totalJuros,
        uint256 valorTotal,
        uint256[] memory datasDePagamento,
        bool ativo
    ) {
        require(_idContrato < contratos.length, "Contrato nao existe");
        ContratoAluguel storage c = contratos[_idContrato];

        (, , , , valorTotal) = calcularValorDevido(_idContrato);

        return (
            c.locador.endereco,
            c.locatario.endereco,
            c.valorMensal,
            c.dataInicio,
            c.duracaoMeses,
            c.proximoVencimento,
            c.pagamentosRealizados,
            c.totalMultas,
            c.totalJuros,
            valorTotal,
            c.datasDePagamento,
            c.ativo
        );
    }

    // Funções administrativas
    function atualizarIndiceCorrecao(uint256 _novoIndice) external onlyOwner {
        indiceCorrecao = _novoIndice;
        emit IndiceAtualizado(_novoIndice);
    }

    function getInfoPessoa(address _endereco) public view returns (
        uint256 contratosComoLocador,
        uint256 contratosComoLocatario,
        uint256 contratosAtivos
    ) {
        require(verificaPessoaCadastrada(_endereco), "Pessoa nao cadastrada");
        Pessoa memory p = pessoas[_endereco];
        return (
            p.contratosComoLocador.length,
            p.contratosComoLocatario.length,
            p.quantidadeContratosAtivos
        );
    }
}
