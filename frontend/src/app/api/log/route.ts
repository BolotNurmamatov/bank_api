import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
  const userEmail = session.user.email || "unknown";
  
  try {
    const body = await req.json();
    const res = await fetch(`${backendUrl}/api/v1/dashboard/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-email": userEmail,
        "x-api-secret": process.env.INTERNAL_API_SECRET || "super-secret-key-change-me-in-prod"
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to log action:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
