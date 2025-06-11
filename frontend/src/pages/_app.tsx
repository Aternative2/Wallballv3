import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <style>{`
          html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          #__next {
            height: 100vh;
          }
        `}</style>
      </Head>
      <Component {...pageProps} />
    </>
  );
}