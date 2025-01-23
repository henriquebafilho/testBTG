export function validaSenha(senha) {
    const criteria = {
        length: senha.length >= 8,
        uppercase: /[A-Z]/.test(senha),
        lowercase: /[a-z]/.test(senha),
        number: /[0-9]/.test(senha),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(senha),
    };

    const message = !criteria.length || !criteria.uppercase || !criteria.lowercase || !criteria.number || !criteria.specialChar ?
        "Erro: Sua senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial." : "";

    const isValid = Object.values(criteria).every((value) => value);

    return {
        isValid,
        message
    };
}

export function validarEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

export function getAcoes() {
    return [
        {
            "nomeAcao": "ABC",
            "precoAtual": getPreco(),
            "volumeNegociacao": 1500000,
            "variacaoPercentual": 2.35
        },
        {
            "nomeAcao": "DEF",
            "precoAtual": getPreco(),
            "volumeNegociacao": 850000,
            "variacaoPercentual": -1.22
        },
        {
            "nomeAcao": "GHI",
            "precoAtual": getPreco(),
            "volumeNegociacao": 2000000,
            "variacaoPercentual": 0.75
        },
        {
            "nomeAcao": "JKL",
            "precoAtual": getPreco(),
            "volumeNegociacao": 1250000,
            "variacaoPercentual": -0.45
        },
        {
            "nomeAcao": "MNO",
            "precoAtual": getPreco(),
            "volumeNegociacao": 500000,
            "variacaoPercentual": 3.12
        }
    ]
}

function getPreco() {
    const geraPreco = Math.random() * (200 - 1) + 1;
    return parseFloat(geraPreco.toFixed(2));
}

/* jwt.verify(req.token, "jwtToken", function(err, data){
        if(err){
            res.sendStatus(403);
        } else{
            //o desenrolar vem aqui
            res.json({message: "this is protected"})
        }
    }); */

/* export function verificaToken(req, res, next) {
    const bearerHeader = req.headers["autorization"];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(" ");
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
} */