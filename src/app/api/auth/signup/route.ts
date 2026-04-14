import { getSignUpUrl } from "@workos-inc/authkit-nextjs"
import { redirect } from "next/navigation";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const inviteCode = searchParams.get("invite");
    const via = searchParams.get('via');

    const state = inviteCode ? JSON.stringify({ inviteCode, via }) : undefined;

    const url = await getSignUpUrl({state});

    redirect(url);
}