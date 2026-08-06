function require(key: string): string {
  const value = Bun.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  port: parseInt(Bun.env.PORT ?? "3000"),
  baseUrl: Bun.env.BASE_URL ?? "http://localhost:3000",
  externalApiKey: Bun.env.EXTERNAL_API_KEY,
  jwtSecret: require("JWT_SECRET"),
  pocketId: {
    baseUrl: "https://auth.nicoprt.xyz",
    clientId: require("POCKETID_CLIENT_ID"),
    clientSecret: require("POCKETID_CLIENT_SECRET"),
    redirectUri: require("POCKETID_REDIRECT_URI"),
  },
  smtp: {
    host: require("SMTP_HOST"),
    port: parseInt(Bun.env.SMTP_PORT ?? "2525"),
    user: require("SMTP_USR"),
    pass: require("SMTP_PASS"),
    from: Bun.env.EMAIL_FROM ?? require("SMTP_USR"),
  },
};
