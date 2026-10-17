/* --------------------------------------------------------------------------- *
 *  NEON CITY STRIKE — server config  (OPTIONAL — leave it empty to use the    *
 *  public PeerJS cloud, exactly as the game did before this file existed)     *
 *                                                                            *
 *  The game loads this file from <head> before it starts. Anything set here   *
 *  can still be overridden per-link with URL parameters, e.g.                 *
 *      index.html?room=ABCDE                                                 *
 *      index.html?peerHost=peer.example.com&peerKey=KEY&peerSecure=1          *
 *                                                                            *
 *  To host multiplayer on YOUR server, fill this in:                          *
 *                                                                            *
 *  window.NCS_CONFIG = {                                                     *
 *    path: '/peerjs',                                                        *
 *    key: 'CHANGE_ME_PEERJS_RANDOM_KEY',                                     *
 *    secure: true,                                                           *
 *    turnUser: 'ncs',                                                        *
 *    turnPass: 'CHANGE_ME_RANDOM_PASSWORD',                                  *
 *    iceServers: [                                                           *
 *      { urls: ['stun:stun.l.google.com:19302',                              *
 *               'stun:stun.cloudflare.com:3478'] },                          *
 *      { urls: 'turn:your-domain-or-ip:3478',                                *
 *        username: 'ncs', credential: 'CHANGE_ME_RANDOM_PASSWORD' }          *
 *    ]                                                                       *
 *  };                                                                        *
 *                                                                            *
 *  The `server/` folder in this repo generates this file for you:             *
 *  copy server/* to a VPS and run  sudo bash setup.sh                        *
 * --------------------------------------------------------------------------- */
