import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getProfile = query({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("byWorkosId", (q) => q.eq("workosId", args.workosId))
      .unique();
  },
});

export const finalizeUser = mutation({
  args: { 
    workosId: v.string(), 
    name: v.string(), 
    email: v.string(),
    inviteCode: v.optional(v.string()) 
  },
  handler: async (ctx, args) => {
    // 1. Create the base user profile
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      workosId: args.workosId,
      isOnboarded: true,
    });

    // 2. THE PERMANENT FIX:
    // We capture the inviteCode into a local constant.
    // This "narrows" the type from (string | undefined) to just (string).
    const inviteCode = args.inviteCode;

    if (inviteCode !== undefined) {
      const group = await ctx.db
        .query("groups")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();

      if (group) {
        await ctx.db.patch(userId, {
          groupId: group._id,
          role: "member",
        });
      }
    }
    
    return userId;
  },
});