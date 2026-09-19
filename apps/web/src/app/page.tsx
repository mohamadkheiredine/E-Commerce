import { redirect } from 'next/navigation';

/** The storefront's front door is the catalogue; the proxy handles the auth redirect. */
export default function HomePage() {
  redirect('/products');
}
