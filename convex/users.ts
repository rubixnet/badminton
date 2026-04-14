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
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      workosId: args.workosId,
      isOnboarded: true,
    });

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