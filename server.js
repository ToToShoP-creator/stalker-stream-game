const { WebSocketServer } = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
    let tiktokLiveConnection = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.action === 'setUniqueId' && data.uniqueId) {
                if (tiktokLiveConnection) {
                    tiktokLiveConnection.disconnect();
                }

                tiktokLiveConnection = new WebcastPushConnection(data.uniqueId);

                tiktokLiveConnection.connect().then(state => {
                    console.log(`Підключено до стріму @${data.uniqueId} (roomId: ${state.roomId})`);
                }).catch(err => {
                    console.error('Помилка підключення до TikTok:', err);
                });

                tiktokLiveConnection.on('gift', data => {
                    // Пересилаємо подарунок у браузерну гру через WebSocket
                    ws.send(JSON.stringify({
                        type: 'gift',
                        username: data.uniqueId,
                        giftName: data.giftName,
                        diamondCount: data.diamondCount
                    }));
                });
            }
        } catch (e) {
            console.error(e);
        }
    });

    ws.on('close', () => {
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }
    });
});

console.log('WebSocket міст для TikTok LIVE запущено на порту 8080');
