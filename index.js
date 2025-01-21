const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = express();
const PORT = 4000;
const { validaSenha, getAcoes, validarEmail } = require("./funcoes.js");
require('dotenv').config();
server.use(express.json());

server.listen(PORT, () => {
    console.log("Servidor rodando!");
});

let usuarios = [];
let acoesMercado = getAcoes();
let usuarioLogado;

// Retornar usuários
server.get("/usuarios", (req, res) => {
    try {
        res.status(201).json(usuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao pegar os usuários." });
    }
})

// Cadastrar usuários
server.post("/usuarios", async (req, res) => {
    try {
        const { nome, email, senha, dadosBancarios } = req.body;
        // Verifica se os valores não são vazios
        if (!nome || !email || !senha || !dadosBancarios) {
            throw {
                status: 400,
                message: "Erro: Todos os dados devem ser preenchidos."
            }
        }

        if (!validarEmail(email)) {
            throw {
                status: 400,
                message: "Erro: Insira um e-mail válido."
            }
        }

        const usuarioExistente = usuarios.find((user) => user.email === email);
        if (usuarioExistente) {
            throw {
                status: 500,
                message: "Erro: Usuário já cadastrado."
            }
        }
        // Verificação de força da senha
        const senhaValidada = validaSenha(senha);
        if (!senhaValidada.isValid) {
            throw {
                status: 400,
                message: senhaValidada.message
            }
        }
        const senhaHash = await bcrypt.hash(senha, 10);
        const usuario = { nome, email, senha: senhaHash, dadosBancarios, saldo: 200.00, minhasAcoes: [], transacoes: [] };

        usuarios.push(usuario);

        res.status(201).json({ message: "Usuário criado com sucesso!" });
    } catch (error) {
        console.error(error);
        res.status(error.status).json(error);
    }
});

// Login
server.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            throw {
                status: 400,
                message: "Erro: Todos os dados devem ser preenchidos."
            }
        }

        const usuario = usuarios.find((user) => user.email === email);
        if (!usuario) {
            throw {
                status: 400,
                message: "Erro: Usuário não encontrado."
            }
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            throw {
                status: 400,
                message: "Erro: Usuário ou senha incorretos."
            }
        }

        const token = jwt.sign({ email }, "jwtToken", { expiresIn: '1h' });
        usuarioLogado = usuarios.filter((user) => user.email === email)[0];
        res.json({ status: 200, message: "Login realizado com sucesso!", token });
    } catch (error) {
        console.error(error);
        res.status(error.status).json(error);
    }
})

// Ações disponíveis no mercado
server.get("/acoesMercado", (req, res) => {
    try {
        res.status(201).json(acoesMercado);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao pegar as ações." });
    }
});

// Pega ação pelo nome
server.get("/acoesMercado/:nome", (req, res) => {
    try {
        const nome = req.params.nome;
        const acao = acoesMercado.filter((acoes) => acoes.nomeAcao === nome)[0];

        if (!acao) {
            throw {
                status: 400,
                message: `Erro: Nenhuma ação ${nome} encontrada.`
            }
        }

        res.status(201).json({ acao });
    } catch (error) {
        console.error(error);
        res.status(error.status).json(error);
    }
});

server.post("/compraAcao/:nome/:quantidade", async (req, res) => {
    try {
        const { nome, quantidade } = req.params;
        const acao = acoesMercado.filter((a) => a.nomeAcao === nome)[0];
        if (!acao) {
            throw {
                status: 400,
                message: `Erro: Ação ${nome} não encontrada.`
            }
        }

        // Verifica Saldo
        if (usuarioLogado.saldo < acao.precoAtual * quantidade) {
            throw {
                status: 400,
                message: `Saldo insuficiente: você não pode comprar ${quantidade} ${quantidade > 1 ? "ações" : "ação"} de ${acao.nomeAcao}.`
            }
        }

        usuarioLogado.saldo -= acao.precoAtual * quantidade;

        usuarioLogado.transacoes.push({
            tipoOperacao: "Compra",
            nomeAcao: acao.nomeAcao,
            qtdAcoes: parseInt(quantidade, 10),
            precoUnitario: acao.precoAtual,
            dataTransacao: new Date()
        });

        const possuiAcao = usuarioLogado.minhasAcoes.filter((a) => a.nomeAcao === acao.nomeAcao);
        if (possuiAcao.length > 0) {
            usuarioLogado.minhasAcoes.map((a) => {
                if (a.nomeAcao === acao.nomeAcao) {
                    a.qtdAcoes += parseInt(quantidade, 10);
                }
            });
        } else {
            usuarioLogado.minhasAcoes.push({
                nomeAcao: acao.nomeAcao,
                qtdAcoes: parseInt(quantidade, 10),
                precoUnitario: acao.precoAtual
            });
        }

        res.status(201).json({ message: `${quantidade > 1 ? "Ações compradas" : "Ação comprada"} com sucesso! Seu saldo atual é ${usuarioLogado.saldo.toFixed(2)}.` });
    } catch (error) {
        console.error(error);
        res.status(error.status).json(error);
    }
});

server.post("/vendeAcao/:nome/:quantidade", async (req, res) => {
    try {
        const { nome, quantidade } = req.params;
        const minhasAcoes = usuarioLogado.minhasAcoes;
        let acabaramAcoes = false;

        // Verifica se o usuário possui a ação
        const acao = minhasAcoes.filter((a) => a.nomeAcao === nome)[0];
        if (!acao) {
            throw {
                status: 400,
                message: `Erro: Ação ${nome} não encontrada.`
            }
        }

        if (acao.qtdAcoes < quantidade) {
            throw {
                status: 400,
                message: `Erro: Você não pode vender ${quantidade} ${quantidade > 1 ? "ações" : "ação"} de ${nome} pois possui apenas ${acao.qtdAcoes}.`
            }
        }

        usuarioLogado.saldo += acao.precoUnitario * quantidade;

        usuarioLogado.transacoes.push({
            tipoOperacao: "Venda",
            nomeAcao: acao.nomeAcao,
            qtdAcoes: parseInt(quantidade, 10),
            precoUnitario: acao.precoAtual,
            dataTransacao: new Date()
        });

        minhasAcoes.map((a) => {
            if (a.nomeAcao === nome) {
                a.qtdAcoes -= parseInt(quantidade, 10);
                acabaramAcoes = a.qtdAcoes === 0;
            }
        });

        // Se a quantidade final for zero, remove a ação de Minhas Ações
        if (acabaramAcoes) {
            const indexToRemove = minhasAcoes.findIndex(a => a.nomeAcao === nome);
            minhasAcoes.splice(indexToRemove, 1);
        }

        res.status(201).json({ message: `Ação vendida com sucesso! Seu saldo atual é ${usuarioLogado.saldo.toFixed(2)}.` });
    } catch (error) {
        console.error(error);
        res.status(error.status).json(error);
    }
});

server.get("/transacoes", (req, res) => {
    res.status(201).json({
        transacoes: usuarioLogado.transacoes
    })
});

server.get("/minhasAcoes", (req, res) => {
    let qtdAcoes = 0;
    let somaPrecoAcoes = 0;

    usuarioLogado.minhasAcoes.map((a) => {
        qtdAcoes += a.qtdAcoes;
        somaPrecoAcoes += a.qtdAcoes * a.precoUnitario;
    });

    let precoMedio = (somaPrecoAcoes / qtdAcoes).toFixed(2);

    res.status(201).json({
        qtdAcoes,
        precoMedio,
        acoes: usuarioLogado.minhasAcoes
    });
});
