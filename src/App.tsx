import {useLayoutEffect, useState} from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0);
  const [tab, setTab] = useState<chrome.tabs.Tab>();

  useLayoutEffect( () => {
      chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
              console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
              if (request.type === "SUB"){
                  console.log(request.data);
                  sendResponse({success: true});
              }
          }
      );
      chrome.tabs.query({active: true, currentWindow: true,}).then((tabs) => {
          const [currTab] = tabs;
          setTab(currTab);
      });
  }, []);

  const onClick  = async () => {
      if(!tab) return;
      chrome.scripting.executeScript<number[] , number>({
          target: { tabId: tab.id! },
          func: () => {
              const buttons = document.getElementsByTagName('button');
              return buttons.length;
          }
      }).then((response) => {
          const [value] = response;
          if(value.result) setCount(value.result);
      });

      chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: async () => {
              const subscribe = document.getElementById('subscribe-button-shape')?.firstChild as HTMLElement;

              if(subscribe){
                  const response = await chrome.runtime.sendMessage({
                      type: 'SUB',
                      data: subscribe.outerHTML,
                  });
                  console.log(response);
              }
          }
      });

  };

  return (
    <div>
        <h1>Buttons: {count} </h1>

        <button onClick={onClick}>Check</button>
    </div>
  )
}

export default App
