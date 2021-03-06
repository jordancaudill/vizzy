window.oncontextmenu = vizzyContextMenu;

if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener(function(enabled) {
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
    let elementSelectors = getElementSelectors(el);
    let headerText = elementSelectors.join('');
    let computedStyles = window.getComputedStyle(el);
    let last = '<h1>' + headerText + '</h1>';

    for (let r in css) {
        let rule = css[r];
        let textboxes = '<h2>' + rule.selectorText + '</h2>';
        let cssForInput = rule.cssText.replace(rule.selectorText + ' { ', '');
        cssForInput = cssForInput.replace(/;+\s/g, ';\n');
        cssForInput = cssForInput.replace('}', '');
        textboxes += '<textarea class="vizzy-input" style="height: ' + ((Object.keys(rule.json).length + 1) * 20) + 'px" selector="' + rule.selectorText + '">' + cssForInput + '</textarea>';
        // for (let property in rule.json) {
        //     if (rule.json.hasOwnProperty(property)) {
        //         textboxes += '<div class="row space-between"><p>' + property + ':</p><input class="vizzy-input" selector="' + rule.selectorText + '" property="' + property + '" type="text" ' + (computedStyles[property] === rule.json[property] ? '' : 'disabled') + ' value="' + rule.json[property] + '"></div>';
        //     }
        // }
        last += textboxes;
    }
    last += '<form target="hiddenFrame" class="row vizzy-new-prop-form"><input type="text" class="vizzy-new-prop"><button type="submit" class="vizzy-add-prop">+</button></form>';
    let newMenu = createElementFromHTML('<div id="vizzy"><iframe id="hiddenFrame" name="hiddenFrame"></iframe><h6>' + last + '</h6><button id="vizzy-close">X</button></div>');
    el.appendChild(newMenu);
    let closeButton = document.querySelector('#vizzy-close');
    if (closeButton) {
        closeButton.addEventListener('mousedown', closeVizzy);
    }
    let newPropForms = document.querySelectorAll('.vizzy-new-prop-form');
    newPropForms.forEach(function(form) {
        form.addEventListener('submit', function(ev) {
            let thisForm = ev.target;
            console.log(thisForm.parentElement)
        });
    });
    let inputs = document.querySelectorAll('.vizzy-input');
    let typing = false;
    inputs.forEach(function(input) {
        input.addEventListener('keyup', function(ev) {
            typing = true;
            setTimeout(function() {
                typing = false;
                if (!typing) {
                    let value = ev.target.value;
                    let selector = ev.target.getAttribute('selector');
                    for (let i = 0; i < css.length; i++) {
                        if (css[i].selectorText === selector) {
                            updateRule(selector, value);
                            break;
                        }
                    }
                }
            }, 800);
        });
    });
}

function updateRule(selector, value) {
    let rule = {
        selector: selector,
        values: value
    };
    fetch('http://localhost:35872/', {
            method: 'POST',
            body: JSON.stringify(rule),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        }).then(res => res.json())
        .catch(error => console.error('Error:', error))
        .then(response => {
            let stylesheets = document.querySelectorAll('link');
            for (let i = 0; i < stylesheets.length; i++) {
                if (stylesheets[i].getAttribute('href').indexOf(response.filePath) > -1) {
                    stylesheets[i].setAttribute('href', stylesheets[i].baseURI + response.filePath + '?' + Date.now());
                }
            }
        });
}

function getElementSelectors(el) {
    let ret = [];
    ret.push(el.nodeName.toLowerCase());
    if (el.id) {
        ret.push('#' + el.id);
    }
    if (el.className.length > 0) {
        let classes = el.className.split(' ');
        for (var i = 0; i < classes.length; i++) {
            ret.push('.' + classes[i]);
        }
    }
    return ret;
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
    let sheets = document.styleSheets,
        ret = [];
    el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector ||
        el.msMatchesSelector || el.oMatchesSelector;
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