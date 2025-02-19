import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Head from 'next/head';
import Story from './Story';
import styles from './index.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Adventure</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>

      <main className={styles.main}>
        <Story />
      </main>
    </>
  );
}

