import {useLayoutEffect, useState} from "react";

const useCurrentTab = () => {
    const [tab, setTab] = useState<chrome.tabs.Tab>();

    useLayoutEffect(() => {
        const queryObj = {
            active: true,
            currentWindow: true
        };

        chrome.tabs.query(queryObj).then((tabs) => {
            const [currTab] = tabs;
            setTab(currTab);
        });
    }, []);

    return tab as chrome.tabs.Tab;
};

export default useCurrentTab;
