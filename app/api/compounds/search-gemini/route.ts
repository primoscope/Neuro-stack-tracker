import { NextRequest, NextResponse } from 'next/server';
import { searchCompoundWithGemini } from '@/lib/gemini-search';

export const runtime = 'edge';

/**
 * POST /api/compounds/search-gemini
 * Search for compound information using Gemini AI and internet data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, includeInteractions, includeMechanism, includeDosage } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const result = await searchCompoundWithGemini({
      query: query.trim(),
      includeInteractions: includeInteractions !== false, // Default true
      includeMechanism: includeMechanism !== false, // Default true
      includeDosage: includeDosage !== false, // Default true
    });

    if (!result) {
      return NextResponse.json(
        { 
          error: 'No results found or API not configured',
          message: 'Set GEMINI_API_KEY environment variable to enable AI search'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/compounds/search-gemini?query=...
 * Search for compound information using Gemini AI and internet data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const includeInteractions = searchParams.get('includeInteractions') !== 'false';
    const includeMechanism = searchParams.get('includeMechanism') !== 'false';
    const includeDosage = searchParams.get('includeDosage') !== 'false';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const result = await searchCompoundWithGemini({
      query: query.trim(),
      includeInteractions,
      includeMechanism,
      includeDosage,
    });

    if (!result) {
      return NextResponse.json(
        { 
          error: 'No results found or API not configured',
          message: 'Set GEMINI_API_KEY environment variable to enable AI search'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Gemini search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
