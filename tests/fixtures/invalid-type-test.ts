import type { PaymentStatus } from '@vertex/types';
// Intentionally invalid value to test type-checker rejection
export const invalidStatus: PaymentStatus = 'not_a_valid_status';
