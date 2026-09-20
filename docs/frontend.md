# Frontend

I chose Next.js App Router because it makes server-side data fetching and server actions easier. It also helps keep unnecessary JavaScript out of the browser.

I separated the page, data layer, serializer, and actions to keep things organized. This also makes it easier to handle API changes without changing the UI.

The API uses `snake_case`, while the frontend uses `camelCase`. I handle this conversion inside the serializers so it stays in one place.

I use normal HTML forms with Server Actions, so they can still work if JavaScript is disabled. JavaScript is mainly used to improve the user experience.

I use Zod and React Hook Form for validation. The client validates the form first, but the server validates the data again before using it.

I tested the UI at 375px, 768px, and 1280px. I fixed the mobile navigation, cart layout, and card padding on smaller screens.
