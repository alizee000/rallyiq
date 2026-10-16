import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function playoApiPlugin(): Plugin {
  return {
    name: 'playo-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/playo', async (req, res) => {
        const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
        let targetUrl = urlObj.searchParams.get('url');

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          if (targetUrl.includes('playo.page.link')) {
            const redirectRes = await fetch(targetUrl, { redirect: 'follow' });
            targetUrl = redirectRes.url;
          }

          const pageRes = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (!pageRes.ok) {
            res.statusCode = pageRes.status;
            res.end(JSON.stringify({ error: `Playo server returned status ${pageRes.status}` }));
            return;
          }

          const html = await pageRes.text();
          const match = html.match(/<script id=\"__NEXT_DATA__\" type=\"application\/json\">([\s\S]*?)<\/script>/);
          if (!match) {
            res.statusCode = 422;
            res.end(JSON.stringify({ error: 'Could not extract activity data from Playo page' }));
            return;
          }

          const nextData = JSON.parse(match[1]);
          const act = nextData?.props?.pageProps?.activityDetailInfo?.activityDetails;
          if (!act) {
            res.statusCode = 422;
            res.end(JSON.stringify({ error: 'Activity details not found in Playo data' }));
            return;
          }

          const players = (act.joinedPlayers || []).map((p: any) => ({
            id: p.id || Math.random().toString(36).substring(2, 9),
            name: p.name || 'Unknown Player',
            profilePicUrl: p.profilePicUrl || null,
            count: Number(p.count) || 1,
            link: p.link || null,
          }));

          res.statusCode = 200;
          res.end(
            JSON.stringify({
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
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), playoApiPlugin()],
})
