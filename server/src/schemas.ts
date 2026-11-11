import { z } from 'zod';
import type { NewTransaction } from '../../shared/types';

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Validação em tempo de execução de tudo que entra pela API.
// O `satisfies` garante que o schema continua batendo com o tipo compartilhado.
export const newTransactionSchema = z.object({
  description: z.string().trim().min(1, 'Informe uma descrição').max(120),
  amountCents: z
    .number()
    .int('O valor deve ser um inteiro em centavos')
    .positive('O valor deve ser maior que zero')
    .max(2147483647, 'Valor acima do limite permitido'),
  type: z.enum(['income', 'expense']),
  category: z.string().trim().min(1, 'Informe uma categoria').max(40),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD')
    .refine(isRealDate, 'Data inválida'),
}) satisfies z.ZodType<NewTransaction>;

export const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use o formato YYYY-MM')
    .optional(),
});
