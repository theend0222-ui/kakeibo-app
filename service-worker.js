// キャッシュのバージョン名（アップデート時はここを変更する）
const CACHE_NAME = "kakeibo-app-v2";

// オフラインでも動かすために保存（キャッシュ）しておくファイル
// 相対パスに統一してGitHub Pagesなどの環境でも動くようにする
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. インストール時の処理（キャッシュの保存）
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // アイコン画像などがまだ用意されていなくて失敗しても、
        // 全体が止まらないようにエラーを握り潰しながら個別にキャッシュします
        return Promise.all(
          ASSETS.map(url => {
            return cache.add(url).catch(err => console.log('キャッシュをスキップしました (ファイル未配置など):', url));
          })
        );
      })
  );
});

// 2. ネットワークリクエストごとの処理（オフライン対応）
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにデータがあればそれを返す
        if (response) {
          return response;
        }
        // なければ通常通りネットワークから取得する
        return fetch(event.request).catch(() => {
          // オフライン時のフォールバック処理をここに書くことができます
        });
      })
  );
});

// 3. アクティベート時の処理（古いキャッシュの削除）
self.addEventListener('activate', function(event) {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 現在のバージョンではない古いキャッシュは削除する
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
