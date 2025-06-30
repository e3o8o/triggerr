import { createApi } from "unsplash-js";
import { createClient } from "pexels";

// --- TYPE DEFINITIONS ---

export interface UnsplashImage {
  id: string;
  url: string;
  user: {
    name: string;
    link: string;
  };
}

interface ImageFetcher {
  fetchTravelImages(): Promise<UnsplashImage[]>;
}

// --- DUAL SOURCE IMAGE FETCHER ---

class DualSourceImageFetcher implements ImageFetcher {
  private unsplashClient: any;
  private pexelsClient: any;

  constructor() {
    // Initialize Unsplash client
    this.unsplashClient = createApi({
      accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || "",
    });

    // Initialize Pexels client
    this.pexelsClient = process.env.NEXT_PUBLIC_PEXELS_API_KEY
      ? createClient(process.env.NEXT_PUBLIC_PEXELS_API_KEY)
      : null;
  }

  async fetchTravelImages(): Promise<UnsplashImage[]> {
    console.log("[ImageFetcher] Starting dual-source image fetch");

    // Primary: Try Unsplash first
    if (process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) {
      try {
        console.log("[ImageFetcher] Attempting Unsplash fetch");
        const images = await this.fetchFromUnsplash();
        if (images.length > 0) {
          console.log(
            `[ImageFetcher] Successfully fetched ${images.length} images from Unsplash`,
          );
          return images;
        }
      } catch (error) {
        console.warn("[ImageFetcher] Unsplash failed, trying Pexels:", error);
      }
    } else {
      console.log(
        "[ImageFetcher] No Unsplash API key provided, skipping to Pexels",
      );
    }

    // Fallback: Try Pexels
    if (process.env.NEXT_PUBLIC_PEXELS_API_KEY && this.pexelsClient) {
      try {
        console.log("[ImageFetcher] Attempting Pexels fetch");
        const images = await this.fetchFromPexels();
        if (images.length > 0) {
          console.log(
            `[ImageFetcher] Successfully fetched ${images.length} images from Pexels`,
          );
          return images;
        }
      } catch (error) {
        console.error("[ImageFetcher] Pexels also failed:", error);
      }
    } else {
      console.log(
        "[ImageFetcher] No Pexels API key provided or client not initialized",
      );
    }

    // Final fallback: Return empty array
    console.warn(
      "[ImageFetcher] Both image sources failed or unavailable, returning empty array",
    );
    return [];
  }

  private async fetchFromUnsplash(): Promise<UnsplashImage[]> {
    const result = await this.unsplashClient.search.getPhotos({
      query: "travel destinations wanderlust",
      orientation: "landscape",
      perPage: 20,
      orderBy: "relevant",
    });

    if (result.response && result.response.results) {
      return result.response.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        user: {
          name: photo.user.name,
          link: photo.user.links.html,
        },
      }));
    }

    return [];
  }

  private async fetchFromPexels(): Promise<UnsplashImage[]> {
    const result = await this.pexelsClient.photos.search({
      query: "travel destinations wanderlust",
      per_page: 20,
      orientation: "landscape",
    });

    if (result && result.photos) {
      return result.photos.map((photo: any) => ({
        id: photo.id.toString(),
        url: photo.src.large,
        user: {
          name: photo.photographer,
          link: photo.photographer_url,
        },
      }));
    }

    return [];
  }
}

// --- SINGLETON EXPORT ---

export const imageFetcher = new DualSourceImageFetcher();

// --- UTILITY FUNCTIONS ---

/**
 * Convenience function to fetch travel images with error handling
 */
export async function fetchTravelImages(): Promise<UnsplashImage[]> {
  try {
    return await imageFetcher.fetchTravelImages();
  } catch (error) {
    console.error("[ImageFetcher] Fatal error in fetchTravelImages:", error);
    return [];
  }
}

/**
 * Checks if any image sources are configured
 */
export function hasImageSourcesConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_PEXELS_API_KEY
  );
}

/**
 * Gets configured image sources for debugging
 */
export function getConfiguredImageSources(): string[] {
  const sources: string[] = [];
  if (process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY) sources.push("Unsplash");
  if (process.env.NEXT_PUBLIC_PEXELS_API_KEY) sources.push("Pexels");
  return sources;
}
