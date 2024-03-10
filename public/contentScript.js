const store = {
    addSessionStarted: false,
    buttons: [],
    clones: [],
    map: new Map(),

    dialog: null,
};

const consts = {
    availableAnimName: 'pulsate',
    dialogId: 'short_key_dialog',
    closeDialogId: 'short_key_dialog_close',
    saveDialogId: 'short_key_dialog_save',
    contentDialogId: 'short_key_dialog_content',
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
            store.dialog.showModal();
        })
    });
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
    const save = document.getElementById(consts.saveDialogId);
    close.addEventListener('click', () => store.dialog.close());
    save.addEventListener('click', () => {
        console.log('SAVE');
        store.dialog.close();
    });

    const dialogNode = document.getElementById(consts.dialogId);

    ['keydown', 'keyup', 'keypress'].forEach((eventName) => {
        dialogNode.addEventListener(eventName, (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
        });
    });
}

// function onCancel(){
//     resetButtons();
//     if(store.dialog) {
//         store.dialog.close();
//     }
// }

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
    addDialog();
    document.addEventListener('keydown', (evt) => {
        if (evt.key === "Escape") resetButtons();
    });
}

start();
