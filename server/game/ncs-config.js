/* ---------------------------------------------------------------------------
   NEON CITY STRIKE — server config
   This file is optional. Put it next to index.html (same folder) and the game
   loads it automatically. It configures multiplayer once, so players get a
   clean link with no query string:
       https://game.your-domain.com/
   Anything here can still be overridden per-link with URL parameters, e.g.
       index.html?room=ABCDE
   --------------------------------------------------------------------------- */

window.NCS_CONFIG = {
  // ---- your PeerServer (signalling: introduces the two players) -------------
  // With the server pack in this repo, PeerJS is served by nginx on the same
  // domain at /peerjs over wss://, so leave host/port empty and only give the
  // path + key. Setting host to the domain itself also works.
  path: '/peerjs',
  key: 'CHANGE_ME_PEERJS_RANDOM_KEY',
  secure: true,

  // ---- your TURN relay (this is what makes mobile data work) ----------------
  // Two phones on a carrier network hide their real IP. STUN cannot get
  // through that; only a relay can. Must match server/turnserver.conf.
  turnUser: 'ncs',
  turnPass: 'CHANGE_ME_RANDOM_PASSWORD',
  iceServers: [
    // keep the public STUN servers as a fast first path — they often succeed
    // immediately on home wifi, and TURN is only used when they fail
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] },
    // your own relay, for mobile networks
    {
      urls: 'turn:CHANGE_ME_TO_YOUR_DOMAIN_OR_IP:3478',
      username: 'ncs',
      credential: 'CHANGE_ME_RANDOM_PASSWORD'
    }
  ]
};
