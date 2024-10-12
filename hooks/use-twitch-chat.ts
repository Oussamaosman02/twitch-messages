"use client";

import { useState, useEffect, useCallback } from 'react';
import tmi from 'tmi.js';

interface TwitchMessage {
  channel: string;
  username: string;
  message: string;
  timestamp: Date;
}

export function useTwitchChat() {
  const [client, setClient] = useState<tmi.Client | null>(null);
  const [messages, setMessages] = useState<TwitchMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback((channel: string) => {
    const newClient = new tmi.Client({
      channels: [channel]
    });

    newClient.connect().catch(console.error);

    newClient.on('message', (channel, tags, message, self) => {
      if (self) return;
      const newMessage: TwitchMessage = {
        channel,
        username: tags['display-name'] || tags.username || 'Anonymous',
        message,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Send message to the server to be stored in the database
      fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      }).catch(console.error);
    });

    setClient(newClient);
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setMessages([]);
    }
  }, [client]);

  useEffect(() => {
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [client]);

  return { messages, isConnected, connect, disconnect };
}