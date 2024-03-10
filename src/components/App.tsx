import useCurrentTab from "../hooks/useCurrentTab.ts";
import {useEffect} from "react";

function App() {
    const tab = useCurrentTab();

    function cancel(){
        if(tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "CANCEL",
            });
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', (evt) => {
            if (evt.key === "Escape") {
                cancel();
            }
        });
    }, [tab]);

    const onClick = () => {
        if(tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "NEW_SHORT_KEY",
            }, () => {
                //when response sent back
            });
        }
    }

  return (
    <div>
        <h1>YOUR SHORT KEYS</h1>
        <button onClick={onClick}>New</button>
        <button onClick={cancel}>Cancel</button>
    </div>
  )
}

export default App
