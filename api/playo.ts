export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle URL parameter
  let targetUrl = req.query?.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "url" query parameter' });
  }

  try {
    // If it's a dynamic link (e.g. playo.page.link), resolve redirect
    if (targetUrl.includes('playo.page.link')) {
      const redirectRes = await fetch(targetUrl, { redirect: 'follow' });
      targetUrl = redirectRes.url;
    }

    // Fetch the Playo activity page
    const pageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!pageRes.ok) {
      return res.status(pageRes.status).json({
        error: `Playo server returned status ${pageRes.status}`,
      });
    }

    const html = await pageRes.text();
    const match = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">([\s\S]*?)<\/script>/);

    if (!match) {
      return res.status(422).json({
        error: 'Could not extract activity data from Playo page. Please verify the URL or use Quick Paste.',
      });
    }

    const nextData = JSON.parse(match[1]);
    const act = nextData?.props?.pageProps?.activityDetailInfo?.activityDetails;

    if (!act) {
      return res.status(422).json({
        error: 'Playo activity details not found in page payload',
      });
    }

    const players = (act.joinedPlayers || []).map((p: any) => ({
      id: p.id || Math.random().toString(36).substring(2, 9),
      name: p.name || 'Unknown Player',
      profilePicUrl: p.profilePicUrl || null,
      count: Number(p.count) || 1,
      link: p.link || null,
    }));

    return res.status(200).json({
      success: true,
      activity: {
        id: act.activityId || targetUrl.split('/').pop()?.split('?')[0],
        venue: act.venueName || 'Unknown Venue',
        date: act.date || '',
        startTime: act.startTime || '',
        endTime: act.endTime || '',
        sport: act.sportType || 'Badminton',
        maxPlayers: act.maxPlayers || 0,
        host: act.host
          ? {
              id: act.host.id,
              name: act.host.name,
              profilePicUrl: act.host.profilePicUrl || null,
            }
          : null,
        joinedCount: players.length,
        players,
      },
    });
  } catch (err: any) {
    console.error('Playo fetch error:', err);
    return res.status(500).json({
      error: err.message || 'Internal error while fetching Playo activity',
    });
  }
}
