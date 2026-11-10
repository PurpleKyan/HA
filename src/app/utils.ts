import { Trail } from './models';

/** Turn any HTTP error into a short, readable message. */
export function errMsg(e: any): string {
  if (!e) return 'Something went wrong.';
  if (e.status === 0) {
    return 'Cannot reach the server. Make sure Laravel is running (php artisan serve) on port 8000.';
  }
  const err = e.error;
  if (err && err.errors) {
    const first = Object.values(err.errors)[0] as string[];
    if (first && first.length) return first[0];
  }
  return (err && err.message) || e.message || 'Something went wrong.';
}

export function categoryIcon(_category: string): string {
  return '/mountain.png';
}

export function diffClass(difficulty: string): string {
  if (difficulty === 'Easy') return 'b-green';
  if (difficulty === 'Hard') return 'b-red';
  return 'b-amber';
}

export function statusClass(status: string): string {
  switch (status) {
    case 'Approved':
    case 'verified':
      return 'b-green';
    case 'Completed':
      return 'b-blue';
    case 'Cancelled':
    case 'rejected':
      return 'b-red';
    default:
      return 'b-amber';
  }
}

/** CSS background for a trail cover, with location-specific photos. */
export function coverBackground(t: { name?: string; category: string; image_url?: string | null }): string {
  const gradients: Record<string, string> = {
    Mountain: 'linear-gradient(135deg, #1e6b4f 0%, #0e3b3f 100%)',
    'Eco-Park': 'linear-gradient(135deg, #4d8b31 0%, #174e4b 100%)',
    Waterfall: 'linear-gradient(135deg, #3a8fb7 0%, #174e4b 100%)',
  };
  const g = gradients[t.category] || gradients['Mountain'];
  const locationPhotos: Record<string, string> = {
    'mt. hamiguitan range': '/mt-hamiguitan.jpg',
    'mt. kampalili': '/mt-kampalili.jpg',
    'mt. talomo': '/mt-talomo.jpg',
    'mt. candalaga': '/mt-candalaga.jpg',
    'maragusan highlands trek': '/maragusan-highlands.webp',
    'mt. mayo': 'https://www.pinoymountaineer.com/wp-content/uploads/2014/11/1-IMG_7508.jpg',
    'aliwagwag falls': '/aliwagwag-falls.jpg',
    'aliwagwag falls eco park': '/aliwagwag-falls.jpg',
    'lake carolina eco park': '/lake-carolina.webp',
    'malagos garden resort eco park': '/malagos-garden.jpg',
    'eden nature park eco park': '/eden-nature-park.jpg',
    'hagimit falls nature park': '/hagimit-falls.jpg',
  };
  const image = t.image_url || locationPhotos[t.name?.trim().toLowerCase() || ''];
  if (image) {
    const href = image.startsWith('/')
      ? image
      : encodeURI(image).replace(/[()'"]/g, (c) => '%' + c.charCodeAt(0).toString(16));
    return `url("${href}") center/cover no-repeat, ${g}`;
  }
  return g;
}

/** Today's date as YYYY-MM-DD in the user's own timezone. */
export function todayStr(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function trailCost(t: Pick<Trail, 'entrance_fee' | 'guide_fee'>, group: number): number {
  return t.entrance_fee * group + t.guide_fee;
}