import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
  const userEmail = encodeURIComponent(session.user.email || "unknown");
  
  try {
    const res = await fetch(`${backendUrl}/api/v1/dashboard?user_email=${userEmail}`, {
      headers: {
        "x-api-secret": process.env.INTERNAL_API_SECRET || "super-secret-key-change-me-in-prod"
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Failed to fetch dashboard:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
  const userEmail = encodeURIComponent(session.user.email || "unknown");
  
  try {
    const res = await fetch(`${backendUrl}/api/v1/dashboard/refresh?user_email=${userEmail}`, {
      method: "POST",
      headers: {
        "x-api-secret": process.env.INTERNAL_API_SECRET || "super-secret-key-change-me-in-prod"
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Failed to refresh dashboard:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
