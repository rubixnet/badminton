import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getGroupById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});


export const createGroup = mutation({
  args: { name: v.string(), adminId: v.id("users") },
  handler: async (ctx, args) => {
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      inviteCode,
      adminId: args.adminId,
      activeSheetId: process.env.GOOGLE_SHEET_ID || "",
    });

    // Link the creator to this group as ADMIN immediately
    await ctx.db.patch(args.adminId, {
      groupId: groupId,
      role: "admin"
    });

    return { groupId, inviteCode };
  },
});

export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
  },
});

export const getInviteInfo = query({
  args: {
    inviteCode: v.string(), 
    inviterId: v.optional(v.string())
  }, 
  handler: async (ctx, args) => {
    const group = await ctx.db
      .query("groups")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();

      if (!group) return null;

      let inviterName = "Someone";

      if (args.inviterId) {
        try {
          const inviter = await ctx.db.get(args.inviterId as any);
          if (inviter) {
            inviterName = inviter.name;
          }
        } catch (e) {
        }
      }

      return {
        groupName: group.name,
        inviterName: inviterName,
      };
    }
  });
  
export const triggerRefresh = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.groupId, { lastActivity: Date.now() });
  },
});

export const updatePublicScores = mutation({
  args: {
    groupId: v.id("groups"),
    adminWorkosId: v.string(),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("users")
      .withIndex("byWorkosId", (q) => q.eq("workosId", args.adminWorkosId))
      .unique();

    if (!admin || admin.groupId !== args.groupId) {
      throw new Error("Only this group's admin can change public scores.");
    }

    const group = await ctx.db.get(args.groupId);
    if (!group || group.adminId !== admin._id) {
      throw new Error("Only this group's admin can change public scores.");
    }

    await ctx.db.patch(args.groupId, { isPublic: args.isPublic });
    return { isPublic: args.isPublic };
  },
});
