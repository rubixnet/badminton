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