let enabled = true;
chrome.browserAction.onClicked.addListener(toggle);
function toggle() {
    enabled = !enabled;
    chrome.browserAction.setIcon({ path: 'vizzy_icon_' + (enabled ? 'on' : 'off') + '.png' });
    chrome.browserAction.setTitle({ title: (enabled ? 'Disable' : 'Enable') + ' Vizzy' });
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, enabled);
    });
}