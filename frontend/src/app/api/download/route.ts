import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: Request) {
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
  const userEmail = session.user.email || "unknown";
  
  const { searchParams } = new URL(req.url);
  const bank = searchParams.get('bank') || '';
  const account = searchParams.get('account') || '';
  const date_from = searchParams.get('date_from') || '';
  const date_to = searchParams.get('date_to') || '';
  
  const queryParams = new URLSearchParams();
  if (bank) queryParams.append('bank', bank);
  if (account) queryParams.append('account', account);
  if (date_from) queryParams.append('date_from', date_from);
  if (date_to) queryParams.append('date_to', date_to);

  try {
    const res = await fetch(`${backendUrl}/api/v1/dashboard/download?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "user-email": userEmail,
        "x-api-secret": process.env.INTERNAL_API_SECRET || "super-secret-key-change-me-in-prod"
      }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }
    
    const blob = await res.blob();
    const headers = new Headers();
    headers.set("Content-Type", "text/csv; charset=utf-8-sig");
    headers.set("Content-Disposition", 'attachment; filename="report.csv"');
    
    return new NextResponse(blob, { headers });
  } catch (e) {
    console.error("Failed to download data:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
