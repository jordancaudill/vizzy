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
                textboxes += '<div class="row space-between"><p>' + property + ':</p><input class="vizzy-input" property="' + property + '" type="text" ' + (computedStyles[property] === rule.json[property] ? '' : 'disabled') + ' value="' + rule.json[property] + '"></div>';
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
            let ele = document.querySelector('#vizzy').parentElement;
            ele.setAttribute('style', ev.target.getAttribute('property') + ':' + ev.target.value);
            updateCSS(css);
        });
    });
}

function updateCSS(css) {
    let rules = [];
    css.forEach(function (rule) {
        rules.push({
            selector: rule.selectorText,
            values: rule.json
        });
    });
    //actually, i probably only need to send the rule or property that has changed?
    fetch('http://localhost:35872/', {
        method: 'POST',
        body: JSON.stringify({ rules: rules }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    }).then(res => res.json())
        .catch(error => console.error('Error:', error))
        .then(response => console.log('Success:', response));

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
