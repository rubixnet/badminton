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

export const createProfile = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    isOnboarded: v.boolean(), 
  }, 
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('byWorkosId', (q) => q.eq('workosId', args.workosId))
      .unique();

      if (existingUser) {
        return existingUser;
      }

      const newUserId = await ctx.db.insert('users', {
        workosId: args.workosId,
        email: args.email,
        isOnboarded: args.isOnboarded,
        name: '', 
      });

      return await ctx.db.get(newUserId);
  }
})

export const finalizeUser = mutation({
  args: {
    workosId: v.string(),
    name: v.string(),
    email: v.string(),
    inviteCode: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("byWorkosId", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("User not found. Cannot finalize onboarding.");
    }

    const patchData: any = {
      name: args.name,
      isOnboarded: true,
    };

    const inviteCode = args.inviteCode;

    if (inviteCode !== undefined) {
      const group = await ctx.db
        .query("groups")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();

      if (group) {
        patchData.groupId = group._id;
        patchData.role = "member";
      }
    }

    await ctx.db.patch(user._id, patchData);

    return user._id;
  },
});

export const getUsersByGroupId = query({
  args: { groupId: v.string() }, 
  handler: async (ctx, args) => {
    const groupIdAsId = ctx.db.normalizeId("groups", args.groupId);
    if (!groupIdAsId) return [];

    return await ctx.db
      .query("users")
      .withIndex("by_groupId", (q) => q.eq("groupId", groupIdAsId))
      .collect();
  },
});