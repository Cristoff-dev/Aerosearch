import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const useSemantic = searchParams.get('useSemantic');

  const baseUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';
  const backendUrl = new URL(`${baseUrl}/api/v1/search`);

  if (query) backendUrl.searchParams.set('q', query);
  if (useSemantic) backendUrl.searchParams.set('useSemantic', 'true');

  try {
    const response = await fetch(backendUrl.toString(), {
      headers: {

        'X-API-Key': process.env.BACKEND_API_KEY || '',
      },

      cache: 'no-store' 
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Search Proxy Error]:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}