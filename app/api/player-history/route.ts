import handler from '../../../server/api/player-history.js';
import { asRoute } from '../_lib/route-adapter';

export const dynamic = 'force-dynamic';
const route = asRoute(handler);
export const GET = route;
export const OPTIONS = route;
