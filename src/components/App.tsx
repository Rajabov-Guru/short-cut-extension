import useCurrentTab from "../hooks/useCurrentTab.ts";
import {useEffect} from "react";

function App() {
    const tab = useCurrentTab();

    useEffect(() => {
        document.addEventListener('keydown', (evt) => {
            if (evt.key === "Escape" && tab && tab.id) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "CANCEL",
                });
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
        <button onClick={onClick}>Check</button>
    </div>
  )
}

export default App
