import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { channel, username, message } = body;

  try {
    const newMessage = await prisma.twitchMessage.create({
      data: {
        channel,
        username,
        message,
      },
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error storing message:', error);
    return NextResponse.json({ error: 'Error storing message' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startTime = searchParams.get('startTime');

  if (!startTime) {
    return NextResponse.json({ error: 'Start time is required' }, { status: 400 });
  }

  try {
    const messages = await prisma.twitchMessage.findMany({
      where: {
        timestamp: {
          gte: new Date(startTime),
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Error fetching messages' }, { status: 500 });
  }
}