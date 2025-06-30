export type SiteConfig = {
  name: string;
  title: string;
  description: string;
  origin: string;
  og: string;
  keywords: string[];
  creator: {
    name: string;
    url: string;
  }
  socials: {
    github: string;
    x: string;
  }
}

// =================================================================
// ENVIRONMENT VARIABLE TYPE DEFINITIONS
// =================================================================
// By augmenting the global NodeJS.ProcessEnv interface, we provide
// TypeScript with type safety for our custom environment variables.
// This prevents runtime errors from typos and provides autocompletion.

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * The private key for the PayGo admin wallet, used for system-wide operations
       * like funding the faucet or processing automated payouts.
       * It must be a 64-character hex string prefixed with '0x'.
       * @example "0x54a544b6234f6685f1f01a47fdaf1fe14d6c636f7faf0f16f103cc66bf2093a1"
       */
      PAYGO_ADMIN_PK: `0x${string}`;
    }
  }
}
