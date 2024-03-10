const store = {
    addSessionStarted: false,
    buttons: [],
    clones: [],
    map: new Map(),
};

const consts = {
    availableAnimName: 'pulsate',
};

function addAvailableAnimation(){
    const keyframes = `@keyframes ${consts.availableAnimName} {
        0% { transform: scale(1); }
        50% { transform: scale(0.7); }
        100% { transform: scale(1); }
    }`;

    const style = document.createElement('style');
    style.innerHTML = keyframes;
    document.head.appendChild(style);
}

function resetButtons(){
    store.clones.forEach((clone) => {
        const btn = store.map.get(clone);
        btn.style.display = clone.style.display;
        clone.remove();
    });
    store.clones = [];
    store.buttons = [];
    store.map.clear();
    store.addSessionStarted = false;
}

function getDummyClone(btn){
    btn.removeAttribute("onclick");
    const clone = btn.cloneNode(true);
    clone.removeAttribute("onclick");
    clone.style.animation = `${consts.availableAnimName} 0.5s ease-in-out infinite`;
    return clone;
}

function onNewShortKey(){
    if(store.addSessionStarted) return;
    store.addSessionStarted = true;

    addAvailableAnimation();

    store.buttons = document.querySelectorAll('button');

    store.buttons.forEach((btn) => {
        const style = window.getComputedStyle(btn);
        if(style.display === 'none') return;
        const clone = getDummyClone(btn);
        btn.parentNode.insertBefore(clone, btn);

        store.clones.push(clone);
        store.map.set(clone, btn);

        btn.style.display = 'none';

        clone.addEventListener('click', () => {
            const target = store.map.get(clone);
            console.log(target.outerHTML);
            resetButtons();
        })
    });
}

const messageHandler = {
    NEW_SHORT_KEY: onNewShortKey,
    CANCEL: resetButtons,
};

chrome.runtime.onMessage.addListener((obj) => {
    const { type } = obj;
    console.log({type});
    const handler = messageHandler[type];
    if(handler) handler();
});

function start(){
    document.addEventListener('keydown', (evt) => {
        if (evt.key === "Escape") resetButtons();
    });
}

start();
