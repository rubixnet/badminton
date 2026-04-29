"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CreateMatchScreen } from "@/components/create-match-screen";

export default function InterceptedNewMatchPage() {
  const params = useParams();
  const groupId = params?.groupid as string;
  const [user] = useState<{ _id: string; name: string } | null>(() => {
    if (typeof window === "undefined") return null;
    const cachedProfile = localStorage.getItem("user_profile");

    return cachedProfile ? JSON.parse(cachedProfile) : null;
  });

  if (!user || !groupId) return null; 

  return (
    <CreateMatchScreen 
      overlay 
      user={user} 
      group={{ _id: groupId }} 
    />
  );
}
