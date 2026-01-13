import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Anonymous],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args): Promise<Id<"users">> {
      // If user already exists, return existing ID
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // When signing up with password, check if a user with this email already exists
      // This handles the case where user accepted invitation anonymously first
      const email = args.profile?.email?.toLowerCase().trim();
      if (email) {
        // First, check if the current authenticated user already has this email
        const currentUserId = await getAuthUserId(ctx);
        if (currentUserId) {
          const currentUser = await ctx.db.get(currentUserId);
          if (currentUser && currentUser.email?.toLowerCase().trim() === email) {
            // Current user already has this email, link password account to current user
            return currentUserId;
          }
        }
        
        // Check if any user with this email exists
        const allUsers = await ctx.db.query("users").collect();
        const existingUser = allUsers.find((user: any) => 
          user.email?.toLowerCase().trim() === email
        );
        
        if (existingUser) {
          // Link the password account to the existing user
          return existingUser._id;
        }
      }

      // Create new user with profile data
      const userData: { email?: string; name?: string } = {};
      if (email && typeof email === "string") {
        userData.email = email;
      }
      const name = args.profile?.name;
      if (name && typeof name === "string") {
        userData.name = name;
      }
      const userId = await ctx.db.insert("users", userData);
      return userId;
    },
  },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
