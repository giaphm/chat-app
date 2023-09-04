'use client';
import type { Metadata } from 'next';
import { useCallback, useEffect, useRef, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { CalendarDateRangePicker } from '~/components/date-range-picker';
import { MainNav } from '~/components/main-nav';
import { Search } from '~/components/search';
import { UserNav } from '~/components/user-nav';
import { Sidebar } from '~/components/sidebar';

import { trpc } from '~/utils/trpc';

import { AddMessageForm } from './_components/add-message-form';

export type Playlist = (typeof playlists)[number];

export const playlists = [
  'Recently Added',
  'Recently Played',
  'Top Songs',
  'Top Albums',
  'Top Artists',
  'Logic Discography',
  'Bedtime Beats',
  'Feeling Happy',
  'I miss Y2K Pop',
  'Runtober',
  'Mellow Days',
  'Eminem Essentials',
];

export const metadata: Metadata = {
  title: 'Chat Page',
  description: 'Example chat page built using the components.',
};

export default function ChatPage() {
  const postsQuery = trpc.post.infinite.useInfiniteQuery(
    {},
    {
      getPreviousPageParam: (d) => d.prevCursor,
    },
  );
  const utils = trpc.useContext();
  const { hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage } =
    postsQuery;

  // list of messages that are rendered
  const [messages, setMessages] = useState(() => {
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    return msgs;
  });
  type Post = NonNullable<typeof messages>[number];
  const { data: session } = useSession();
  const email = session?.user?.email;
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // fn to add and dedupe new messages onto state
  const addMessages = useCallback((incoming?: Post[]) => {
    setMessages((current) => {
      const map: Record<Post['id'], Post> = {};
      for (const msg of current ?? []) {
        map[msg.id] = msg;
      }
      for (const msg of incoming ?? []) {
        map[msg.id] = msg;
      }
      return Object.values(map).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    });
  }, []);

  // when new data from `useInfiniteQuery`, merge with current state
  useEffect(() => {
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    addMessages(msgs);
  }, [postsQuery.data?.pages, addMessages]);

  const scrollToBottomOfList = useCallback(() => {
    if (scrollTargetRef.current == null) {
      return;
    }

    scrollTargetRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [scrollTargetRef]);
  useEffect(() => {
    scrollToBottomOfList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // subscribe to new posts and add
  trpc.post.onAdd.useSubscription(undefined, {
    onData(post) {
      addMessages([post]);
    },
    onError(err) {
      console.error('Subscription error:', err);
      // we might have missed a message - invalidate cache
      utils.post.infinite.invalidate();
    },
  });

  const [currentlyTyping, setCurrentlyTyping] = useState<string[]>([]);
  trpc.post.whoIsTyping.useSubscription(undefined, {
    onData(data) {
      setCurrentlyTyping(data);
    },
  });

  return (
    <>
      <div className="md:hidden">
        {/* <Image
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <Image
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        /> */}
      </div>
      <div className="hidden flex-col md:flex">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <MainNav className="mx-6" />
            <div className="ml-auto flex items-center space-x-4">
              <Search />
              <UserNav />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-5">
          <div className="col-span-1">
            <Sidebar playlists={playlists} className="hidden lg:block" />
          </div>
          <div className="col-span-4 overflow-y-hidden md:h-screen">
            <section className="flex h-full flex-col justify-end space-y-4 bg-gray-700 p-4">
              <div className="space-y-4 overflow-y-auto">
                <button
                  data-testid="loadMore"
                  onClick={() => fetchPreviousPage()}
                  disabled={!hasPreviousPage || isFetchingPreviousPage}
                  className="rounded bg-indigo-500 px-4 py-2 text-white disabled:opacity-40"
                >
                  {isFetchingPreviousPage
                    ? 'Loading more...'
                    : hasPreviousPage
                    ? 'Load More'
                    : 'Nothing more to load'}
                </button>
                <div className="space-y-4">
                  {messages?.map((item) => (
                    <article key={item.id} className=" text-gray-50">
                      <header className="flex space-x-2 text-sm">
                        <h3 className="text-base">
                          {item.source === 'RAW' ? (
                            item.email
                          ) : (
                            <a
                              href={`https://github.com/${item.email}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.email}
                            </a>
                          )}
                        </h3>
                        <span className="text-gray-500">
                          {new Intl.DateTimeFormat('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(item.createdAt)}
                        </span>
                      </header>
                      <p className="whitespace-pre-line text-xl leading-tight">
                        {item.text}
                      </p>
                    </article>
                  ))}
                  <div ref={scrollTargetRef}></div>
                </div>
              </div>
              <div className="w-full">
                <AddMessageForm onMessagePost={() => scrollToBottomOfList()} />
                <p className="h-2 italic text-gray-400">
                  {currentlyTyping.length
                    ? `${currentlyTyping.join(', ')} typing...`
                    : ''}
                </p>
              </div>

              {process.env.NODE_ENV !== 'production' && (
                <div className="hidden md:block">
                  <ReactQueryDevtools initialIsOpen={false} />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
