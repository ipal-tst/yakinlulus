import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function extractTokenCookie(request: NextRequest): string | null {
  const cookies = request.headers.get('cookie') || '';
  // Backend expects 'token' cookie (from auth login), but frontend may have 'yakinlulus-token' too
  const token = cookies.match(/token=([^;]+)/);
  if (token) return `token=${token[1]}`;
  const yakinlulusToken = cookies.match(/yakinlulus-token=([^;]+)/);
  return yakinlulusToken ? `token=${yakinlulusToken[1]}` : null;
}

async function proxyRequest(request: NextRequest, slug: string[]) {
  const path = slug.join('/');
  const { searchParams } = new URL(request.url);
  const queryString = searchParams.toString();
  const url = `${BACKEND_URL}/academic/${path}${queryString ? '?' + queryString : ''}`;

  const tokenCookie = extractTokenCookie(request);
  const method = request.method;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (tokenCookie) {
    headers.Cookie = tokenCookie;
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };
  if (body) {
    fetchOptions.body = body;
  }

  const response = await fetch(url, fetchOptions);

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  return proxyRequest(request, slug);
}