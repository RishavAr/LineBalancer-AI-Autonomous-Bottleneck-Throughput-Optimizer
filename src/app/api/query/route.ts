import { NextResponse } from 'next/server';
import { getDatabase, executeSQL } from '@/lib/database';
import { parseNaturalLanguageQuery, generateAgentResponse } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    // Parse the natural language query
    const parsedQuery = parseNaturalLanguageQuery(query);
    
    let data: Record<string, unknown>[] = [];
    
    try {
      // Execute the generated SQL
      data = executeSQL(parsedQuery.sql) as Record<string, unknown>[];
    } catch (sqlError) {
      console.error('SQL execution error:', sqlError);
      // Return a helpful response even if SQL fails
      data = [];
    }
    
    // Generate the agent response
    const response = generateAgentResponse(query, data, parsedQuery);
    
    return NextResponse.json({
      ...response,
      sql: parsedQuery.sql,
      data: data.slice(0, 10), // Limit data sent to client
    });
  } catch (error) {
    console.error('Query API error:', error);
    
    return NextResponse.json({
      answer: 'I encountered an error processing your query. Please try rephrasing your question.',
      reasoning: [
        { step: 1, thought: 'Attempted to parse query', observation: 'Error occurred during processing' },
      ],
      confidence: 0.3,
      sources: [],
      suggestions: [
        'Try asking about specific stations',
        'Ask about shift comparisons',
        'Query defect rates or downtime',
      ],
    });
  }
}
