'use strict';

// div.srg = list of search results
// div.rc = single result
//  h3.r > a = the link part of the result
//  span.st = the text part of the result

const fs = require('fs');
require('chromedriver');
const webdriver = require('selenium-webdriver');
var events = require('events');
var eventEmitter = new events.EventEmitter();

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
        var script = `document.getElementById('${eltId}').value = '"${q}"'`;
        // console.log(script);
        driver.executeScript(script).then(res => {
            driver.executeScript(`document.getElementById('${formId}').submit()`)
                .then(cb);
        });
    });
}

const rstream = fs.createReadStream('input.csv');
const wstream = fs.createWriteStream('output.csv');

console.log('here');
const myscript = `var arr = document.querySelectorAll('span.st');
return [].slice.call(arr).map(elt => elt.innerText);`

var targets = [
    '32 Harbury Road, Carshalton',
    '46 Woodcote Road, Wallington',
    '43 Osmond Gardens, Wallington',
];

var tgt_ind = 0;

function iter() {
    var tgt = targets[tgt_ind];
    googSearch(tgt, () => {
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
            wstream.write(`"${tgt}","${result[0]}","${result[1]}"\n`);
            // console.log(`"${tgt}","${result[0]}","${result[1]}"\n`);
            // console.log(result);
            tgt_ind += 1;
            if (tgt_ind < targets.length) {
                eventEmitter.emit('scream');
            } else {
                wstream.close();
            }
        });
    });
}
eventEmitter.on('scream', iter);
iter();