/**
 * Utilidades para tratamento centralizado de erros
 */

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.name = "AppError"
  }
}

/**
 * Logger de erros com suporte a diferentes níveis
 */
export const errorLogger = {
  log: (message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data)
    }
  },

  warn: (message, data = {}) => {
    console.warn(`[WARN] ${message}`, data)
  },

  error: (message, error = null, data = {}) => {
    console.error(`[ERROR] ${message}`, error || data)
    // Aqui você poderia enviar para um serviço de logging (Sentry, LogRocket, etc)
  },

  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
}

/**
 * Tratador de erros de API
 */
export const handleApiError = (error) => {
  errorLogger.error("API Error", error)

  if (error.status === 401) {
    return "Você não tem permissão para fazer isso"
  }

  if (error.status === 403) {
    return "Acesso negado"
  }

  if (error.status === 404) {
    return "Recurso não encontrado"
  }

  if (error.status === 429) {
    return "Muitas requisições. Tente novamente mais tarde"
  }

  if (error.status >= 500) {
    return "Erro do servidor. Tente novamente mais tarde"
  }

  return error.message || "Erro desconhecido"
}

/**
 * Tratador de erros de Supabase
 */
export const handleSupabaseError = (error) => {
  errorLogger.error("Supabase Error", error)

  const code = error?.code
  const message = error?.message

  // Erros comuns do Supabase Auth
  if (code === "invalid_credentials") {
    return "Email ou senha incorretos"
  }

  if (code === "user_already_exists") {
    return "Este email já está registrado"
  }

  if (code === "email_not_confirmed") {
    return "Por favor, confirme seu email"
  }

  if (code === "over_email_send_rate_limit") {
    return "Muitas tentativas. Tente novamente mais tarde"
  }

  if (code === "invalid_grant") {
    return "Credenciais inválidas"
  }

  return message || "Erro de autenticação"
}

/**
 * Wrapper para async functions com tratamento de erro
 */
export const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      errorLogger.error("Async Error", error)
      throw error
    }
  }
}

/**
 * Retry com backoff exponencial
 */
export const retryAsync = async (fn, options = {}) => {
  const { maxAttempts = 3, delayMs = 1000, backoff = 2 } = options

  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(backoff, attempt - 1)
        errorLogger.log(`Retry attempt ${attempt}/${maxAttempts}, waiting ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Validador de resposta
 */
export const validateResponse = (response, fieldName) => {
  if (!response) {
    throw new AppError(`${fieldName} não encontrado`, 404)
  }
  return response
}

/**
 * Tratador de erro genérico para componentes
 */
export const getErrorMessage = (error) => {
  if (typeof error === "string") {
    return error
  }

  if (error?.message) {
    return error.message
  }

  if (error?.error?.message) {
    return error.error.message
  }

  return "Ocorreu um erro desconhecido"
}
