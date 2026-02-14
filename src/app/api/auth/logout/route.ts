import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete("kyber_session");

    // Redirect to login
    redirect("/auth/login");
}
