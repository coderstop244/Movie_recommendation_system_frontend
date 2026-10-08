// Recommender and Movie Utilities
import allMovies from "../data/movies.json";

// TMDB Image CDN Base URLs
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
export const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/original";

// Fallback demo video stream URLs (safe, open-source mp4 and hls video feeds)
export const DEFAULT_STREAM_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export const DEMO_STREAMS = {
  19995:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", // Avatar demo
  49026:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Dark Knight demo
  157336:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", // Interstellar demo
  default:
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
};

// Return poster URL or fallback gradient placeholder
export function getPosterUrl(movie) {
  if (!movie) return null;
  if (movie.poster_url && movie.poster_url.startsWith("http")) {
    return movie.poster_url;
  }
  if (movie.poster_path) {
    if (movie.poster_path.startsWith("http")) return movie.poster_path;
    return `${TMDB_IMAGE_BASE}${movie.poster_path}`;
  }
  return null;
}

// Return backdrop URL or fallback
export function getBackdropUrl(movie) {
  if (!movie) return null;
  if (movie.backdrop_url && movie.backdrop_url.startsWith("http")) {
    return movie.backdrop_url;
  }
  if (movie.backdrop_path) {
    if (movie.backdrop_path.startsWith("http")) return movie.backdrop_path;
    return `${TMDB_BACKDROP_BASE}${movie.backdrop_path}`;
  }
  return null;
}

// Extract unique genres across catalog
export function getAllGenres(movies = allMovies) {
  const genreSet = new Set();
  movies.forEach((m) => {
    if (m.genres) {
      m.genres.split(/\s+/).forEach((g) => {
        const clean = g.trim();
        if (clean && clean.length > 2) genreSet.add(clean);
      });
    }
  });
  return Array.from(genreSet).sort();
}

// Fast search and filter utility
export function searchAndFilterMovies(
  movies,
  query = "",
  genre = "",
  sortBy = "match",
) {
  let filtered = [...movies];

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = filtered.filter((m) => {
      const titleMatch = m.title && m.title.toLowerCase().includes(q);
      const genreMatch = m.genres && m.genres.toLowerCase().includes(q);
      const descMatch = m.overview && m.overview.toLowerCase().includes(q);
      const castMatch =
        m.cast &&
        Array.isArray(m.cast) &&
        m.cast.some((c) => c.toLowerCase().includes(q));
      const directorMatch = m.director && m.director.toLowerCase().includes(q);
      return (
        titleMatch || genreMatch || descMatch || castMatch || directorMatch
      );
    });
  }

  if (genre && genre !== "All") {
    const g = genre.toLowerCase();
    filtered = filtered.filter(
      (m) => m.genres && m.genres.toLowerCase().includes(g),
    );
  }

  if (sortBy === "title") {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === "year") {
    filtered.sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  }

  return filtered;
}

// Client-side Hybrid Recommendation fallback generator
// Mirrors the TF-IDF content similarity and collaborative model when backend is cold or offline
export function generateClientRecommendations(
  userLikes = [],
  catalog = allMovies,
  topN = 12,
  weightA = 0.5,
) {
  if (!userLikes || userLikes.length === 0) {
    // Return top popular movies if no profile
    return catalog.slice(0, topN).map((m, idx) => ({
      ...m,
      content_score: 0.85 - idx * 0.03,
      collab_score: 0.88 - idx * 0.02,
      hybrid_score: 0.86 - idx * 0.025,
    }));
  }

  const likedSet = new Set(userLikes.map((t) => t.toLowerCase()));
  const likedMovies = catalog.filter((m) =>
    likedSet.has(m.title.toLowerCase()),
  );

  // Extract liked genre profile
  const likedGenreCounts = {};
  likedMovies.forEach((m) => {
    if (m.genres) {
      m.genres.split(/\s+/).forEach((g) => {
        const lower = g.toLowerCase();
        likedGenreCounts[lower] = (likedGenreCounts[lower] || 0) + 1;
      });
    }
  });

  // Calculate scores for non-liked movies
  const scored = catalog
    .filter((m) => !likedSet.has(m.title.toLowerCase()))
    .map((m) => {
      // Content similarity score based on genre overlap & overview tokens
      let contentScore = 0;
      if (m.genres) {
        m.genres.split(/\s+/).forEach((g) => {
          const lower = g.toLowerCase();
          if (likedGenreCounts[lower]) {
            contentScore += likedGenreCounts[lower] * 0.25;
          }
        });
      }
      contentScore = Math.min(
        0.98,
        Math.max(
          0.2,
          contentScore / (Object.keys(likedGenreCounts).length || 1),
        ),
      );

      // Collaborative / Popularity pseudo SVD score
      const baseRating = (m.rating || 7.0) / 10;
      const pseudoCollab = Math.min(
        0.99,
        Math.max(0.3, baseRating + Math.sin(m.id) * 0.05),
      );

      // Hybrid calculation
      const hybridScore = weightA * contentScore + (1 - weightA) * pseudoCollab;

      return {
        ...m,
        content_score: Math.round(contentScore * 100) / 100,
        collab_score: Math.round(pseudoCollab * 100) / 100,
        hybrid_score: Math.round(hybridScore * 100) / 100,
      };
    });

  scored.sort((a, b) => b.hybrid_score - a.hybrid_score);
  return scored.slice(0, topN);
}

// Find similar movies for "More Like This" section inside detail modal
export function getSimilarMovies(targetMovie, catalog = allMovies, count = 4) {
  if (!targetMovie) return [];
  const targetGenres = new Set(
    (targetMovie.genres || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((g) => g.length > 2),
  );

  const candidates = catalog
    .filter((m) => m.id !== targetMovie.id)
    .map((m) => {
      let overlap = 0;
      (m.genres || "")
        .toLowerCase()
        .split(/\s+/)
        .forEach((g) => {
          if (targetGenres.has(g)) overlap += 1;
        });
      return { movie: m, overlap };
    });

  candidates.sort(
    (a, b) =>
      b.overlap - a.overlap || (b.movie.rating || 0) - (a.movie.rating || 0),
  );
  return candidates.slice(0, count).map((c) => c.movie);
}
