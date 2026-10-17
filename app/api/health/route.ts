import handler from '../../../server/api/health.js';
import { asRoute } from '../_lib/route-adapter';

export const dynamic = 'force-dynamic';
export const GET = asRoute(handler);
