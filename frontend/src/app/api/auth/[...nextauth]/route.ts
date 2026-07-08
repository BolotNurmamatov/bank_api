import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_EMAILS = [
  "begimai.askarbekova@redpetroleum.kg",
  "jasmin.alymbekova@redpetroleum.kg",
  "bolot.nurmamatov@redpetroleum.kg",
  "adilet.smankulov@redpetroleum.kg",
  "aijamal.madylbekova@redpetroleum.kg"
];

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return false; // Reject the login attempt
      }

      if (user.email) {
        // Sync user to FastAPI backend
        try {
          // This will run on the Next.js server side
          // We use the internal Docker network URL or localhost if running locally
          const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
          const res = await fetch(`${backendUrl}/api/v1/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-secret": process.env.INTERNAL_API_SECRET || "super-secret-key-change-me-in-prod"
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name || "Unknown"
            })
          });
          if (!res.ok) {
            console.error("Failed to sync user with backend:", await res.text());
          }
        } catch (e) {
          console.error("Error syncing user:", e);
        }
      }
      return true;
    }
  }
});

export { handler as GET, handler as POST };
