const store = {
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

const consts = {
    availableAnimName: 'pulsate',

    dialogId: 'short_key_dialog',
    closeDialogId: 'short_key_dialog_close',
    saveDialogId: 'short_key_dialog_save',
    contentDialogId: 'short_key_dialog_content',

    maxShortCutLength: 3,
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
            store.targetButton = store.map.get(clone);
            resetButtons();
            onSelectButton();
        })
    });
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

        if(evt.type === 'keyup') {
            store.keysEntered = true;
            console.log(store.targetKeys);
        }
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
}

function onClose(){
    store.dialog.close();
    ['keydown', 'keyup', 'keypress'].forEach((eventName) => {
        store.dialog.removeEventListener(eventName, store.dialogKeyListener);
    });
    store.targetButton = null;
    store.targetKeys = [];
    store.keysEntered = false;
}

function onSave(){
    onClose();
}

function addDialog(){
    const placeholder = document.createElement('div');
    const html = `
        <dialog id="${consts.dialogId}">
             <div class="container">
                <h3 class="title">Enter short-key</h3>
                <div id="${consts.contentDialogId}"></div>
                <div class="dialog_controls">
                   <button id="${consts.closeDialogId}">Close</button>
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
    close.addEventListener('click', onClose);

    const save = document.getElementById(consts.saveDialogId);
    save.addEventListener('click', onSave);
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
