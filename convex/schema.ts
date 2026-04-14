import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    workosId: v.string(), 
    isOnboarded: v.boolean(),
    groupId: v.optional(v.id("groups")),
    role: v.optional(v.union(v.literal("admin"), v.literal("member"))),
  }).index("byWorkosId", ["workosId"]),

  groups: defineTable({
    name: v.string(),
    inviteCode: v.string(),
    adminId: v.id("users"), 
    activeSheetId: v.string(),
  }).index("byInviteCode", ["inviteCode"]),
});