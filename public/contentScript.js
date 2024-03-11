var store = {
    addSessionStarted: false,
    buttons: [],
    keyToButtonMap: new Map(),
    buttonToKeyMap: new Map(),
    clones: [],
    map: new Map(),
    escapeListener: null,

    targetButton: null,

    dialog: null,
    dialogKeyListener: null,

    targetKeys: [],
    keysEntered: false,

    pageKey: '',
    savedShortCuts: [],

    shortcutMap: {},

    triggeredKeys: [],

};

var consts = {
    availableAnimName: 'pulsate',

    dialogId: 'short_key_dialog',
    closeDialogId: 'short_key_dialog_close',
    saveDialogId: 'short_key_dialog_save',
    resetDialogId: 'short_key_dialog_reset',
    contentDialogId: 'short_key_dialog_content',
    shortCutBtnClass: 'shortCutButton',

    maxShortCutLength: 3,

    shortCutPlaceholder: ''
};

function fetchShortCuts(){
    return new Promise((resolve) => {
        chrome.storage.sync.get([store.pageKey], (obj) => {
            resolve(obj[store.pageKey] ? JSON.parse(obj[store.pageKey]) : []);
        });
    });
}

function addAvailableAnimation(){
    const keyframes = `@keyframes ${consts.availableAnimName} {
        0% { transform: scale(1); }
        25% { transform: scale(0.9); }
        50% { transform: scale(0.8); }
        75% { transform: scale(0.9); }
        100% { transform: scale(1); }
    }`;

    const style = document.createElement('style');
    style.innerHTML = keyframes;
    document.head.appendChild(style);
}

function updateButtons(){
    store.buttons = document.querySelectorAll('button');

    store.buttons.forEach((btn) => {
        const key = btn.outerHTML;
        if(!store.keyToButtonMap.has(key)) {
            store.keyToButtonMap.set(key, btn);
        }
        if(!store.buttonToKeyMap.has(btn)) {
            store.buttonToKeyMap.set(btn, key);
        }
    });
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
}

function getDummyClone(btn){
    // TODO: improve
    btn.removeAttribute("onclick");
    const clone = btn.cloneNode(true);
    clone.removeAttribute("onclick");
    clone.style.animation = `${consts.availableAnimName} 0.5s ease-in-out infinite`;
    return clone;
}

function addEscapeListener(){
    const handler = (evt) => {
        if (evt.key === "Escape") onCancel();
    }
    document.addEventListener('keydown', handler);

    store.escapeListener = handler;
}

function onNewShortKey(){
    if(store.addSessionStarted) return;

    addEscapeListener();

    store.addSessionStarted = true;
    addAvailableAnimation();

    updateButtons();
    store.buttons.forEach((btn) => {
        const style = window.getComputedStyle(btn);
        if(style.display === 'none') return;

        const clone = getDummyClone(btn);
        btn.parentNode.insertBefore(clone, btn);

        store.clones.push(clone);
        store.map.set(clone, btn);

        btn.style.display = 'none';

        clone.addEventListener('click', () => {
            store.targetButton = btn;
            console.log(store.targetButton);
            resetButtons();
            onSelectButton();
        });

    });
}

function getShortCutView(keys){
    return keys.map((key) => {
        let value = key.code;
        if(key.code.startsWith('Key')) value = key.code.substring(3);

        return `<div class="${consts.shortCutBtnClass}">${value}</div>`;
    }).join(' + ');
}

function validateShortCut(shortcut){
    if(shortcut.length < 2 || shortcut.length > 3) return false;

    const keyCodes = shortcut.map((sh) => sh.keyCode);

    const first = keyCodes[0];

    const [shift, ctrl, alt] = [16, 17, 18];

    const invalidFirst = (
        first !== shift
        && first !== ctrl
        && first !== alt
    );

    if(invalidFirst) return false;

    let validAfterShift = true;

    for(let i = 0; i < keyCodes.length; i++){
        if(keyCodes[i] === shift && i !== keyCodes.length - 1) {
            const after = keyCodes[i + 1];
            const functional = after >= 112 && after <= 123;
            const tab = after === 9;
            const ctrlAlt = after === 17 || after === 18;

            validAfterShift = functional || tab || ctrlAlt;
        }
    }

    return validAfterShift;
}

async function updateShortCuts(){
    store.savedShortCuts = await fetchShortCuts();

    store.shortcutMap = {};

    for(let i = 0; i < store.savedShortCuts.length;i++){
        const { shortCutKey, shortCutValue } = store.savedShortCuts[i];

        const name = getShortCutName(shortCutValue);
        store.shortcutMap[name] = shortCutKey;
    }

    console.log(store.shortcutMap);
}

function onEnterShortCut(){
    store.keysEntered = true;
    console.log(store.targetKeys);
    const content = document.getElementById(consts.contentDialogId);
    content.innerHTML = getShortCutView(store.targetKeys);

    const isValid = validateShortCut(store.targetKeys);

    if(!isValid) {
        store.dialog.setAttribute('data-error', 'GG');
        return;
    }

    const save = document.getElementById(consts.saveDialogId);
    save.disabled = false;
}

function onSelectButton(){
    const handler = (evt) => {
        evt.stopPropagation();
        evt.preventDefault();
        if(store.keysEntered) return;

        if(evt.type === 'keydown') {
            if(store.targetKeys.length >= consts.maxShortCutLength) return;

            const keyItem  = {
                code: evt.code,
                keyCode: evt.keyCode,
            };

            store.targetKeys.push(keyItem);
        }

        if(evt.type === 'keyup') onEnterShortCut();
    };

    store.dialogKeyListener = handler;

    ['keydown', 'keyup', 'keypress'].forEach((eventName) => {
        store.dialog.addEventListener(eventName, handler);
    });

    store.dialog.showModal();
}

function onCancel(){
    resetButtons();
    if(store.dialog) {
        store.dialog.close();
    }
    store.addSessionStarted = false;
    document.removeEventListener('keydown', store.escapeListener);
}

function onDialogReset(){
    store.targetKeys = [];
    store.keysEntered = false;

    const content = document.getElementById(consts.contentDialogId);
    content.innerHTML = consts.shortCutPlaceholder;

    const save = document.getElementById(consts.saveDialogId);
    save.disabled = true;

    store.dialog.removeAttribute('data-error');
}

function onDialogClose() {
    store.dialog.close();
    ['keydown', 'keyup', 'keypress'].forEach((eventName) => {
        store.dialog.removeEventListener(eventName, store.dialogKeyListener);
    });

    onDialogReset();

    store.targetButton = null;
    store.addSessionStarted = false;
}

async function onDialogSave(){
    const shortCutKey = store.buttonToKeyMap.get(store.targetButton);
    const shortCutValue = store.targetKeys;
    onDialogClose();

    const shortCutItem = { shortCutKey, shortCutValue };
    await chrome.storage.sync.set({
        [store.pageKey]: JSON.stringify([...store.savedShortCuts, shortCutItem])
    });

    await updateShortCuts();
}

function addDialog(){
    consts.shortCutPlaceholder = getShortCutView([
        {code: 'Your'},
        {code: 'Shortcut'},
    ]);

    const placeholder = document.createElement('div');
    const html = `
        <dialog id="${consts.dialogId}">
             <div class="shortCutDialogContainer">
                <p class="shortCutDialogTitle">Enter Shortcut</p>
                <p class="shortCutDialogError_title">Invalid Shortcut</p>
                <div id="${consts.contentDialogId}">${consts.shortCutPlaceholder}</div>
                <div class="shortCutDialogControls">
                   <button id="${consts.closeDialogId}">Close</button>
                   <button id="${consts.resetDialogId}">Reset</button>
                   <button id="${consts.saveDialogId}">Save</button>
                </div>
            </div>
        </dialog>
    `;
    placeholder.innerHTML = html.trim();

    const dialog = placeholder.firstChild;
    store.dialog = dialog;
    document.body.appendChild(dialog);

    const close = document.getElementById(consts.closeDialogId);
    close.addEventListener('click', onDialogClose);

    const save = document.getElementById(consts.saveDialogId);
    save.disabled = true;
    save.addEventListener('click', onDialogSave);

    const reset = document.getElementById(consts.resetDialogId);
    reset.addEventListener('click', onDialogReset);
}

function getShortCutName(shortCut){
    return shortCut.map((k) => k.code).join('+');
}

const messageHandler = {
    NEW_SHORT_KEY: onNewShortKey,
    CANCEL: onCancel,
};

chrome.runtime.onMessage.addListener((obj) => {
    const { type } = obj;
    console.log({type});
    const handler = messageHandler[type];
    if(handler) handler();
});

async function start(){
    addDialog();
    store.pageKey = window.location.href;
    await updateShortCuts();

    const handler = (evt) => {
        evt.stopPropagation();
        evt.preventDefault();

        if(evt.type === 'keydown') {
            if(store.triggeredKeys.length >= consts.maxShortCutLength) return;

            const keyItem  = {
                code: evt.code,
                keyCode: evt.keyCode,
            };

            store.triggeredKeys.push(keyItem);
        }

        if(evt.type === 'keyup') {
            if(store.triggeredKeys.length === 0) return;
            const shortCut = store.triggeredKeys;
            store.triggeredKeys = [];

            const isValid = validateShortCut(shortCut);

            if(!isValid) return;

            const name = getShortCutName(shortCut);

            console.log({NAME:name});

            const buttonKey = store.shortcutMap[name];
            if(buttonKey){
                const button = store.keyToButtonMap.get(buttonKey);
                button.click();
            }
        }
    };

    ['keydown', 'keyup', 'keypress'].forEach((eventName) => {
        document.addEventListener(eventName, handler);
    });
}







if (document.readyState !== 'loading') {
    start().then(() => {
        console.log('Ready!');
    });
} else {
    document.addEventListener('DOMContentLoaded', function () {
        start().then(() => {
            console.log('Ready!');
        });
    });
}
