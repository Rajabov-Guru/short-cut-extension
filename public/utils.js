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

function getDummyClone(btn){
    // TODO: improve
    btn.removeAttribute("onclick");
    const clone = btn.cloneNode(true);
    clone.removeAttribute("onclick");
    clone.style.animation = `${consts.availableAnimName} 0.5s ease-in-out infinite`;
    return clone;
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

