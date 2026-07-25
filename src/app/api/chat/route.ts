import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an AI Crime Intelligence Analyst for Karnataka Police. You have access to real FIR data, crime statistics, and predictions. Answer questions about crime data, trends, and patterns. Always cite specific FIR numbers and data points when possible. Be professional and helpful. Use markdown formatting for structured responses. If the user asks about something unrelated to crime data, politely redirect them.`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract keywords from user message for DB queries
    const lowerMessage = message.toLowerCase();
    const keywords = lowerMessage.split(/\s+/).filter(
      (w) => w.length > 2 && !['the', 'and', 'for', 'are', 'was', 'with', 'from', 'that', 'this', 'what', 'how', 'can', 'you', 'tell', 'about', 'many', 'much', 'does', 'have', 'show', 'list', 'give', 'me'].includes(w)
    );

    // Build database context
    const contextParts: string[] = [];
    const sources: string[] = [];

    // Search FIRs by keywords
    if (keywords.length > 0) {
      const firResults = await db.fir.findMany({
        where: {
          OR: keywords.map((kw) => ({
            OR: [
              { description: { contains: kw } },
              { crimeType: { contains: kw } },
              { district: { contains: kw } },
              { station: { contains: kw } },
            ],
          })),
        },
        take: 10,
        include: {
          suspects: { include: { person: true } },
          victims: { include: { person: true } },
        },
      });

      if (firResults.length > 0) {
        const firSummaries = firResults.map((fir) => {
          sources.push(fir.firNumber);
          const suspectNames = fir.suspects.map((s) => s.person.name).join(', ') || 'Unknown';
          const victimNames = fir.victims.map((v) => v.person.name).join(', ') || 'Unknown';
          return `[${fir.firNumber}] Date: ${fir.date.toISOString().split('T')[0]}, Type: ${fir.crimeType}, District: ${fir.district}, Station: ${fir.station}, Status: ${fir.status}, Severity: ${fir.severity}, Suspects: ${suspectNames}, Victims: ${victimNames}, Description: ${fir.description}`;
        });
        contextParts.push('RELEVANT FIRs:\n' + firSummaries.join('\n\n'));
      }
    }

    // Get overall stats
    const totalFirs = await db.fir.count();
    const openFirs = await db.fir.count({ where: { status: 'Open' } });
    const closedFirs = await db.fir.count({ where: { status: 'Closed' } });

    contextParts.push(`OVERALL STATS: Total FIRs: ${totalFirs}, Open: ${openFirs}, Closed: ${closedFirs}, Under Investigation: ${totalFirs - openFirs - closedFirs}`);

    // Check for district-specific queries
    const districts = ['Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Shivamogga', 'Belagavi'];
    for (const district of districts) {
      if (lowerMessage.includes(district.toLowerCase()) || lowerMessage.includes(district.split(' ')[0].toLowerCase())) {
        const districtFirs = await db.fir.count({ where: { district } });
        const districtOpen = await db.fir.count({ where: { district, status: 'Open' } });
        const crimeTypes = await db.fir.groupBy({
          by: ['crimeType'],
          where: { district },
          _count: { crimeType: true },
          orderBy: { _count: { crimeType: 'desc' } },
        });
        contextParts.push(`DISTRICT: ${district} — Total FIRs: ${districtFirs}, Open: ${districtOpen}, Crime Types: ${crimeTypes.map((c) => `${c.crimeType}(${c._count.crimeType})`).join(', ')}`);

        // Get predictions for this district
        const predictions = await db.prediction.findMany({
          where: { district },
          orderBy: { riskScore: 'desc' },
        });
        if (predictions.length > 0) {
          contextParts.push(`PREDICTIONS for ${district}: ${predictions.map((p) => `${p.crimeType}(risk: ${p.riskScore}/100, factors: ${p.factors})`).join('; ')}`);
        }

        // Get relevant FIRs for this district
        const districtFirDetails = await db.fir.findMany({
          where: { district },
          take: 5,
          orderBy: { date: 'desc' },
        });
        districtFirDetails.forEach((fir) => {
          if (!sources.includes(fir.firNumber)) sources.push(fir.firNumber);
        });
      }
    }

    // Check for crime-type-specific queries
    const crimeTypes = ['Theft', 'Burglary', 'Robbery', 'Cybercrime', 'Assault', 'Fraud', 'Vehicle Theft', 'Chain Snatching', 'Murder', 'Kidnapping', 'Drug Trafficking'];
    for (const crime of crimeTypes) {
      if (lowerMessage.includes(crime.toLowerCase())) {
        const crimeFirs = await db.fir.count({ where: { crimeType: crime } });
        const crimeOpen = await db.fir.count({ where: { crimeType: crime, status: 'Open' } });
        const crimeDistricts = await db.fir.groupBy({
          by: ['district'],
          where: { crimeType: crime },
          _count: { district: true },
          orderBy: { _count: { district: 'desc' } },
        });
        contextParts.push(`CRIME TYPE: ${crime} — Total: ${crimeFirs}, Open: ${crimeOpen}, By District: ${crimeDistricts.map((c) => `${c.district}(${c._count.district})`).join(', ')}`);

        // Get predictions for this crime type
        const predictions = await db.prediction.findMany({
          where: { crimeType: crime },
          orderBy: { riskScore: 'desc' },
        });
        if (predictions.length > 0) {
          contextParts.push(`PREDICTIONS for ${crime}: ${predictions.map((p) => `${p.district}(risk: ${p.riskScore}/100)`).join(', ')}`);
        }
      }
    }

    // High risk / predictions check
    if (lowerMessage.includes('risk') || lowerMessage.includes('predict') || lowerMessage.includes('trend')) {
      const topPredictions = await db.prediction.findMany({
        take: 10,
        orderBy: { riskScore: 'desc' },
      });
      if (topPredictions.length > 0) {
        contextParts.push(`HIGH RISK PREDICTIONS:\n` + topPredictions.map((p) => `• District: ${p.district} | Crime: ${p.crimeType} | Risk Score: ${p.riskScore}/100 | Month: ${p.month} | Factors: ${p.factors}`).join('\n'));
      }
    }

    // If no specific context was built, add general context
    if (contextParts.length <= 1) {
      const recentFirs = await db.fir.findMany({
        take: 8,
        orderBy: { date: 'desc' },
      });
      recentFirs.forEach((fir) => {
        if (!sources.includes(fir.firNumber)) sources.push(fir.firNumber);
      });
      contextParts.push(`RECENT FIRs: ${recentFirs.map((f) => `${f.firNumber} — ${f.crimeType} in ${f.district} (${f.status}, Severity: ${f.severity})`).join('; ')}`);

      const crimeByType = await db.fir.groupBy({
        by: ['crimeType'],
        _count: { crimeType: true },
        orderBy: { _count: { crimeType: 'desc' } },
      });
      contextParts.push(`CRIME BREAKDOWN: ${crimeByType.map((c) => `${c.crimeType}: ${c._count.crimeType}`).join(', ')}`);
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const contextMessage = `DATABASE CONTEXT:\n\n${contextParts.join('\n\n')}\n\nBased on the above crime data, answer the user's question. Cite FIR numbers when referencing specific cases.`;
        
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        const aiResponse = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextMessage}\n\nUSER QUESTION: ${message}` }]
            }
          ]
        });

        const responseText = aiResponse.text;
        if (responseText) {
          return NextResponse.json({
            response: responseText,
            sources: [...new Set(sources)],
          });
        }
      } catch (geminiErr) {
        console.error('Gemini API execution error, falling back to local synthesis:', geminiErr);
      }
    }

    // Fallback synthesis if API key is not present or API call fails
    let fallbackMarkdown = '';
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('trend') || lowerMessage.includes('predict')) {
      const predictions = await db.prediction.findMany({
        take: 5,
        orderBy: { riskScore: 'desc' },
      });
      fallbackMarkdown = `### ⚠️ High Risk Areas & Predictive Analytics\n\nBased on spatial-temporal predictive analysis model for Karnataka State:\n\n`;
      predictions.forEach((p) => {
        fallbackMarkdown += `* **${p.district}** — **${p.crimeType}** (Risk Score: **${p.riskScore}/100**)\n  * Key Factors: ${p.factors}\n  * Forecasted Period: ${p.month}\n\n`;
      });
      fallbackMarkdown += `*Recommendation:* Increase patrolling frequency and deploy unit officers to designated hot spots.`;
    } else {
      const recentFirs = await db.fir.findMany({
        take: 5,
        orderBy: { date: 'desc' },
      });
      const totalFirs = await db.fir.count();
      const openFirs = await db.fir.count({ where: { status: 'Open' } });
      const closedFirs = await db.fir.count({ where: { status: 'Closed' } });

      fallbackMarkdown = `### 📊 Karnataka Police Crime Intelligence Report\n\n`;
      fallbackMarkdown += `**Active Summary Statistics:**\n`;
      fallbackMarkdown += `* **Total Registered FIRs:** ${totalFirs}\n`;
      fallbackMarkdown += `* **Open Cases:** ${openFirs}\n`;
      fallbackMarkdown += `* **Closed Cases:** ${closedFirs}\n\n`;
      fallbackMarkdown += `**Recent Notable FIR Entries:**\n`;
      recentFirs.forEach((f) => {
        sources.push(f.firNumber);
        fallbackMarkdown += `* **[${f.firNumber}]** ${f.crimeType} in *${f.district} (${f.station})* — Status: \`${f.status}\` | Severity: **${f.severity}**\n  * Description: ${f.description}\n\n`;
      });
    }

    return NextResponse.json({
      response: fallbackMarkdown,
      sources: [...new Set(sources)],
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

