/**
 * Utilitários de validação para formulários
 */

export const VALIDADORES = {
  /**
   * Valida se o email está no formato correto
   */
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  },

  /**
   * Valida se a senha tem força mínima
   * - Mínimo 6 caracteres
   * - Recomendado: letra maiúscula, minúscula, número
   */
  senha: (senha) => {
    if (senha.length < 6) return false
    const temMaiuscula = /[A-Z]/.test(senha)
    const temMinuscula = /[a-z]/.test(senha)
    const temNumero = /[0-9]/.test(senha)
    return temMaiuscula && temMinuscula && temNumero
  },

  /**
   * Valida força da senha de forma simples
   * (apenas comprimento mínimo)
   */
  senhaSimples: (senha) => {
    return senha && senha.length >= 6
  },

  /**
   * Valida se um nome está válido
   */
  nome: (nome) => {
    return nome && nome.trim().length >= 2
  },

  /**
   * Valida se é um número positivo
   */
  numero: (num) => {
    return !isNaN(num) && num > 0
  },

  /**
   * Valida URL
   */
  url: (url) => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * Valida telefone brasileiro
   */
  telefoneBR: (telefone) => {
    const regex = /^(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}$/
    return regex.test(telefone.replace(/\s/g, ""))
  },

  /**
   * Valida CPF
   */
  cpf: (cpf) => {
    const numeros = cpf.replace(/\D/g, "")
    if (numeros.length !== 11) return false
    if (/^(\d)\1{10}$/.test(numeros)) return false
    return true
  },
}

/**
 * Mensagens de erro padrão
 */
export const MENSAGENS_ERRO = {
  emailInvalido: "Email inválido",
  senhaFraca: "Senha deve ter no mínimo 6 caracteres (maiúscula, minúscula, número)",
  senhaSimplesFraca: "Senha deve ter no mínimo 6 caracteres",
  nomeInvalido: "Nome deve ter ao menos 2 caracteres",
  campoObrigatorio: "Campo obrigatório",
  senhasNaoConfere: "Senhas não conferem",
  usuarioJaExiste: "Este email já está registrado",
  usuarioNaoEncontrado: "Usuário não encontrado",
  senhaIncorreta: "Email ou senha incorretos",
  campoVazio: "Por favor, preencha todos os campos",
}

/**
 * Mensagens de sucesso
 */
export const MENSAGENS_SUCESSO = {
  loginSucesso: "Login realizado com sucesso!",
  cadastroSucesso: "Cadastro realizado com sucesso! Faça login agora.",
  logoutSucesso: "Você foi desconectado.",
  dataSalva: "Dados salvos com sucesso!",
}

/**
 * Validador completo de formulário de login
 */
export function validarLogin(email, senha) {
  const erros = {}

  if (!email || !email.trim()) {
    erros.email = MENSAGENS_ERRO.campoObrigatorio
  } else if (!VALIDADORES.email(email)) {
    erros.email = MENSAGENS_ERRO.emailInvalido
  }

  if (!senha || !senha.trim()) {
    erros.senha = MENSAGENS_ERRO.campoObrigatorio
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  }
}

/**
 * Validador completo de formulário de cadastro
 */
export function validarCadastro(nome, email, senha, senhaConfirm) {
  const erros = {}

  if (!nome || !nome.trim()) {
    erros.nome = MENSAGENS_ERRO.campoObrigatorio
  } else if (!VALIDADORES.nome(nome)) {
    erros.nome = MENSAGENS_ERRO.nomeInvalido
  }

  if (!email || !email.trim()) {
    erros.email = MENSAGENS_ERRO.campoObrigatorio
  } else if (!VALIDADORES.email(email)) {
    erros.email = MENSAGENS_ERRO.emailInvalido
  }

  if (!senha || !senha.trim()) {
    erros.senha = MENSAGENS_ERRO.campoObrigatorio
  } else if (!VALIDADORES.senhaSimples(senha)) {
    erros.senha = MENSAGENS_ERRO.senhaSimplesFraca
  }

  if (!senhaConfirm || !senhaConfirm.trim()) {
    erros.senhaConfirm = MENSAGENS_ERRO.campoObrigatorio
  } else if (senha !== senhaConfirm) {
    erros.senhaConfirm = MENSAGENS_ERRO.senhasNaoConfere
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  }
}
