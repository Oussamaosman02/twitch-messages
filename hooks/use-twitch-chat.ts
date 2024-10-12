"use client";

import { useState, useEffect, useCallback } from "react";
import tmi from "tmi.js";
import { openDB } from "idb";

interface TwitchMessage {
  channel: string;
  username: string;
  message: string;
  timestamp: Date;
}
const DB_NAME = "TwitchMessagesDB";
const STORE_NAME = "messages";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
}

async function saveMessage(newMessage: TwitchMessage) {
  const db = await getDB();
  await db.add(STORE_NAME, newMessage);
}

async function getFilteredMessages(
  connectionStartTime: Date
): Promise<TwitchMessage[]> {
  const db = await getDB();
  const allMessages = await db.getAll(STORE_NAME);

  // Filter messages based on the timestamp
  const filteredMessages = allMessages.filter((message: TwitchMessage) => {
    return (
      new Date(message.timestamp).getTime() >= connectionStartTime.getTime()
    );
  });

  return filteredMessages as TwitchMessage[];
}

export function useTwitchChat() {
  const [client, setClient] = useState<tmi.Client | null>(null);
  const [messages, setMessages] = useState<TwitchMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStartTime, setConnectionStartTime] = useState<Date | null>(
    null
  );

  const connect = useCallback((channel: string) => {
    const newClient = new tmi.Client({
      channels: [channel],
    });

    newClient.connect().catch(console.error);

    newClient.on("message", (channel, tags, message, self) => {
      if (self) return;
      const newMessage: TwitchMessage = {
        channel,
        username: tags["display-name"] || tags.username || "Anonymous",
        message,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);

      saveMessage(newMessage);
      // if (window && localStorage) {
      //   const storedMessages = JSON.parse(
      //     localStorage.getItem("messages") || "[]"
      //   ) as TwitchMessage[];
      //   localStorage.setItem(
      //     "messages",
      //     JSON.stringify([...storedMessages, newMessage])
      //   );
      // }
      // Send message to the server to be stored in the database
      // fetch("/api/messages", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(newMessage),
      // }).catch(console.error);
    });

    setClient(newClient);
    setIsConnected(true);
    setConnectionStartTime(new Date());
  }, []);

  const disconnect = useCallback(async () => {
    if (client && connectionStartTime) {
      client.disconnect();
      setClient(null);
      setIsConnected(false);
      setMessages([]);

      // Download messages
      try {
        const messages = await getFilteredMessages(connectionStartTime);
        // const response = JSON.parse(localStorage.getItem("messages") || "[]");
        // const messages = response.filter(
        //   (m: TwitchMessage) =>
        //     new Date(m.timestamp).getTime() >= connectionStartTime.getTime()
        // );
        // const response = await fetch(
        //   `/api/messages?startTime=${connectionStartTime.toISOString()}`
        // );
        // if (!response.ok) {
        //   throw new Error("Failed to fetch messages");
        // }
        // const messages = await response.json();
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(messages, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${[...messages]
          .reverse()[0]
          .channel.replace("#", "")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading messages:", error);
      }

      setConnectionStartTime(null);
    }
  }, [client, connectionStartTime]);

  useEffect(() => {
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [client]);

  return { messages, isConnected, connect, disconnect };
}
