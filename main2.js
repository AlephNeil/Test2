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

function googSearch2(q, cb) {
    driver.get(prefix + `search?q="${q.replace(' ', '+')}"`).then(res => {
        cb();
    });
}

const rstream = fs.createReadStream('input.csv');
const wstream = fs.createWriteStream('output.csv');

const myscript = `var arr = document.querySelectorAll('span.st');
return [].slice.call(arr).map(elt => elt.innerText);`

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
    googSearch2(tgt, () => {
        driver.executeScript(myscript).then(res => {
            var alpha = res
                .map(s => matchie(postCodePtrn, s, 60))
                .filter(x => x !== null);
            var beta = {};
            var gamma = {};
            alpha.forEach(tup => {
                var pc = tup[0];
                if (pc in beta) {
                    beta[pc]++;
                } else {
                    beta[pc] = 1;
                    gamma[pc] = tup[1];
                }
            });
            var maxCount = 0;
            var result = null;
            for (var pc in beta) {
                if (beta[pc] > maxCount) {
                    maxCount = beta[pc];
                    result = [pc, gamma[pc]];
                }
            }

            sleep(20000 + 5000*Math.random());

            if (result) {
                lastbit(`"${tgt}","${result[0]}","${result[1]}"`);
            } else {
                lastbit(`"${tgt}","",""`);
            }
        });
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

