var store = {
    addSessionStarted: false,
    buttons: [],
    clones: [],
    map: new Map(),

    targetButton: null,

    dialog: null,
    dialogKeyListener: null,

    targetKeys: [],
    keysEntered: false,

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
            store.targetButton = store.map.get(clone);
            resetButtons();
            onSelectButton();
        })
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

    const first = shortcut[0];

    return !(first.keyCode !== 16
        && first.keyCode !== 17
        && first.keyCode !== 18);
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

    [
     'keydown',
     'keyup',
     'keypress'
    ].forEach((eventName) => store.dialog.addEventListener(eventName, handler));

    store.dialog.showModal();
}

function onCancel(){
    resetButtons();
    if(store.dialog) {
        store.dialog.close();
    }
    store.addSessionStarted = false;
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

function onDialogSave(){
    onDialogClose();
}

function addDialog(){
    consts.shortCutPlaceholder = getShortCutView([
        {code: 'Your'},
        {code: 'Shortcut'},
    ]);

    const placeholder = document.createElement('div');
    const html = `
        <dialog id="${consts.dialogId}">
             <div class="container">
                <p class="title">Enter Shortcut</p>
                <p class="error_title">Invalid Shortcut</p>
                <div id="${consts.contentDialogId}">${consts.shortCutPlaceholder}</div>
                <div class="dialog_controls">
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

function start(){
    addDialog();
    document.addEventListener('keydown', (evt) => {
        if (evt.key === "Escape") onCancel();
    });
}

start();
