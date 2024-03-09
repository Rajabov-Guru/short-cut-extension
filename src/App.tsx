import {useLayoutEffect, useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);

  useLayoutEffect( () => {
      chrome.tabs.query({active: true, currentWindow: true,}).then((tabs) => {
          const [currTab] = tabs;
          setTab(currTab);

          if(currTab){
              chrome.storage.sync.get([currTab.url], (data) => {
                  if(currTab.url && data[currTab.url]) {
                      setCount(Number(data[currTab?.url]))
                  }
              })
          }
      });
  }, []);

  const onClick  = async () => {
      setCount((count) => count + 1);
      if(tab?.url) {
          chrome.storage.sync.set({
              [tab?.url]: `${count + 1}`
          });
      }
  };

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{tab?.url} [Tab: {tab?.id}]</h1>
      <div className="card">
        <button onClick={onClick}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
