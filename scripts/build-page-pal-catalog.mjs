import { writeFile } from 'node:fs/promises';
import { PAGE_PALS } from '../functions/api/page-pals.js';
import { PAGE_PAL_PRICES } from '../functions/api/page-pal-prices.js';
await writeFile(new URL('../assets/page-pals-catalog.json',import.meta.url),JSON.stringify({catalog:PAGE_PALS,prices:PAGE_PAL_PRICES}));
