'use strict';

// div.srg = list of search results
// div.rc = single result
//  h3.r > a = the link part of the result
//  span.st = the text part of the result

const fs = require('fs');
require('chromedriver');
const webdriver = require('selenium-webdriver');
const events = require('events');
const sleep = require('system-sleep');
const jsesc = require('jsesc');
var eventEmitter = new events.EventEmitter();
eventEmitter.on('scream', iter);

const driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

const prefix = "https://www.google.co.uk/"
const eltId = 'lst-ib'
const formId = 'tsf'
const deathMessage = 'Our systems have detected unusual traffic from your computer network'

const postCodePtrn = /\b[A-Z]{1,2}[O0-9]{1,2}[A-Z]?\s[0-9][A-Z]{2}\b/;

function matchie(ptrn, s, n) {
    var alpha = ptrn.exec(s);
    if (!alpha) {
        return null;
    }
    var ind = alpha.index;
    var pc = alpha[0];
    var pref = s.slice(ind < n ? 0 : ind - n, ind) + pc;
    return [pc, pref];
}

// This function is not in use
function googSearch(q, cb) {
    driver.get(prefix).then(res => {
        var script = `document.getElementById('${eltId}').value = '"${jsesc(q)}"'`;
        // console.log(script);
        driver.executeScript(script).then(res => {
            driver.executeScript(`document.getElementById('${formId}').submit()`)
                .then(cb);
        });
    });
}

const rl = require('readline').createInterface({
    output: process.stdout, 
    input: process.stdin
});

const all_results = {};
function googSearch2(q, cb) {
    if (q in all_results) {
        cb(true, all_results[q]);
    } else {
        driver.get(prefix + `search?q="${q.replace(' ', '+')}"`).then(res => {
            driver.executeScript(`return /${deathMessage}/.test(document.body.innerText);`).then(res => {
                if (res) {
                    rl.question('Is it safe?', ans => { cb(false, null); });
                } else {
                    cb(false, null);
                }
            });
        });
    }
}

const rstream = fs.createReadStream('input2.csv');
const wstream = fs.createWriteStream('output.csv');

const myscript = `var arr = document.querySelectorAll('span.st');
return [].slice.call(arr).map(elt => elt.innerText);`

const vkbook = `const elt = document.querySelector('.vk_sh.vk_bk');
return elt ? elt.innerText : null;`

var lineReader = require('readline').createInterface({
    input: rstream,
});

var targets = [];

lineReader.on('line', line => {
    line = line.trim();
    if (line[0] == '"') {
        line = line.slice(1, -1);
    }
    targets.push(line.trim());
});

lineReader.on('close', () => {
    iter();
});

var tgt_ind = 0;

function iter() {
    var tgt = targets[tgt_ind];
    if (!tgt) {
        lastbit(`"","",""`)
        return;
    }
    googSearch2(tgt, (b, r) => {
        if (b) {
            let result = r; 
            if (result) {
                lastbit(`"${tgt}","${result[0]}","${result[1]}"`);
            } else {
                lastbit(`"${tgt}","",""`);
            }
        } else {
            driver.executeScript(vkbook).then(zeta => {
                driver.executeScript(myscript).then(res => {
                    const alpha = [zeta].concat(res)
                        .map(s => matchie(postCodePtrn, s, 60))
                        .filter(x => x !== null);
                    const beta = {};
                    const gamma = {};
                    alpha.forEach(tup => {
                        let [pc, ctxt] = tup;
                        if (pc in beta) {
                            beta[pc]++;
                        } else {
                            beta[pc] = 1;
                            gamma[pc] = ctxt;
                        }
                    });
                    let maxCount = 0;
                    let result = null;
                    for (var pc in beta) {
                        if (beta[pc] > maxCount) {
                            maxCount = beta[pc];
                            result = [pc, gamma[pc]];
                        }
                    }

                    sleep(1000 + 5000*Math.random());
                    all_results[tgt] = result;
                    if (result) {
                        lastbit(`"${tgt}","${result[0]}","${result[1]}"`);
                    } else {
                        lastbit(`"${tgt}","",""`);
                    }
                });
            });
        }
    });
}

function lastbit(s) {
    wstream.write(s+'\n');
    tgt_ind += 1;
    if (tgt_ind < targets.length) {
        eventEmitter.emit('scream');
    } else {
        wstream.close();
        driver.close();
    }
}

