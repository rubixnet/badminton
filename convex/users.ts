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
      email: args.email,
      isOnboarded: true,
    };

    const inviteCode = args.inviteCode;

    if (inviteCode !== undefined) {
      const group = await ctx.db
        .query("groups")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", inviteCode))
        .unique();

      if (!group) {
        throw new Error("Invitation link is no longer valid.");
      }

      patchData.groupId = group._id;
      patchData.role = "member";
    }

    await ctx.db.patch(user._id, patchData);

    return user._id;
  },
});

export const completeOnboarding = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    name: v.string(),
    clubName: v.optional(v.string()),
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = await ctx.db
      .query("users")
      .withIndex("byWorkosId", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        workosId: args.workosId,
        email: args.email,
        isOnboarded: false,
        name: "",
      });

      user = await ctx.db.get(userId);
    }

    if (!user) {
      throw new Error("Unable to create user profile.");
    }

    let groupId = user.groupId;
    let role = user.role;

    if (args.inviteCode) {
      const group = await ctx.db
        .query("groups")
        .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode!))
        .unique();

      if (!group) {
        throw new Error("Invitation link is no longer valid.");
      }

      groupId = group._id;
      role = "member";
    } else if (!groupId) {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      groupId = await ctx.db.insert("groups", {
        name: args.clubName || `${args.name}'s Club`,
        inviteCode,
        adminId: user._id,
        activeSheetId: process.env.GOOGLE_SHEET_ID || "",
      });
      role = "admin";
    }

    await ctx.db.patch(user._id, {
      name: args.name,
      email: args.email,
      isOnboarded: true,
      groupId,
      role,
    });

    return { userId: user._id, groupId };
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

export const updateMemberName = mutation({
  args: {
    adminWorkosId: v.string(),
    memberId: v.id("users"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("byWorkosId", (q) => q.eq("workosId", args.adminWorkosId))
      .unique();

    if (!admin?.groupId) {
      throw new Error("Only group admins can edit members.");
    }

    const group = await ctx.db.get(admin.groupId);
    if (!group || group.adminId !== admin._id) {
      throw new Error("Only group admins can edit members.");
    }

    const member = await ctx.db.get(args.memberId);
    if (!member || member.groupId !== admin.groupId) {
      throw new Error("Member not found in this group.");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Member name is required.");
    }

    await ctx.db.patch(args.memberId, { name });
    return args.memberId;
  },
});
