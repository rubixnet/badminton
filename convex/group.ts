import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 1. Get Group details by ID
export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.groupId);
  },
});

// 2. Create a new Group (For Admins)
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

// 3. Find group by invite code (For Joiners)
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
  },
});