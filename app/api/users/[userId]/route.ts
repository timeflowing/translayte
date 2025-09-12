import { NextRequest } from 'next/server';




export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Your logic here
  return new Response(
    JSON.stringify({ token }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}