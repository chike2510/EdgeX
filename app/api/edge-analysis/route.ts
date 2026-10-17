import handler from '../../../server/api/edge-analysis.js';
import { asRoute } from '../_lib/route-adapter';

export const dynamic = 'force-dynamic';
const route = asRoute(handler);
export const GET = route;
export const POST = route;
export const OPTIONS = route;
