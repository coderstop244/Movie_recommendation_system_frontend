# FlixRecommend

FlixRecommend is a Vite + React movie-discovery frontend with personalized hybrid recommendations. It works as a polished standalone demo using a bundled movie catalog and local browser storage, while also integrating with an optional FastAPI recommendation service when one is available.

## Highlights

- Email/password sign-in and sign-up flows, plus one-click user and admin demo access
- First-time taste onboarding and a saved-movies profile
- Hybrid recommendation feed that blends content affinity with collaborative/popularity signals
- Resilient client-side recommendations when the backend is unavailable
- Search, genre filtering, and title, rating, or release-year sorting
- Movie details, related titles, likes, and a video player with MP4/HLS support
- Admin workspace for catalog CRUD, viewer-profile inspection, recommendation-weight tuning, and audit logs
- Persistent local demo state for sessions, likes, catalog edits, user records, and logs

## Tech Stack

- React 19 and Vite 8
- Tailwind CSS 3
- Axios for API requests
- Hls.js for HLS playback
- Lucide React icons

## Getting Started

### Prerequisites

Install [Node.js](https://nodejs.org/) 20.19+ or 22.12+ (the Vite 8 requirement) and npm.

### Install and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The development server listens on all network interfaces, which makes testing from another device on your local network possible.

Other useful commands:

```bash
npm run build     # Create a production build in dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint
```

## Using the Application

1. Sign in, create an account, or use one of the demo access buttons.
2. For a viewer account, choose starter movies when prompted; they seed the recommendation profile.
3. Browse the personalized home feed or use Search & Discovery to filter the catalog.
4. Save or remove movies to refresh the recommendations. Open a movie to see details, similar titles, and playback.
5. Switch to the admin role to manage the in-browser catalog and adjust the content/collaborative weighting.

The default experience is self-contained: it uses `src/data/movies.json`, client-side scoring, demo video streams, and browser storage. It remains usable if no backend is running.

## Optional Backend Integration

The frontend sends requests to `http://localhost:8000/api`. When the API responds successfully, its recommendation results and stream URLs are used; otherwise the app falls back to its local demo behavior.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/signup` | `POST` | Create an account and return session data |
| `/login` | `POST` | Authenticate and return session data |
| `/hybrid-recommendations` | `GET` | Retrieve recommendations for `email`, `top_n`, and `weight_a` |
| `/like` | `POST` | Sync a movie like/unlike action |
| `/stream/{movie_id}` | `GET` | Provide a `video_url` for playback |
| `/watch-event` | `POST` | Record watch progress/events from the player |

For authenticated endpoints, the frontend supplies the value stored as `accessToken` in a Bearer authorization header. Configure the backend's CORS policy to allow `http://localhost:5173` (or the origin hosting this frontend).

> The API base URL is currently defined in `src/App.jsx` and `src/components/VideoPlayerModal.jsx`. Change those values if your service runs elsewhere.

## Browser Storage

The following keys are stored locally to support the standalone demo:

| Key | Contents |
| --- | --- |
| `accessToken` | Backend token, or a generated demo token |
| `userEmail`, `userRole` | Current local session |
| `likedMovies` | Titles that define the taste profile |
| `customMoviesCatalog` | Admin catalog additions and edits |
| `usersDirectory` | Local demo user profiles |
| `systemAuditLogs` | Recent local admin activity |

Use Logout to clear the session and liked movies. To fully reset the demo—including catalog and admin state—clear this site's local storage in your browser.

## Project Structure

```text
.
├── public/                       # Favicons and static assets
├── src/
│   ├── components/               # Auth, catalog, discovery, player, and admin UI
│   ├── data/movies.json          # Bundled movie catalog
│   ├── utils/recommender.js      # Search, media, and fallback recommendation logic
│   ├── App.jsx                   # Application state and API orchestration
│   ├── index.css                 # Global styles and Tailwind layers
│   └── main.jsx                  # React entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Troubleshooting

- **The backend is offline:** this is expected in standalone mode. The interface continues with local authentication, catalog data, recommendations, and demo streams.
- **Requests fail with CORS errors:** start the API on port `8000` or update the frontend API URLs, then allow the Vite origin in backend CORS settings.
- **A video does not play:** check that a backend `video_url` is publicly reachable. HLS streams should be served as `.m3u8`; otherwise the bundled MP4 fallback is used.
- **You need a fresh demo:** clear the application's local storage, then reload the page.
- **Production build fails:** run `npm install` again, then use `npm run build` to see the reported error.

## License

No license file is currently included. Treat this project as educational/demo code unless the repository owner specifies otherwise.
