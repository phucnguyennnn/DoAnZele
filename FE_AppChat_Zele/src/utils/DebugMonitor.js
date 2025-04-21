/**
 * Tiện ích theo dõi và debug sự kiện socket
 */

import socket from '../socket/socket';

class DebugMonitor {
    static init() {
        // Monitor all socket events
        socket.onAny((event, ...args) => {
            console.log(`[DEBUG-SOCKET] Event: ${event}`, args);
        });

        // Monitor messages state updates
        if (window._debugMonitor) return;

        window._debugMonitor = true;

        // Ghi đè console.log cũ để lọc thông tin hữu ích
        const oldConsoleLog = console.log;
        console.log = function (...args) {
            // Lọc các log về socket và tin nhắn để dễ theo dõi
            if (args[0] && typeof args[0] === 'string' &&
                (args[0].includes('socket') ||
                    args[0].includes('tin nhắn') ||
                    args[0].includes('message'))) {
                args.unshift('[CHAT-DEBUG]');
            }
            oldConsoleLog.apply(console, args);
        };
    }
}

export default DebugMonitor;
