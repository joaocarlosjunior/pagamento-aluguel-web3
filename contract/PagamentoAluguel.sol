// SPDX-License-Identifier: MIT

pragma solidity >=0.8.2 <0.9.0;

contract PagamentoAluguel {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct ContratoAluguel {
        string nomeLocatario;
        string nomeLocador;
        address locador;
        address locatario;
        uint256 valorMensal;
        uint256 dataInicio;
        uint256 duracaoMeses;
        uint256 proximoVencimento;
        uint256 pagamentosRealizados;
        uint256[] datasDePagamento;
        uint256 totalMultas;
        uint256 totalJuros;
        bool ativo;
    }

    mapping(address => uint256[]) private contratosPorLocador;
    mapping(address => uint256[]) private contratosPorLocatario;

    ContratoAluguel[] private contratos;

    // Parâmetros ajustáveis
    uint256 public multaAtrasoPercentual = 1000; // 10%
    uint256 public jurosMensaisPercentual = 100; // 1%
    uint256 public indiceCorrecao = 34; //IGP-M de março/25 0.34% (atualizado mensalmente pela FGV)

    uint256 public constant DIAS_NO_MES = 30; // Considerando mês tem 30 dias
    uint256 public constant DENOMINADOR_PERCENTUAL = 10000; // Precisão de 4 casas decimais

    event ContratoCriado(
        uint256 idContrato,
        address locador,
        address locatario
    );
    event PagamentoEfetuado(
        uint256 idContrato,
        uint256 valorBase,
        uint256 multa,
        uint256 correcao,
        uint256 juros,
        uint256 totalPago
    );
    event ContratoFinalizado(uint256 idContrato);
    event IndiceAtualizado(uint256 novoIndice);

    function criarContrato(
        address locatario,
        uint256 valorMensal,
        uint256 duracaoMeses,
        string memory nomeLocatario,
        string memory nomeLocador
    ) external {
        require(locatario != address(0), "Locatario invalido");
        require(valorMensal > 0, "Valor mensal deve ser positivo");
        require(duracaoMeses > 0, "Duracao deve ser de pelo menos 1 mes");

        uint256 idContrato = contratos.length;
        uint256 dataInicio = block.timestamp;
        uint256 proximoVencimento = dataInicio + 30 days; // Primeiro vencimento em 30 dias

        contratos.push(
            ContratoAluguel({
                nomeLocatario: nomeLocatario,
                nomeLocador: nomeLocador,
                locador: msg.sender,
                locatario: locatario,
                valorMensal: valorMensal,
                dataInicio: dataInicio,
                duracaoMeses: duracaoMeses,
                proximoVencimento: proximoVencimento,
                pagamentosRealizados: 0,
                datasDePagamento: new uint256[](0),
                totalMultas: 0,
                totalJuros: 0,
                ativo: true
            })
        );

        // Registra contrato nos mapeamentos
        contratosPorLocador[msg.sender].push(idContrato);
        contratosPorLocatario[locatario].push(idContrato);

        emit ContratoCriado(idContrato, msg.sender, locatario);
    }

    // Atualizar índice de correção
    function atualizarIndiceCorrecao(uint256 _novoIndice) external {
        require(
            msg.sender == owner,
            "Somente o dono do Contrato Inteligente pode atualizar indice"
        );

        indiceCorrecao = _novoIndice;
        emit IndiceAtualizado(_novoIndice);
    }

    // Função para pagar o aluguel (incluindo multas/juros se houver atraso)
    function pagarAluguel(uint256 _idContrato) external payable {
        require(_idContrato < contratos.length, "Contrato nao existe");
        ContratoAluguel storage contrato = contratos[_idContrato];

        require(contrato.ativo, "Contrato nao esta ativo");
        require(
            msg.sender == contrato.locatario,
            "Somente o locatario pode pagar"
        );

        (
            uint256 valorBase,
            uint256 valorMulta,
            uint256 valorCorrecao,
            uint256 valorJuros,
            uint256 valorTotal
        ) = calcularValorDevido(_idContrato);

        require(msg.value >= valorTotal, "Valor insuficiente");

        // Transferir valor para o locador
        payable(contrato.locador).transfer(valorTotal);

        // Devolver troco se houver
        if (msg.value > valorTotal) {
            payable(msg.sender).transfer(msg.value - valorTotal);
        }

        // Atualizar estado do contrato
        contrato.pagamentosRealizados += 1;
        contrato.datasDePagamento.push(block.timestamp);

        if (valorMulta > 0) {
            contrato.totalMultas += valorMulta;
        }

        if (valorJuros > 0) {
            contrato.totalJuros += valorJuros;
        }

        if(contrato.pagamentosRealizados < contrato.duracaoMeses) {
            contrato.proximoVencimento += DIAS_NO_MES * 1 days;
        } else {
            contrato.ativo = false;
            emit ContratoFinalizado(_idContrato);
        }

        emit PagamentoEfetuado(
            _idContrato,
            valorBase,
            valorMulta,
            valorCorrecao,
            valorJuros,
            valorTotal
        );
    }

    // Calcular valor total devido com multas e juros
    function calcularValorDevido(
        uint256 _idContrato
    )
        public
        view
        returns (
            uint256 valorBase,
            uint256 valorMulta,
            uint256 valorCorrecao,
            uint256 valorJuros,
            uint256 valorTotal
        )
    {
        require(_idContrato < contratos.length, "Contrato nao existe");
        ContratoAluguel storage contrato = contratos[_idContrato];

        valorBase = contrato.valorMensal;

        if (block.timestamp <= contrato.proximoVencimento) {
            return (valorBase, 0, 0, 0, valorBase);
        }

        // 1. Calcular dias de atraso
        uint256 diasAtraso = (block.timestamp - contrato.proximoVencimento) /
            1 days;

        // 2. Calcular multa proporcional (10% ao mês = ~0.333% ao dia)
        uint256 multaDiaria = (valorBase * multaAtrasoPercentual) /
            (DENOMINADOR_PERCENTUAL * DIAS_NO_MES);
        valorMulta = multaDiaria * diasAtraso;

        // 3. Aplicar correção do índice sobre o valor + multa
        uint256 valorComMulta = valorBase + valorMulta;
        valorCorrecao =
            (valorComMulta * indiceCorrecao) /
            DENOMINADOR_PERCENTUAL;

        // 4. Calcular juros diários (1% ao mês = ~0.033% ao dia)
        uint256 valorCorrigido = valorComMulta + valorCorrecao;
        uint256 jurosDiarios = (valorCorrigido * jurosMensaisPercentual) /
            (DENOMINADOR_PERCENTUAL * DIAS_NO_MES);
        valorJuros = jurosDiarios * diasAtraso;

        // Valor total devido
        valorTotal = valorBase + valorMulta + valorCorrecao + valorJuros;
    }

    function getContratosPorLocatario(
        address _locatario
    )
        public
        view
        returns (
            uint256[] memory ids,
            uint256[] memory datasVencimento,
            bool[] memory ativos,
            uint256[] memory valoresMensal
        )
    {
        ids = contratosPorLocatario[_locatario];
        datasVencimento = new uint256[](ids.length);
        ativos = new bool[](ids.length);
        valoresMensal = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            datasVencimento[i] = contratos[ids[i]].proximoVencimento;
            ativos[i] = contratos[ids[i]].ativo;
            valoresMensal[i] = contratos[ids[i]].valorMensal;
        }

        return (ids, datasVencimento, ativos, valoresMensal);
    }

    function getContratosPorLocador(
        address _locador
    )
        public
        view
        returns (
            uint256[] memory ids,
            uint256[] memory datasVencimento,
            bool[] memory ativos,
            uint256[] memory valoresMensal
        )
    {
        ids = contratosPorLocador[_locador];
        datasVencimento = new uint256[](ids.length);
        ativos = new bool[](ids.length);
        valoresMensal = new uint256[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            datasVencimento[i] = contratos[ids[i]].proximoVencimento;
            ativos[i] = contratos[ids[i]].ativo;
            valoresMensal[i] = contratos[ids[i]].valorMensal;
        }

        return (ids, datasVencimento, ativos, valoresMensal);
    }

    function getDetalhesContrato(
        uint256 _idContrato
    )
        public
        view
        returns (
            ContratoAluguel memory,
            uint256 valorTotal
        )
    {
        require(
            _idContrato < contratos.length || _idContrato > contratos.length,
            "Contrato nao existe"
        );
        ContratoAluguel storage c = contratos[_idContrato];

        (, , , , valorTotal) = calcularValorDevido(_idContrato);

        return (
            c,
            valorTotal
        );
    }
}
