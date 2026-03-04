const http = require('http');

/**
 * 陣内風バックグラウンド・ワーカー
 * 「勝手にやっておく」ってのはこういうことだろ？
 */

const SYNC_INTERVAL = 30 * 60 * 1000; // 30分（ミリ秒）
const API_URL = 'http://localhost:3000/api/sync';

function triggerSync() {
    console.log(`[Worker] [${new Date().toISOString()}] 同期を開始するぜ。黙って見てろよ。`);

    http.get(API_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.success) {
                    const syncedCount = json.results.filter(r => r.status === 'synced').length;
                    console.log(`[Worker] 同期完了だ。新しく ${syncedCount} 本の動画を解析しといたぜ。`);
                } else {
                    console.error(`[Worker] ちっ、何かエラーだ：`, json.error);
                }
            } catch (e) {
                console.error(`[Worker] 解析に失敗した。サーバーが寝てるんじゃねえか？`);
            }
        });
    }).on('error', (err) => {
        console.error(`[Worker] サーバーに繋がらねえ。起動してるか確認しろよ：`, err.message);
    });
}

// 初回実行
triggerSync();

// 定期実行
setInterval(triggerSync, SYNC_INTERVAL);

console.log(`[Worker] バックグラウンド同期ワーカー起動。30分おきに勝手に仕事しといてやるよ。`);
