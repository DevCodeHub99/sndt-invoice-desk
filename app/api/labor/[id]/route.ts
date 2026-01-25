import { LaborModel } from '@/lib/models/Labor';
import { createCrudHandlers } from '@/lib/api-helpers';

const handlers = createCrudHandlers(LaborModel, 'labor', {
  requiredFields: ['name', 'rateType', 'rate'],
  userIdField: 'userId',
});

export const GET = handlers.getOne;
export const PUT = handlers.update;
export const DELETE = handlers.remove;
