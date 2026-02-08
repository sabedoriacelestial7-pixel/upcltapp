export function formatarCPF(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatarTelefone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  
  if (cleaned.length <= 2) {
    return cleaned.length > 0 ? `(${cleaned}` : '';
  }
  
  // Telefone fixo ou celular antigo: 10 dígitos (DDD + 8 dígitos) = (XX) XXXX-XXXX
  if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  }
  if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Celular com 9: 11 dígitos (DDD + 9 dígitos) = (XX) 9XXXX-XXXX
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export function formatarData(data: string): string {
  if (!data) return '-';
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR');
}

export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit1 = (sum * 10) % 11;
  if (digit1 === 10) digit1 = 0;
  if (digit1 !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  let digit2 = (sum * 10) % 11;
  if (digit2 === 10) digit2 = 0;
  if (digit2 !== parseInt(cleaned[10])) return false;
  
  return true;
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefone(telefone: string): boolean {
  const cleaned = telefone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
