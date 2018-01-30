window.oncontextmenu = vizzyContextMenu;

if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener(function (enabled) {
        if (enabled) {
            window.oncontextmenu = vizzyContextMenu;
        } else {
            window.oncontextmenu = null;
        }
    });
} else {
    window.oncontextmenu = vizzyContextMenu;
}

function vizzyContextMenu(ev) {
    closeVizzy();
    openVizzy(ev.target);
    // cancel default menu
    return false;
};


function openVizzy(el) {
    let css = getCSS(el);
    let computedStyles = window.getComputedStyle(el);
    let test = '<h1>' + getElementTitle(el) + '</h1>';
    for (let r in css) {
        let rule = css[r];
        let textboxes = '<h2>' + rule.selectorText + '</h2>';
        for (let property in rule.json) {
            if (rule.json.hasOwnProperty(property)) {
                textboxes += '<div class="row space-between"><p>' + property + ':</p><input class="vizzy-input" selector="' + rule.selectorText + '" property="' + property + '" type="text" ' + (computedStyles[property] === rule.json[property] ? '' : 'disabled') + ' value="' + rule.json[property] + '"></div>';
            }
        }
        test += textboxes;
    }
    let newMenu = createElementFromHTML('<div id="vizzy"><h6>' + test + '</h6> <button id="vizzy-close">X</button></div>');
    el.appendChild(newMenu);
    let closeButton = document.querySelector('#vizzy-close');
    if (closeButton) {
        closeButton.addEventListener('mousedown', closeVizzy);
    }
    let inputs = document.querySelectorAll('.vizzy-input');
    inputs.forEach(function (input) {
        input.addEventListener('keyup', function (ev) {
            let property = ev.target.getAttribute('property');
            let value = ev.target.value;
            let selector = ev.target.getAttribute('selector');
            let elements = document.querySelectorAll(selector);
            elements.forEach(function (ele) {
                ele.setAttribute('style', property + ':' + value);
            });
            for (let i = 0; i < css.length; i++) {
                if (css[i].selectorText === selector) {
                    css[i].json[property] = value;
                    updateRule(css[i]);
                    break;
                }
            }
        });
    });
}

function updateRule(cssObject) {
    let rule = {
        selector: cssObject.selectorText,
        values: cssObject.json
    };
    fetch('http://localhost:35872/', {
        method: 'POST',
        body: JSON.stringify(rule),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    });
}

function rgbToHex(rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
}

function getElementTitle(el) {
    let elementTitle = el.nodeName.toLowerCase();
    if (el.id) {
        elementTitle += ('#' + el.id);
    }
    if (el.className.length > 0) {
        elementTitle += ('.' + el.className.replace(/\s/g, '.'));
    }
    return elementTitle;
}

function closeVizzy() {
    let oldMenu = document.getElementById('vizzy');
    if (oldMenu) {
        oldMenu.remove();
    }
}

function createElementFromHTML(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}

function getCSS(el) {
    let sheets = document.styleSheets, ret = [];
    el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector
        || el.msMatchesSelector || el.oMatchesSelector;
    for (let i in sheets) {
        let rules = sheets[i].rules || sheets[i].cssRules;
        for (let r in rules) {
            rules[r].json = {};
            if (el.matches(rules[r].selectorText)) {
                let y = 0;
                while (sheets[i].rules[r].style[y]) {
                    rules[r].json[sheets[i].rules[r].style[y]] = sheets[i].rules[r].style[sheets[i].rules[r].style[y]];
                    y++;
                }
                ret.push(rules[r]);
            }
        }
    }
    return ret;
}
