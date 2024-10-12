"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useTwitchChat } from '@/hooks/use-twitch-chat';

const formSchema = z.object({
  channel: z.string().min(1, {
    message: "Channel name is required.",
  }),
});

export default function Home() {
  const [channel, setChannel] = useState('');
  const { messages, isConnected, connect, disconnect } = useTwitchChat();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      channel: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setChannel(values.channel);
    connect(values.channel);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Twitch Chat Message Fetcher</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitch Channel</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Twitch channel name" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the name of the Twitch channel you want to fetch messages from.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isConnected}>
            {isConnected ? 'Connected' : 'Connect'}
          </Button>
        </form>
      </Form>
      {isConnected && (
        <Button onClick={disconnect} className="mt-4">
          Disconnect and Download Messages
        </Button>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Messages from {channel}</h2>
        <div className="border rounded-lg p-4 h-96 overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <span className="font-bold">{msg.username}: </span>
              <span>{msg.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}